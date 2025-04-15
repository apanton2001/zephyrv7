"""
Gradient Accumulation Implementation

This module provides functionality for gradient accumulation, allowing training with
larger effective batch sizes while using limited memory. This technique is described
in the Ultra-Scale Playbook for training LLMs.

Commercial applications:
- Enable training larger models on consumer hardware
- Reduce hardware requirements for enterprise training
- Support for resource-constrained environments
"""

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from typing import Optional, Callable, Dict, Any, Union
import time
import logging

logger = logging.getLogger(__name__)


class GradientAccumulator:
    """
    A wrapper for gradient accumulation training.
    
    This implementation allows effective training with larger batch sizes than would
    fit in available memory, by performing multiple forward/backward passes before
    updating model parameters.
    """
    
    def __init__(
        self, 
        accumulation_steps: int = 1,
        clip_grad_norm: Optional[float] = None,
        log_interval: int = 10,
        callback: Optional[Callable[[Dict[str, Any]], None]] = None
    ):
        """
        Initialize a GradientAccumulator.
        
        Args:
            accumulation_steps: Number of forward/backward passes to accumulate before optimizer step
            clip_grad_norm: Optional gradient clipping value
            log_interval: How often to log progress (in steps)
            callback: Optional callback function called after each optimizer step
        """
        self.accumulation_steps = accumulation_steps
        self.clip_grad_norm = clip_grad_norm
        self.log_interval = log_interval
        self.callback = callback
        
    def train(
        self,
        model: nn.Module,
        dataloader: DataLoader,
        optimizer: torch.optim.Optimizer,
        criterion: Callable,
        device: torch.device = torch.device("cuda" if torch.cuda.is_available() else "cpu"),
        epochs: int = 1,
        scheduler: Optional[torch.optim.lr_scheduler._LRScheduler] = None,
        scaler: Optional[torch.cuda.amp.GradScaler] = None,
        max_steps: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Train the model using gradient accumulation.
        
        Args:
            model: The model to train
            dataloader: DataLoader providing training data
            optimizer: Optimizer for updating model parameters
            criterion: Loss function
            device: Device to train on
            epochs: Number of epochs to train
            scheduler: Optional learning rate scheduler
            scaler: Optional gradient scaler for mixed precision training
            max_steps: Optional maximum number of steps to train
            
        Returns:
            Dictionary containing training statistics
        """
        model.to(device)
        model.train()
        
        stats = {
            "train_loss": [],
            "train_time": 0,
            "steps": 0,
            "effective_batch_size": len(next(iter(dataloader))[0]) * self.accumulation_steps
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
                
                # Forward pass
                if scaler is not None:
                    # Mixed precision forward pass
                    with torch.cuda.amp.autocast():
                        outputs = model(inputs)
                        loss = criterion(outputs, targets) / self.accumulation_steps
                    # Scale and backward pass
                    scaler.scale(loss).backward()
                else:
                    # Standard forward/backward
                    outputs = model(inputs)
                    loss = criterion(outputs, targets) / self.accumulation_steps
                    loss.backward()
                
                epoch_loss += loss.item() * self.accumulation_steps
                
                # Update weights if we've accumulated enough gradients
                if (i + 1) % self.accumulation_steps == 0 or (i + 1 == len(dataloader)):
                    # Gradient clipping (if enabled)
                    if self.clip_grad_norm is not None:
                        if scaler is not None:
                            scaler.unscale_(optimizer)
                        torch.nn.utils.clip_grad_norm_(model.parameters(), self.clip_grad_norm)
                    
                    # Optimizer step
                    if scaler is not None:
                        scaler.step(optimizer)
                        scaler.update()
                    else:
                        optimizer.step()
                    
                    # Zero gradients
                    optimizer.zero_grad()
                    
                    # Update learning rate
                    if scheduler is not None:
                        scheduler.step()
                    
                    step += 1
                    stats["steps"] = step
                    
                    # Log progress
                    if step % self.log_interval == 0:
                        logger.info(
                            f"Epoch: {epoch+1}/{epochs}, Step: {step}, "
                            f"Loss: {epoch_loss/(i+1):.4f}, "
                            f"LR: {optimizer.param_groups[0]['lr']:.6f}"
                        )
                    
                    # Execute callback if provided
                    if self.callback is not None:
                        self.callback({
                            "epoch": epoch,
                            "step": step,
                            "loss": epoch_loss/(i+1),
                            "model": model,
                            "optimizer": optimizer
                        })
                    
                    # Check if we've reached max_steps
                    if max_steps is not None and step >= max_steps:
                        stats["train_loss"] = epoch_loss / (i + 1)
                        stats["train_time"] = time.time() - start_time
                        return stats
            
            stats["train_loss"].append(epoch_loss / len(dataloader))
        
        stats["train_time"] = time.time() - start_time
        return stats


def train_with_gradient_accumulation(
    model: nn.Module,
    dataloader: DataLoader,
    optimizer: torch.optim.Optimizer,
    accumulation_steps: int = 1,
    **kwargs
) -> Dict[str, Any]:
    """
    Convenience function for training with gradient accumulation.
    
    Args:
        model: The model to train
        dataloader: DataLoader providing training data
        optimizer: Optimizer for updating model parameters
        accumulation_steps: Number of steps to accumulate gradients
        **kwargs: Additional arguments to pass to GradientAccumulator.train()
        
    Returns:
        Dictionary containing training statistics
    """
    accumulator = GradientAccumulator(accumulation_steps=accumulation_steps)
    return accumulator.train(model, dataloader, optimizer, **kwargs)


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
    
    # Train with gradient accumulation (effective batch size = 16 * 4 = 64)
    stats = train_with_gradient_accumulation(
        model, 
        dataloader, 
        optimizer,
        accumulation_steps=4,
        criterion=criterion,
        epochs=2
    )
    
    print(f"Training completed in {stats['train_time']:.2f} seconds")
    print(f"Final loss: {stats['train_loss'][-1]:.4f}")
    print(f"Effective batch size: {stats['effective_batch_size']}")
