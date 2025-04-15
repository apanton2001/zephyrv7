#!/usr/bin/env python
"""
LLM Training Techniques - Main Script

This script provides a command-line interface to try different training optimization
techniques implemented in this package. You can use it to experiment with:

- Gradient Accumulation
- Mixed Precision Training
- ZeRO Optimizer
- Efficient Attention

These techniques can help you train larger models faster and with less memory.
"""

import argparse
import torch
import torch.nn as nn
import time
import logging
import os
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def setup_arg_parser():
    """Setup command-line argument parser."""
    parser = argparse.ArgumentParser(
        description='LLM Training Techniques - Train efficiently with less memory',
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )
    
    # Main options
    parser.add_argument('--technique', type=str, choices=[
        'gradient_accumulation', 'mixed_precision', 'zero', 'efficient_attention', 'integration'
    ], default='integration', help='Which technique to demonstrate')
    
    # Model configuration
    model_group = parser.add_argument_group('Model Configuration')
    model_group.add_argument('--model_size', type=str, choices=['tiny', 'small', 'medium', 'large'], 
                        default='tiny', help='Size of model to use')
    model_group.add_argument('--seq_len', type=int, default=128, 
                        help='Sequence length for training')
    
    # Training configuration
    training_group = parser.add_argument_group('Training Configuration')
    training_group.add_argument('--batch_size', type=int, default=4,
                           help='Micro batch size for training')
    training_group.add_argument('--accumulation_steps', type=int, default=4,
                           help='Number of gradient accumulation steps')
    training_group.add_argument('--epochs', type=int, default=1,
                           help='Number of training epochs')
    
    # Technique-specific options
    technique_group = parser.add_argument_group('Technique Options')
    technique_group.add_argument('--precision', type=str, choices=['fp32', 'fp16', 'bf16'], 
                            default='bf16', help='Precision for mixed precision training')
    technique_group.add_argument('--zero_stage', type=int, choices=[0, 1, 2], default=1,
                            help='ZeRO optimizer stage')
    technique_group.add_argument('--cpu_offload', action='store_true',
                            help='Offload optimizer states to CPU (ZeRO)')
    
    # Output options
    output_group = parser.add_argument_group('Output Options')
    output_group.add_argument('--benchmark', action='store_true',
                         help='Run benchmark comparing different configurations')
    output_group.add_argument('--save_model', action='store_true',
                         help='Save the trained model')
    output_group.add_argument('--output_dir', type=str, default='./outputs',
                         help='Directory to save outputs')
                         
    return parser

def get_model_config(size):
    """Get model configuration based on size."""
    configs = {
        'tiny': {
            'dim': 128,
            'num_layers': 2,
            'num_heads': 4,
            'vocab_size': 1000,
        },
        'small': {
            'dim': 256,
            'num_layers': 4,
            'num_heads': 4,
            'vocab_size': 5000,
        },
        'medium': {
            'dim': 512,
            'num_layers': 6,
            'num_heads': 8,
            'vocab_size': 10000,
        },
        'large': {
            'dim': 1024,
            'num_layers': 8,
            'num_heads': 16,
            'vocab_size': 20000,
        }
    }
    return configs[size]

def run_gradient_accumulation(args):
    """Run gradient accumulation example."""
    from techniques.gradient_accumulation import train_with_gradient_accumulation
    import torch.nn.functional as F
    from torch.utils.data import DataLoader, TensorDataset
    
    logger.info("Running Gradient Accumulation example")
    
    # Get model config
    config = get_model_config(args.model_size)
    
    # Create a simple model
    model = nn.Sequential(
        nn.Linear(config['dim'], config['dim'] * 2),
        nn.ReLU(),
        nn.Linear(config['dim'] * 2, config['vocab_size'])
    )
    
    # Generate dummy data
    data = torch.randn(100, config['dim'])
    targets = torch.randint(0, config['vocab_size'], (100,))
    
    # Create DataLoader
    dataset = TensorDataset(data, targets)
    dataloader = DataLoader(dataset, batch_size=args.batch_size)
    
    # Create optimizer
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    
    # Define criterion
    criterion = F.cross_entropy
    
    # Choose device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Using device: {device}")
    
    # Train with gradient accumulation
    start_time = time.time()
    stats = train_with_gradient_accumulation(
        model, 
        dataloader, 
        optimizer,
        accumulation_steps=args.accumulation_steps,
        criterion=criterion,
        device=device,
        epochs=args.epochs
    )
    
    # Print stats
    logger.info(f"Training completed in {stats['train_time']:.2f} seconds")
    logger.info(f"Final loss: {stats['train_loss'][-1]:.4f}")
    logger.info(f"Effective batch size: {stats['effective_batch_size']}")
    
    # Save model if requested
    if args.save_model:
        os.makedirs(args.output_dir, exist_ok=True)
        torch.save(model.state_dict(), f"{args.output_dir}/gradient_accumulation_model.pt")
        logger.info(f"Model saved to {args.output_dir}/gradient_accumulation_model.pt")
    
    return stats

def run_mixed_precision(args):
    """Run mixed precision example."""
    from techniques.mixed_precision import train_with_mixed_precision
    import torch.nn.functional as F
    from torch.utils.data import DataLoader, TensorDataset
    
    logger.info(f"Running Mixed Precision example with {args.precision} precision")
    
    if not torch.cuda.is_available() and args.precision != 'fp32':
        logger.warning("CUDA not available. Falling back to FP32.")
        args.precision = 'fp32'
    
    # Get model config
    config = get_model_config(args.model_size)
    
    # Create a simple model
    model = nn.Sequential(
        nn.Linear(config['dim'], config['dim'] * 2),
        nn.ReLU(),
        nn.Linear(config['dim'] * 2, config['vocab_size'])
    )
    
    # Generate dummy data
    data = torch.randn(100, config['dim'])
    targets = torch.randint(0, config['vocab_size'], (100,))
    
    # Create DataLoader
    dataset = TensorDataset(data, targets)
    dataloader = DataLoader(dataset, batch_size=args.batch_size)
    
    # Create optimizer
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    
    # Define criterion
    criterion = F.cross_entropy
    
    # Choose device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Using device: {device}")
    
    # Train with mixed precision
    start_time = time.time()
    stats = train_with_mixed_precision(
        model, 
        dataloader, 
        optimizer,
        criterion,
        precision=args.precision,
        device=device,
        epochs=args.epochs,
        accumulation_steps=args.accumulation_steps
    )
    
    # Print stats
    logger.info(f"Training completed in {stats['train_time']:.2f} seconds")
    logger.info(f"Final loss: {stats['train_loss'][-1]:.4f}")
    logger.info(f"Effective batch size: {stats['effective_batch_size']}")
    
    # Save model if requested
    if args.save_model:
        os.makedirs(args.output_dir, exist_ok=True)
        torch.save(model.state_dict(), f"{args.output_dir}/mixed_precision_model_{args.precision}.pt")
        logger.info(f"Model saved to {args.output_dir}/mixed_precision_model_{args.precision}.pt")
    
    return stats

def run_zero_optimizer(args):
    """Run ZeRO optimizer example."""
    from techniques.zero_optimizer import ZeROAdamW
    import torch.nn.functional as F
    from torch.utils.data import DataLoader, TensorDataset
    
    logger.info(f"Running ZeRO optimizer example (Stage {args.zero_stage})")
    
    # Get model config
    config = get_model_config(args.model_size)
    
    # Create a larger model to demonstrate memory savings
    model = nn.Sequential(
        nn.Linear(config['dim'], config['dim'] * 2),
        nn.ReLU(),
        nn.Linear(config['dim'] * 2, config['dim'] * 2),
        nn.ReLU(),
        nn.Linear(config['dim'] * 2, config['vocab_size'])
    )
    
    # Generate dummy data
    data = torch.randn(100, config['dim'])
    targets = torch.randint(0, config['vocab_size'], (100,))
    
    # Create DataLoader
    dataset = TensorDataset(data, targets)
    dataloader = DataLoader(dataset, batch_size=args.batch_size)
    
    # Count parameters
    num_params = sum(p.numel() for p in model.parameters())
    logger.info(f"Model has {num_params:,} parameters")
    
    # Choose device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Using device: {device}")
    
    # Create ZeRO optimizer
    optimizer = ZeROAdamW(
        model.parameters(),
        lr=0.001,
        stage=args.zero_stage,
        cpu_offload=args.cpu_offload
    )
    
    # Move model to device
    model.to(device)
    
    # Train for a few steps
    model.train()
    start_time = time.time()
    loss = 0
    
    for epoch in range(args.epochs):
        for i, (inputs, targets) in enumerate(dataloader):
            inputs = inputs.to(device)
            targets = targets.to(device)
            
            # Forward pass
            outputs = model(inputs)
            batch_loss = F.cross_entropy(outputs, targets)
            
            # Backward pass
            optimizer.zero_grad()
            batch_loss.backward()
            optimizer.step()
            
            # Track loss
            loss += batch_loss.item()
            
            if i % 10 == 0:
                avg_loss = loss / (i + 1)
                logger.info(f"Epoch {epoch+1}, Step {i}, Avg. Loss: {avg_loss:.4f}")
    
    # Get memory stats
    if hasattr(optimizer, "get_memory_stats"):
        stats = optimizer.get_memory_stats()
        logger.info(f"Peak memory usage: {stats['peak_memory_usage_mb']:.2f} MB")
        logger.info(f"Estimated memory savings: {stats['estimated_memory_savings_mb']:.2f} MB")
    
    training_time = time.time() - start_time
    logger.info(f"Training completed in {training_time:.2f} seconds")
    
    # Save model if requested
    if args.save_model:
        os.makedirs(args.output_dir, exist_ok=True)
        torch.save(model.state_dict(), f"{args.output_dir}/zero_optimizer_model_stage{args.zero_stage}.pt")
        logger.info(f"Model saved to {args.output_dir}/zero_optimizer_model_stage{args.zero_stage}.pt")
    
    return {
        "train_time": training_time,
        "peak_memory_usage_mb": stats.get("peak_memory_usage_mb", 0),
        "estimated_memory_savings_mb": stats.get("estimated_memory_savings_mb", 0)
    }

def run_efficient_attention(args):
    """Run efficient attention example."""
    from techniques.efficient_attention import EfficientAttention, efficient_attention
    import torch.nn.functional as F
    
    logger.info("Running Efficient Attention example")
    
    # Get model config
    config = get_model_config(args.model_size)
    
    # Choose device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Using device: {device}")
    
    # Create test inputs
    batch_size = args.batch_size
    seq_len = args.seq_len
    hidden_dim = config['dim']
    num_heads = config['num_heads']
    head_dim = hidden_dim // num_heads
    
    # Create random inputs
    hidden_states = torch.randn(batch_size, seq_len, hidden_dim, device=device)
    
    # Create efficient attention module
    efficient_attn = EfficientAttention(
        dim=hidden_dim,
        num_heads=num_heads,
        memory_efficient=True
    ).to(device)
    
    # Create standard attention module for comparison
    standard_attn = nn.MultiheadAttention(
        embed_dim=hidden_dim,
        num_heads=num_heads,
        batch_first=True
    ).to(device)
    
    # Measure memory and time for efficient attention
    torch.cuda.empty_cache()
    torch.cuda.synchronize()
    
    mem_before = torch.cuda.memory_allocated() / 1024**2 if torch.cuda.is_available() else 0
    
    # Run efficient attention
    start_time = time.time()
    for _ in range(10):
        with torch.no_grad():
            efficient_output = efficient_attn(hidden_states)
    
    torch.cuda.synchronize() if torch.cuda.is_available() else None
    efficient_time = (time.time() - start_time) / 10
    
    # Measure memory
    mem_after = torch.cuda.memory_allocated() / 1024**2 if torch.cuda.is_available() else 0
    efficient_mem = mem_after - mem_before
    
    # Clear cache before standard attention
    torch.cuda.empty_cache() if torch.cuda.is_available() else None
    torch.cuda.synchronize() if torch.cuda.is_available() else None
    
    mem_before = torch.cuda.memory_allocated() / 1024**2 if torch.cuda.is_available() else 0
    
    # Run standard attention
    start_time = time.time()
    for _ in range(10):
        with torch.no_grad():
            standard_output = standard_attn(
                hidden_states.transpose(0, 1),
                hidden_states.transpose(0, 1),
                hidden_states.transpose(0, 1)
            )[0].transpose(0, 1)
    
    torch.cuda.synchronize() if torch.cuda.is_available() else None
    standard_time = (time.time() - start_time) / 10
    
    # Measure memory
    mem_after = torch.cuda.memory_allocated() / 1024**2 if torch.cuda.is_available() else 0
    standard_mem = mem_after - mem_before
    
    # Report results
    if torch.cuda.is_available():
        logger.info(f"Standard attention:")
        logger.info(f"  Time: {standard_time * 1000:.2f} ms")
        logger.info(f"  Memory: {standard_mem:.2f} MB")
        logger.info(f"Efficient attention:")
        logger.info(f"  Time: {efficient_time * 1000:.2f} ms")
        logger.info(f"  Memory: {efficient_mem:.2f} MB")
        logger.info(f"Speedup: {standard_time / efficient_time:.2f}x")
        
        if standard_mem > 0:
            logger.info(f"Memory reduction: {standard_mem / efficient_mem:.2f}x")
    else:
        logger.info(f"Standard attention: Time: {standard_time * 1000:.2f} ms")
        logger.info(f"Efficient attention: Time: {efficient_time * 1000:.2f} ms")
        logger.info(f"Speedup: {standard_time / efficient_time:.2f}x")
    
    if torch.cuda.is_available():
        # Verify outputs are similar
        mse = torch.nn.functional.mse_loss(standard_output, efficient_output).item()
        logger.info(f"MSE between implementations: {mse:.6f}")
    
    # Save models if requested
    if args.save_model:
        os.makedirs(args.output_dir, exist_ok=True)
        torch.save(efficient_attn.state_dict(), f"{args.output_dir}/efficient_attention_model.pt")
        logger.info(f"Model saved to {args.output_dir}/efficient_attention_model.pt")
    
    return {
        "standard_time": standard_time * 1000,  # ms
        "efficient_time": efficient_time * 1000,  # ms
        "standard_mem": standard_mem,  # MB
        "efficient_mem": efficient_mem,  # MB
        "speedup": standard_time / efficient_time
    }

def run_integration_example(args):
    """Run the integration example that combines all techniques."""
    from integration_example import integration_benchmark, integration_example
    
    if args.benchmark:
        logger.info("Running integration benchmark comparing all techniques")
        integration_benchmark()
    else:
        logger.info("Running integration example with all techniques combined")
        
        # Get model config
        config = get_model_config(args.model_size)
        
        # Choose device
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Run integration example
        stats = integration_example(
            vocab_size=config['vocab_size'],
            dim=config['dim'],
            num_layers=config['num_layers'],
            num_heads=config['num_heads'],
            max_seq_len=args.seq_len,
            batch_size=args.batch_size,
            accumulation_steps=args.accumulation_steps,
            zero_stage=args.zero_stage,
            use_efficient_attention=True,
            use_mixed_precision=(args.precision != 'fp32'),
            precision=args.precision,
            cpu_offload=args.cpu_offload,
            device=device
        )
        
        # Save model if requested
        if args.save_model:
            os.makedirs(args.output_dir, exist_ok=True)
            logger.info(f"Model would be saved to {args.output_dir}/integration_model.pt")
            # We're not actually saving the model here as it's handled inside integration_example

def main():
    """Main entry point."""
    parser = setup_arg_parser()
    args = parser.parse_args()
    
    logger.info(f"Starting LLM Training Techniques - {args.technique}")
    
    # Check if CUDA is available
    if torch.cuda.is_available():
        logger.info(f"CUDA available: {torch.cuda.get_device_name(0)}")
        logger.info(f"CUDA memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.2f} GB")
    else:
        logger.info("CUDA not available, using CPU")
    
    # Run the selected technique
    if args.technique == 'gradient_accumulation':
        run_gradient_accumulation(args)
    elif args.technique == 'mixed_precision':
        run_mixed_precision(args)
    elif args.technique == 'zero':
        run_zero_optimizer(args)
    elif args.technique == 'efficient_attention':
        run_efficient_attention(args)
    elif args.technique == 'integration':
        run_integration_example(args)
    else:
        logger.error(f"Unknown technique: {args.technique}")
        return 1
    
    logger.info("Execution completed successfully")
    return 0

if __name__ == "__main__":
    main()
