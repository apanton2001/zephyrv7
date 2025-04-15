"""
Mixed Precision Training Implementation

This module provides implementations for mixed precision training as described in
the Ultra-Scale Playbook. Using lower precision formats (FP16/BF16) can significantly 
accelerate training while reducing memory usage.

Commercial applications:
- 2-3x training speedup on compatible hardware
- Reduced memory footprint (up to 50%)
- Enable training larger models on consumer hardware
"""

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from typing import Optional, Callable, Dict, Any, Union, Tuple, List
import time
import logging
import contextlib

logger = logging.getLogger(__name__)


class MixedPrecisionTrainer:
    """
    Trainer implementing mixed precision training techniques from the Ultra-Scale Playbook.
    
    This implementation uses PyTorch's native AMP (Automatic Mixed Precision) for FP16 training
    and extends it with custom functionality for BF16 training and advanced monitoring.
    """
    
    def __init__(
        self,
        precision: str = "fp16",  # "fp16", "bf16", or "fp32"
        initial_scale: float = 2**16,
        min_scale: float = 1.0,
        growth_factor: float = 2.0,
        backoff_factor: float = 0.5,
        growth_interval: int = 2000,
        enabled: bool = True,
        log_interval: int = 10,
        stability_monitoring: bool = True,
        callback: Optional[Callable[[Dict[str, Any]], None]] = None
    ):
        """
        Initialize a MixedPrecisionTrainer.
        
        Args:
            precision: Precision to use ("fp16", "bf16", or "fp32")
            initial_scale: Initial loss scale for FP16 training
            min_scale: Minimum loss scale value
            growth_factor: Factor by which to grow the loss scale
            backoff_factor: Factor by which to reduce the loss scale
            growth_interval: Steps between loss scale increases
            enabled: Whether mixed precision is enabled
            log_interval: How often to log progress (in steps)
            stability_monitoring: Enable monitoring training stability
            callback: Optional callback function called after each step
        """
        self.precision = precision.lower()
        self.initial_scale = initial_scale
        self.min_scale = min_scale
        self.growth_factor = growth_factor
        self.backoff_factor = backoff_factor
        self.growth_interval = growth_interval
        self.enabled = enabled and torch.cuda.is_available()  # Only enable if CUDA is available
        self.log_interval = log_interval
        self.stability_monitoring = stability_monitoring
        self.callback = callback
        
        # Initialize AMP gradient scaler if using fp16
        self.scaler = None
        if self.enabled and self.precision == "fp16":
            self.scaler = torch.cuda.amp.GradScaler(
                init_scale=initial_scale,
                growth_factor=growth_factor,
                backoff_factor=backoff_factor,
                growth_interval=growth_interval,
                enabled=True
            )
        
        # For stability monitoring
        self.loss_history = []
        self.grad_norm_history = []
        self.scale_history = []
        self.overflow_counter = 0
        
    @contextlib.contextmanager
    def autocast_context(self):
        """
        Context manager for automatic casting based on selected precision.
        """
        if not self.enabled:
            # No mixed precision, use FP32
            yield
        elif self.precision == "fp16":
            # Use PyTorch's autocast for FP16
            with torch.cuda.amp.autocast(dtype=torch.float16):
                yield
        elif self.precision == "bf16":
            # Use PyTorch's autocast for BF16 (available in newer PyTorch versions)
            if hasattr(torch.cuda.amp, "autocast") and hasattr(torch, "bfloat16"):
                with torch.cuda.amp.autocast(dtype=torch.bfloat16):
                    yield
            else:
                logger.warning("BF16 autocast not available in your PyTorch version. Falling back to FP32.")
                yield
        else:
            # Default to FP32
            yield
    
    def backward(self, loss: torch.Tensor):
        """
        Perform backward pass with appropriate scaling.
        
        Args:
            loss: Loss tensor from forward pass
        
        Returns:
            bool: Whether backward was successful (for overflow detection)
        """
        if not self.enabled or self.precision not in ["fp16"]:
            # Standard backward for fp32 or bf16
            loss.backward()
            return True
        
        # FP16 needs gradient scaling to prevent underflow
        return self.scaler.scale(loss).backward()
    
    def optimizer_step(self, optimizer: torch.optim.Optimizer, **kwargs):
        """
        Perform optimizer step with appropriate unscaling.
        
        Args:
            optimizer: Optimizer to update parameters
            **kwargs: Additional arguments to pass to optimizer.step()
        
        Returns:
            bool: Whether optimizer step was successful
        """
        if not self.enabled or self.precision not in ["fp16"]:
            # Standard optimizer step for fp32 or bf16
            optimizer.step(**kwargs)
            return True
        
        # For FP16, we use the scaler to handle optimizer step
        return self.scaler.step(optimizer, **kwargs)
    
    def update_scaler(self):
        """
        Update the gradient scaler.
        
        Only applicable for FP16 training.
        """
        if self.enabled and self.precision == "fp16" and self.scaler is not None:
            self.scaler.update()
    
    def compute_grad_norm(self, model: nn.Module) -> float:
        """
        Compute gradient norm for monitoring training stability.
        
        Args:
            model: Model to compute gradient norm for
            
        Returns:
            Gradient norm
        """
        total_norm = 0.0
        for p in model.parameters():
            if p.grad is not None:
                param_norm = p.grad.detach().data.norm(2)
                total_norm += param_norm.item() ** 2
        total_norm = total_norm ** 0.5
        return total_norm
    
    def check_training_stability(self) -> Dict[str, Any]:
        """
        Check training stability based on loss history and gradient norms.
        
        Returns:
            Dictionary with stability metrics
        """
        if len(self.loss_history) < 5:
            return {"stable": True, "concerns": []}
        
        concerns = []
        
        # Check for NaN losses
        if any(torch.isnan(torch.tensor(self.loss_history[-5:])).tolist()):
            concerns.append("NaN values detected in loss")
        
        # Check for exploding gradients
        if len(self.grad_norm_history) >= 5:
            recent_norms = self.grad_norm_history[-5:]
            if any(norm > 100 for norm in recent_norms):
                concerns.append("Large gradient norms detected")
            
            # Check for gradient growth trend
            if all(recent_norms[i] > recent_norms[i-1] * 1.5 for i in range(1, len(recent_norms))):
                concerns.append("Consistent gradient growth detected")
        
        # Check for frequent scale adjustments (FP16 only)
        if self.precision == "fp16" and len(self.scale_history) >= 10:
            changes = sum(1 for i in range(1, len(self.scale_history)) 
                         if self.scale_history[i] != self.scale_history[i-1])
            if changes >= 5:  # More than 50% of steps had scale changes
                concerns.append("Frequent loss scale adjustments detected")
        
        return {
            "stable": len(concerns) == 0,
            "concerns": concerns,
            "overflow_count": self.overflow_counter
        }
    
    def train(
        self,
        model: nn.Module,
        dataloader: DataLoader,
        optimizer: torch.optim.Optimizer,
        criterion: Callable,
        device: torch.device = torch.device("cuda" if torch.cuda.is_available() else "cpu"),
        epochs: int = 1,
        scheduler: Optional[torch.optim.lr_scheduler._LRScheduler] = None,
        accumulation_steps: int = 1,
        clip_grad_norm: Optional[float] = None,
        max_steps: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Train the model using mixed precision.
        
        Args:
            model: The model to train
            dataloader: DataLoader providing training data
            optimizer: Optimizer for updating model parameters
            criterion: Loss function
            device: Device to train on
            epochs: Number of epochs to train
            scheduler: Optional learning rate scheduler
            accumulation_steps: Number of steps to accumulate gradients
            clip_grad_norm: Optional gradient clipping value
            max_steps: Optional maximum number of steps to train
            
        Returns:
            Dictionary containing training statistics
        """
        model.to(device)
        model.train()
        
        orig_dtype = next(model.parameters()).dtype
        
        # Convert model to appropriate dtype if using BF16
        if self.enabled and self.precision == "bf16" and hasattr(torch, "bfloat16"):
            model.to(torch.bfloat16)
        
        stats = {
            "train_loss": [],
            "train_time": 0,
            "steps": 0,
            "precision": self.precision,
            "effective_batch_size": len(next(iter(dataloader))[0]) * accumulation_steps
        }
        
        start_time = time.time()
        step = 0
        
        for epoch in range(epochs):
            epoch_loss = 0.0
            optimizer.zero_grad()
            
            for i, (inputs, targets) in enumerate(dataloader):
                # Move data to device
                inputs = inputs.to(device)
                targets = targets.to(device)
                
                # Forward pass with autocast
                with self.autocast_context():
                    outputs = model(inputs)
                    loss = criterion(outputs, targets) / accumulation_steps
                
                # Backward pass with scaling if needed
                self.backward(loss)
                
                epoch_loss += loss.item() * accumulation_steps
                self.loss_history.append(loss.item() * accumulation_steps)
                
                # Update weights if we've accumulated enough gradients
                if (i + 1) % accumulation_steps == 0 or (i + 1 == len(dataloader)):
                    # Gradient clipping (if enabled)
                    if clip_grad_norm is not None:
                        if self.precision == "fp16" and self.scaler is not None:
                            # Unscale gradients for clipping
                            self.scaler.unscale_(optimizer)
                        
                        # Compute gradient norm for monitoring
                        grad_norm = self.compute_grad_norm(model)
                        self.grad_norm_history.append(grad_norm)
                        
                        # Perform gradient clipping
                        torch.nn.utils.clip_grad_norm_(model.parameters(), clip_grad_norm)
                    
                    # Optimizer step
                    success = self.optimizer_step(optimizer)
                    
                    # Update scaler for FP16
                    if self.precision == "fp16":
                        self.scale_history.append(self.scaler.get_scale())
                        if not success:
                            self.overflow_counter += 1
                        self.update_scaler()
                    
                    # Zero gradients
                    optimizer.zero_grad()
                    
                    # Update learning rate
                    if scheduler is not None:
                        scheduler.step()
                    
                    step += 1
                    stats["steps"] = step
                    
                    # Check training stability
                    if self.stability_monitoring and step % 20 == 0:
                        stability = self.check_training_stability()
                        if not stability["stable"]:
                            logger.warning(f"Training stability concerns: {stability['concerns']}")
                    
                    # Log progress
                    if step % self.log_interval == 0:
                        current_lr = optimizer.param_groups[0]['lr']
                        scale_info = ""
                        if self.precision == "fp16" and self.scaler is not None:
                            scale_info = f", Scale: {self.scaler.get_scale():.1f}"
                            
                        logger.info(
                            f"Epoch: {epoch+1}/{epochs}, Step: {step}, "
                            f"Loss: {epoch_loss/(i+1):.4f}, "
                            f"LR: {current_lr:.6f}{scale_info}"
                        )
                    
                    # Execute callback if provided
                    if self.callback is not None:
                        self.callback({
                            "epoch": epoch,
                            "step": step,
                            "loss": epoch_loss/(i+1),
                            "model": model,
                            "optimizer": optimizer,
                            "precision": self.precision
                        })
                    
                    # Check if we've reached max_steps
                    if max_steps is not None and step >= max_steps:
                        stats["train_loss"] = epoch_loss / (i + 1)
                        stats["train_time"] = time.time() - start_time
                        
                        # Return model to original dtype
                        if self.enabled and self.precision == "bf16":
                            model.to(orig_dtype)
                        
                        return stats
            
            stats["train_loss"].append(epoch_loss / len(dataloader))
        
        stats["train_time"] = time.time() - start_time
        
        # Return model to original dtype
        if self.enabled and self.precision == "bf16":
            model.to(orig_dtype)
        
        return stats


def train_with_mixed_precision(
    model: nn.Module,
    dataloader: DataLoader,
    optimizer: torch.optim.Optimizer,
    criterion: Callable,
    precision: str = "fp16",
    **kwargs
) -> Dict[str, Any]:
    """
    Convenience function for training with mixed precision.
    
    Args:
        model: The model to train
        dataloader: DataLoader providing training data
        optimizer: Optimizer for updating model parameters
        criterion: Loss function
        precision: Precision to use ("fp16", "bf16", or "fp32")
        **kwargs: Additional arguments to pass to MixedPrecisionTrainer.train()
        
    Returns:
        Dictionary containing training statistics
    """
    trainer = MixedPrecisionTrainer(precision=precision)
    return trainer.train(model, dataloader, optimizer, criterion, **kwargs)


# Example usage
if __name__ == "__main__":
    # Simple example to demonstrate usage
    import torch.nn.functional as F
    from torch.utils.data import TensorDataset
    
    # Create a simple model
    model = nn.Sequential(
        nn.Linear(10, 50),
        nn.ReLU(),
        nn.Linear(50, 2)
    )
    
    # Generate some dummy data
    data = torch.randn(100, 10)
    targets = torch.randint(0, 2, (100,))
    
    # Create a DataLoader
    dataset = TensorDataset(data, targets)
    dataloader = DataLoader(dataset, batch_size=16)
    
    # Create an optimizer
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    
    # Define loss function
    criterion = F.cross_entropy
    
    # Train with mixed precision
    stats = train_with_mixed_precision(
        model, 
        dataloader, 
        optimizer,
        criterion,
        precision="fp16",  # Try "bf16" on newer hardware that supports it
        epochs=2,
        accumulation_steps=4  # Compatible with gradient accumulation!
    )
    
    print(f"Training completed in {stats['train_time']:.2f} seconds")
    print(f"Final loss: {stats['train_loss'][-1]:.4f}")
    print(f"Effective batch size: {stats['effective_batch_size']}")
    print(f"Precision used: {stats['precision']}")
