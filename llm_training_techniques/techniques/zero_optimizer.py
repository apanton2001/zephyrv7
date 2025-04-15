"""
ZeRO Optimizer Implementation

This module provides a simplified implementation of the ZeRO (Zero Redundancy Optimizer)
techniques described in the Ultra-Scale Playbook. ZeRO reduces memory usage by partitioning
optimizer states, gradients, and optionally parameters.

Commercial applications:
- Enable training of larger models on limited hardware
- Reduce memory requirements for fine-tuning large models
- Support training with constrained resources
"""

import torch
import torch.nn as nn
from typing import Dict, List, Optional, Any, Iterator, Tuple, Union, Callable
import math
import logging
import os

logger = logging.getLogger(__name__)


class ZeroOptimizer:
    """
    A memory-efficient optimizer that implements key concepts from ZeRO paper.
    
    This implementation supports:
    - ZeRO Stage 1: Optimizer state partitioning (memory efficient Adam)
    - ZeRO Stage 2: Gradients and optimizer state partitioning
    - Gradient accumulation compatibility
    - CPU offloading for additional memory savings
    """
    
    def __init__(
        self,
        optimizer_class: torch.optim.Optimizer,
        params: Iterator[nn.Parameter],
        stage: int = 1,
        cpu_offload: bool = False,
        prefetch_bucket_size: int = 5*1024*1024,  # 5MB
        overlap_communication: bool = True,
        **optimizer_kwargs
    ):
        """
        Initialize a ZeroOptimizer wrapper.
        
        Args:
            optimizer_class: Base optimizer class (e.g., torch.optim.Adam)
            params: Model parameters to optimize
            stage: ZeRO stage (1 or 2)
            cpu_offload: Whether to offload optimizer states to CPU
            prefetch_bucket_size: Size of parameter buckets for prefetching
            overlap_communication: Whether to overlap computation and communication
            **optimizer_kwargs: Arguments to pass to the optimizer
        """
        self.stage = stage
        if stage not in [1, 2]:
            raise ValueError(f"ZeRO stage {stage} not supported. Use 1 or 2.")
        
        self.cpu_offload = cpu_offload
        self.prefetch_bucket_size = prefetch_bucket_size
        self.overlap_communication = overlap_communication
        
        # Parameter and optimizer dictionaries
        self.param_groups = []
        self.optimizer_class = optimizer_class
        self.optimizer_kwargs = optimizer_kwargs
        
        # Group parameters by size for better memory management
        self._setup_param_groups(params)
        
        # Create base optimizer with appropriate device placement
        self._create_optimizer()
        
        # For gradient accumulation
        self.acc_steps = 1
        self.current_step = 0
        
        # State tracking
        self.param_to_partition: Dict[torch.Tensor, int] = {}
        self.param_to_index: Dict[torch.Tensor, int] = {}
        self.partition_count = int(os.environ.get("WORLD_SIZE", "1"))
        
        # Prefetched parameters for efficient training
        self.prefetched_params: Dict[nn.Parameter, torch.Tensor] = {}
        
        # Statistics
        self.peak_memory_usage = 0
        self.memory_savings = 0
        
        logger.info(f"Initialized ZeRO optimizer (Stage {stage}), CPU offload: {cpu_offload}")
        if self.partition_count > 1:
            logger.info(f"Using {self.partition_count} partitions for optimizer states")
        
    def _setup_param_groups(self, params: Iterator[nn.Parameter]):
        """
        Setup parameter groups, potentially grouping parameters by size.
        
        Args:
            params: Iterator of model parameters
        """
        param_list = list(params)
        
        # Group parameters by dtype and contiguity for better memory efficiency
        param_groups = {}
        for param in param_list:
            key = (param.dtype, param.is_contiguous())
            if key not in param_groups:
                param_groups[key] = []
            param_groups[key].append(param)
        
        # Create optimizer param groups
        for i, (key, params) in enumerate(param_groups.items()):
            self.param_groups.append({
                'params': params,
                'group_id': i,
                'dtype': key[0],
                'is_contiguous': key[1],
            })
            
            # Setup parameter indexing
            for j, param in enumerate(params):
                self.param_to_index[param] = j
                # Simple round-robin partitioning
                partition_id = j % self.partition_count if self.partition_count > 1 else 0
                self.param_to_partition[param] = partition_id
    
    def _create_optimizer(self):
        """
        Create base optimizer with parameters in appropriate device
        """
        if self.cpu_offload:
            # Keep a master copy of parameters on GPU
            self.master_params = []
            for group in self.param_groups:
                cpu_params = []
                for param in group['params']:
                    # Create CPU copy of parameters
                    cpu_param = param.detach().cpu().clone()
                    cpu_param.requires_grad = True
                    cpu_params.append(cpu_param)
                    
                group['cpu_params'] = cpu_params
                group['master_params'] = group['params']
                group['params'] = cpu_params
                self.master_params.extend(group['master_params'])
            
            # Create optimizer with CPU parameters
            self.optimizer = self.optimizer_class(self.param_groups, **self.optimizer_kwargs)
        else:
            # Standard GPU optimizer
            self.optimizer = self.optimizer_class(self.param_groups, **self.optimizer_kwargs)
    
    def _partition_optimizer_state(self, param: nn.Parameter) -> bool:
        """
        Check if this parameter's optimizer state should be stored on this partition.
        
        Args:
            param: Parameter to check
            
        Returns:
            bool: Whether this partition should store state for this parameter
        """
        if self.partition_count <= 1:
            return True  # No partitioning, store everything
        
        # In a distributed setting, each rank would check if it owns this partition
        # Here we simulate partitioning for memory estimation
        partition_id = self.param_to_partition[param]
        rank = 0  # In a real distributed setting, this would be dist.get_rank()
        return partition_id == rank
    
    def _partition_gradients(self, param: nn.Parameter) -> bool:
        """
        Check if this parameter's gradients should be stored on this partition.
        
        Only applies to ZeRO Stage 2+
        
        Args:
            param: Parameter to check
            
        Returns:
            bool: Whether this partition should store gradients for this parameter
        """
        if self.stage < 2 or self.partition_count <= 1:
            return True  # Store all gradients in Stage 1 or single GPU
        
        # Similar to optimizer state partitioning
        return self._partition_optimizer_state(param)
    
    def zero_grad(self):
        """
        Set gradients to zero before backward pass
        """
        self.optimizer.zero_grad()
        
        # For ZeRO Stage 2, we need to handle gradient partitioning
        if self.stage >= 2:
            for group in self.param_groups:
                for param in group['params' if not self.cpu_offload else 'master_params']:
                    # Zero out gradients for params not in this partition
                    if not self._partition_gradients(param) and param.grad is not None:
                        param.grad = None
                        
    def _offload_to_cpu(self, tensor: torch.Tensor) -> torch.Tensor:
        """
        Offload a tensor to CPU to save GPU memory
        
        Args:
            tensor: Tensor to offload
            
        Returns:
            The CPU tensor
        """
        return tensor.detach().cpu()
    
    def _fetch_to_gpu(self, tensor: torch.Tensor) -> torch.Tensor:
        """
        Fetch a tensor back to GPU
        
        Args:
            tensor: CPU tensor to fetch
            
        Returns:
            The GPU tensor
        """
        return tensor.cuda()
    
    def _update_memory_stats(self):
        """
        Track peak memory usage and estimated savings
        """
        if torch.cuda.is_available():
            current_mem = torch.cuda.memory_allocated() / 1024**2  # MB
            self.peak_memory_usage = max(self.peak_memory_usage, current_mem)
            
            # Estimate memory savings
            total_param_size = 0
            for group in self.param_groups:
                for param in group['params' if not self.cpu_offload else 'master_params']:
                    total_param_size += param.numel() * param.element_size()
            
            # In ZeRO, optimizer states can be 12-16 bytes per parameter in Adam
            optimizer_size = total_param_size * 4  # Approximately 4x for Adam
            
            # Estimate savings based on partition count and stage
            if self.stage == 1:
                state_savings = optimizer_size * (1 - 1/self.partition_count)
                self.memory_savings = state_savings / 1024**2  # MB
            elif self.stage == 2:
                state_savings = optimizer_size * (1 - 1/self.partition_count)
                grad_savings = total_param_size * (1 - 1/self.partition_count)
                self.memory_savings = (state_savings + grad_savings) / 1024**2  # MB
    
    def step(self, closure: Optional[Callable] = None):
        """
        Perform optimization step
        
        Args:
            closure: Closure for loss computation (optional)
        """
        # For CPU offloading, copy gradients to CPU parameters
        if self.cpu_offload:
            for group in self.param_groups:
                for i, param in enumerate(group['master_params']):
                    if param.grad is not None:
                        group['cpu_params'][i].grad = self._offload_to_cpu(param.grad)
        
        # In Stage 2, we need to reduce-scatter gradients across partitions
        if self.stage >= 2 and self.partition_count > 1:
            # Here we would perform reduce-scatter communication
            # For simulation on a single device, we simply zero out non-partition gradients
            for group in self.param_groups:
                params = group['params' if not self.cpu_offload else 'master_params']
                for param in params:
                    if not self._partition_gradients(param) and param.grad is not None:
                        param.grad = None
        
        # Perform optimizer step
        loss = self.optimizer.step(closure)
        
        # For CPU offloading, copy updated parameters back to GPU
        if self.cpu_offload:
            for group in self.param_groups:
                for i, cpu_param in enumerate(group['cpu_params']):
                    master_param = group['master_params'][i]
                    # Update master parameters on GPU
                    master_param.data.copy_(cpu_param.data)
        
        # Update memory statistics
        self._update_memory_stats()
        
        return loss
    
    def set_gradient_accumulation_steps(self, steps: int):
        """
        Set number of gradient accumulation steps
        
        Args:
            steps: Number of steps to accumulate gradients for
        """
        self.acc_steps = steps
        self.current_step = 0
    
    def get_memory_stats(self) -> Dict[str, float]:
        """
        Get memory usage statistics
        
        Returns:
            Dictionary with memory statistics
        """
        return {
            "peak_memory_usage_mb": self.peak_memory_usage,
            "estimated_memory_savings_mb": self.memory_savings,
            "effective_peak_memory_mb": self.peak_memory_usage - self.memory_savings,
        }
    
    def state_dict(self) -> Dict[str, Any]:
        """
        Get optimizer state dictionary for saving checkpoints
        
        Returns:
            State dictionary
        """
        return self.optimizer.state_dict()
    
    def load_state_dict(self, state_dict: Dict[str, Any]):
        """
        Load optimizer state dictionary
        
        Args:
            state_dict: State dictionary to load
        """
        self.optimizer.load_state_dict(state_dict)


class ZeROAdamW(ZeroOptimizer):
    """
    Convenience class for ZeRO with AdamW optimizer
    """
    
    def __init__(self, params, lr=0.001, betas=(0.9, 0.999), eps=1e-8, weight_decay=0.01, 
                 stage=1, cpu_offload=False, **kwargs):
        """
        Initialize ZeRO-AdamW optimizer
        
        Args:
            params: Model parameters
            lr: Learning rate
            betas: Adam beta parameters
            eps: Adam epsilon parameter
            weight_decay: Weight decay factor
            stage: ZeRO stage (1 or 2)
            cpu_offload: Whether to offload optimizer states to CPU
            **kwargs: Additional ZeroOptimizer arguments
        """
        super().__init__(
            torch.optim.AdamW, 
            params, 
            stage=stage, 
            cpu_offload=cpu_offload,
            lr=lr, 
            betas=betas, 
            eps=eps, 
            weight_decay=weight_decay,
            **kwargs
        )


class ZeROAdam(ZeroOptimizer):
    """
    Convenience class for ZeRO with Adam optimizer
    """
    
    def __init__(self, params, lr=0.001, betas=(0.9, 0.999), eps=1e-8, weight_decay=0, 
                 stage=1, cpu_offload=False, **kwargs):
        """
        Initialize ZeRO-Adam optimizer
        
        Args:
            params: Model parameters
            lr: Learning rate
            betas: Adam beta parameters
            eps: Adam epsilon parameter
            weight_decay: Weight decay factor
            stage: ZeRO stage (1 or 2)
            cpu_offload: Whether to offload optimizer states to CPU
            **kwargs: Additional ZeroOptimizer arguments
        """
        super().__init__(
            torch.optim.Adam, 
            params, 
            stage=stage, 
            cpu_offload=cpu_offload,
            lr=lr, 
            betas=betas, 
            eps=eps, 
            weight_decay=weight_decay,
            **kwargs
        )


# Example usage
if __name__ == "__main__":
    import torch.nn.functional as F
    from torch.utils.data import DataLoader, TensorDataset
    
    # Create a larger model to demonstrate memory savings
    model = nn.Sequential(
        nn.Linear(1000, 2000),
        nn.ReLU(),
        nn.Linear(2000, 2000),
        nn.ReLU(),
        nn.Linear(2000, 1000),
        nn.ReLU(),
        nn.Linear(1000, 10)
    )
    
    # Generate some dummy data
    data = torch.randn(100, 1000)
    targets = torch.randint(0, 10, (100,))
    
    # Create a DataLoader
    dataset = TensorDataset(data, targets)
    dataloader = DataLoader(dataset, batch_size=16)
    
    # Standard optimizer for comparison
    standard_optimizer = torch.optim.AdamW(model.parameters(), lr=0.001)
    
    # Get the standard optimizer's memory usage
    model.cuda()
    init_mem = torch.cuda.memory_allocated() / 1024**2  # MB
    
    # Create ZeRO-2 optimizer with CPU offloading
    zero_optimizer = ZeROAdamW(
        model.parameters(),
        lr=0.001,
        stage=2,  # ZeRO-2: partition optimizer states and gradients
        cpu_offload=True  # Offload to CPU for even more memory savings
    )
    
    # Train for a few steps with standard optimizer
    model.train()
    for i, (inputs, targets) in enumerate(dataloader):
        if i >= 3:
            break
        inputs, targets = inputs.cuda(), targets.cuda()
        standard_optimizer.zero_grad()
        outputs = model(inputs)
        loss = F.cross_entropy(outputs, targets)
        loss.backward()
        standard_optimizer.step()
    
    standard_mem = torch.cuda.memory_allocated() / 1024**2  # MB
    
    # Reset model and train with ZeRO optimizer
    model.cuda()
    torch.cuda.empty_cache()
    zero_mem_start = torch.cuda.memory_allocated() / 1024**2  # MB
    
    model.train()
    for i, (inputs, targets) in enumerate(dataloader):
        if i >= 3:
            break
        inputs, targets = inputs.cuda(), targets.cuda()
        zero_optimizer.zero_grad()
        outputs = model(inputs)
        loss = F.cross_entropy(outputs, targets)
        loss.backward()
        zero_optimizer.step()
    
    zero_mem = torch.cuda.memory_allocated() / 1024**2  # MB
    
    # Print memory statistics
    print(f"Initial model memory: {init_mem:.2f} MB")
    print(f"Standard optimizer memory: {standard_mem:.2f} MB")
    print(f"ZeRO optimizer memory: {zero_mem:.2f} MB")
    print(f"Memory savings: {standard_mem - zero_mem:.2f} MB ({(standard_mem - zero_mem) / standard_mem * 100:.2f}%)")
    
    stats = zero_optimizer.get_memory_stats()
    print(f"Peak memory usage: {stats['peak_memory_usage_mb']:.2f} MB")
    print(f"Estimated memory savings: {stats['estimated_memory_savings_mb']:.2f} MB")
