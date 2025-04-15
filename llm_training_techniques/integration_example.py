"""
Integration Example

This file demonstrates how to combine all the techniques implemented in this package
to create an optimized training pipeline for LLMs. It shows how to use:

- Gradient Accumulation
- Mixed Precision Training
- ZeRO Optimizer
- Efficient Attention

The example uses a small transformer model, but the same techniques can be applied
to larger models.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, TensorDataset
import time
import logging
import math
from typing import Optional, Tuple, Dict, Any, List

# Import our techniques
from techniques.gradient_accumulation import GradientAccumulator
from techniques.mixed_precision import MixedPrecisionTrainer
from techniques.zero_optimizer import ZeROAdamW
from techniques.efficient_attention import EfficientSelfAttention, convert_model_to_efficient_attention

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class SimpleTransformerBlock(nn.Module):
    """
    A simple transformer decoder block with efficient attention.
    """
    
    def __init__(
        self,
        dim: int,
        num_heads: int,
        mlp_dim: int,
        dropout: float = 0.1,
        use_efficient_attention: bool = True,
    ):
        super().__init__()
        self.dim = dim
        self.num_heads = num_heads
        
        # Layer norm before attention
        self.norm1 = nn.LayerNorm(dim)
        
        # Self-attention
        if use_efficient_attention:
            self.attn = EfficientSelfAttention(
                dim=dim,
                num_heads=num_heads,
                dropout=dropout,
                causal=True
            )
        else:
            # Standard attention - for comparison
            head_dim = dim // num_heads
            self.attn = nn.MultiheadAttention(
                embed_dim=dim,
                num_heads=num_heads,
                dropout=dropout,
                batch_first=True
            )
        
        # Layer norm before MLP
        self.norm2 = nn.LayerNorm(dim)
        
        # MLP
        self.mlp = nn.Sequential(
            nn.Linear(dim, mlp_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(mlp_dim, dim),
            nn.Dropout(dropout)
        )
    
    def forward(
        self,
        x: torch.Tensor,
        attention_mask: Optional[torch.Tensor] = None
    ) -> torch.Tensor:
        # Apply first normalization
        normed_x = self.norm1(x)
        
        # Apply attention
        if isinstance(self.attn, EfficientSelfAttention):
            # Efficient attention
            attn_output = self.attn(
                normed_x,
                attention_mask=attention_mask
            )
        else:
            # Standard attention
            attn_output, _ = self.attn(
                normed_x, 
                normed_x, 
                normed_x,
                key_padding_mask=~attention_mask.bool() if attention_mask is not None else None,
                is_causal=True
            )
        
        # Residual connection
        x = x + attn_output
        
        # Apply second normalization and MLP
        x = x + self.mlp(self.norm2(x))
        
        return x


class SimpleTransformerModel(nn.Module):
    """
    A simple transformer model for demonstration.
    
    This model is designed to show how all the optimization techniques
    can be applied in a real-world scenario.
    """
    
    def __init__(
        self,
        vocab_size: int,
        dim: int,
        num_layers: int,
        num_heads: int,
        max_seq_len: int = 1024,
        mlp_dim: Optional[int] = None,
        dropout: float = 0.1,
        use_efficient_attention: bool = True,
    ):
        super().__init__()
        self.dim = dim
        self.vocab_size = vocab_size
        self.num_layers = num_layers
        self.num_heads = num_heads
        self.max_seq_len = max_seq_len
        
        if mlp_dim is None:
            mlp_dim = dim * 4
        
        # Token embeddings
        self.token_embeddings = nn.Embedding(vocab_size, dim)
        
        # Position embeddings
        self.position_embeddings = nn.Embedding(max_seq_len, dim)
        
        # Register buffer for positional IDs
        self.register_buffer(
            "position_ids",
            torch.arange(max_seq_len).expand((1, -1))
        )
        
        # Embedding dropout
        self.embedding_dropout = nn.Dropout(dropout)
        
        # Transformer layers
        self.layers = nn.ModuleList([
            SimpleTransformerBlock(
                dim=dim,
                num_heads=num_heads,
                mlp_dim=mlp_dim,
                dropout=dropout,
                use_efficient_attention=use_efficient_attention
            )
            for _ in range(num_layers)
        ])
        
        # Final layer norm
        self.norm = nn.LayerNorm(dim)
        
        # Output projection
        self.output_projection = nn.Linear(dim, vocab_size, bias=False)
        
        # Tie weights with embedding
        self.output_projection.weight = self.token_embeddings.weight
        
        # Initialize parameters
        self.apply(self._init_weights)
    
    def _init_weights(self, module):
        if isinstance(module, nn.Linear):
            torch.nn.init.normal_(module.weight, mean=0.0, std=0.02)
            if module.bias is not None:
                torch.nn.init.zeros_(module.bias)
        elif isinstance(module, nn.Embedding):
            torch.nn.init.normal_(module.weight, mean=0.0, std=0.02)
        elif isinstance(module, nn.LayerNorm):
            torch.nn.init.zeros_(module.bias)
            torch.nn.init.ones_(module.weight)
    
    def forward(
        self,
        input_ids: torch.Tensor,
        attention_mask: Optional[torch.Tensor] = None,
    ) -> torch.Tensor:
        batch_size, seq_len = input_ids.shape
        
        # Get position ids
        position_ids = self.position_ids[:, :seq_len]
        
        # Get embeddings
        token_embeddings = self.token_embeddings(input_ids)
        position_embeddings = self.position_embeddings(position_ids)
        
        # Combine embeddings
        x = token_embeddings + position_embeddings
        
        # Apply dropout
        x = self.embedding_dropout(x)
        
        # Apply transformer layers
        for layer in self.layers:
            x = layer(x, attention_mask=attention_mask)
        
        # Apply final norm
        x = self.norm(x)
        
        # Project to vocab
        logits = self.output_projection(x)
        
        return logits


def count_parameters(model: nn.Module) -> int:
    """Count number of trainable parameters in a model."""
    return sum(p.numel() for p in model.parameters() if p.requires_grad)


def create_dummy_data(
    vocab_size: int, 
    seq_len: int, 
    num_samples: int, 
    device: torch.device,
) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
    """
    Create dummy data for training a language model.
    
    Args:
        vocab_size: Size of vocabulary
        seq_len: Sequence length
        num_samples: Number of samples to generate
        device: Device to put tensors on
        
    Returns:
        Tuple of input_ids, attention_mask, and labels
    """
    # Create random input ids
    input_ids = torch.randint(0, vocab_size, (num_samples, seq_len), device=device)
    
    # Create attention mask (all 1s for simplicity)
    attention_mask = torch.ones_like(input_ids)
    
    # Create labels (shifted input_ids)
    labels = torch.roll(input_ids, -1, dims=1)
    labels[:, -1] = 0  # Set last token to padding
    
    return input_ids, attention_mask, labels


def integration_example(
    vocab_size: int = 1000,
    dim: int = 256,
    num_layers: int = 4,
    num_heads: int = 4,
    max_seq_len: int = 128,
    batch_size: int = 8,
    accumulation_steps: int = 4,
    zero_stage: int = 1,
    use_efficient_attention: bool = True,
    use_mixed_precision: bool = True,
    precision: str = "bf16",
    cpu_offload: bool = False,
    device: torch.device = torch.device("cuda" if torch.cuda.is_available() else "cpu"),
) -> Dict[str, Any]:
    """
    Run an integration example that combines all techniques.
    
    Args:
        vocab_size: Size of vocabulary
        dim: Hidden dimension
        num_layers: Number of transformer layers
        num_heads: Number of attention heads
        max_seq_len: Maximum sequence length
        batch_size: Batch size per device
        accumulation_steps: Number of gradient accumulation steps
        zero_stage: ZeRO optimizer stage (1 or 2)
        use_efficient_attention: Whether to use efficient attention
        use_mixed_precision: Whether to use mixed precision training
        precision: Precision to use ("fp16", "bf16", or "fp32")
        cpu_offload: Whether to offload optimizer states to CPU
        device: Device to train on
        
    Returns:
        Dictionary with training statistics
    """
    logger.info(f"Creating model with {dim} dimensions and {num_layers} layers")
    
    # Create model
    model = SimpleTransformerModel(
        vocab_size=vocab_size,
        dim=dim,
        num_layers=num_layers,
        num_heads=num_heads,
        max_seq_len=max_seq_len,
        use_efficient_attention=use_efficient_attention,
    )
    
    # Log parameter count
    num_params = count_parameters(model)
    logger.info(f"Model has {num_params:,} parameters")
    
    # Convert model to use efficient attention if not already done
    if use_efficient_attention:
        model = convert_model_to_efficient_attention(model)
        logger.info("Converted model to use efficient attention")
    
    # Create dummy data
    logger.info(f"Creating dummy data with sequence length {max_seq_len}")
    input_ids, attention_mask, labels = create_dummy_data(
        vocab_size=vocab_size,
        seq_len=max_seq_len,
        num_samples=batch_size * 10,  # 10 steps worth of data
        device=torch.device("cpu"),  # Create on CPU and move to device later
    )
    
    # Create dataset and dataloader
    dataset = TensorDataset(input_ids, attention_mask, labels)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
    
    # Move model to device
    model.to(device)
    
    # Setup ZeRO optimizer
    logger.info(f"Setting up ZeRO optimizer (Stage {zero_stage}) with {accumulation_steps}x gradient accumulation")
    optimizer = ZeROAdamW(
        model.parameters(),
        lr=5e-5,
        weight_decay=0.01,
        stage=zero_stage,
        cpu_offload=cpu_offload,
    )
    
    # Setup loss function
    def criterion(outputs, targets):
        return F.cross_entropy(
            outputs.view(-1, vocab_size),
            targets.view(-1),
            ignore_index=0,  # Ignore padding
        )
    
    # Gradient scaler for mixed precision training
    scaler = None
    if use_mixed_precision and precision == "fp16" and device.type == "cuda":
        scaler = torch.cuda.amp.GradScaler()
        logger.info("Using FP16 gradient scaling")
    
    # For mixed precision BF16, we don't need a scaler, just autocast
    mixed_precision_enabled = use_mixed_precision and device.type == "cuda"
    
    if mixed_precision_enabled:
        logger.info(f"Using {precision} mixed precision training")
    
    # Setup mixed precision trainer
    mp_trainer = None
    if mixed_precision_enabled:
        mp_trainer = MixedPrecisionTrainer(
            precision=precision,
            enabled=True,
        )
    
    # Setup gradient accumulator
    grad_accumulator = GradientAccumulator(
        accumulation_steps=accumulation_steps,
        clip_grad_norm=1.0,
    )
    
    # Train for a few steps
    logger.info("Starting training")
    
    stats = {}
    
    if mp_trainer is not None:
        # Train with mixed precision trainer
        stats = mp_trainer.train(
            model=model,
            dataloader=dataloader,
            optimizer=optimizer,
            criterion=criterion,
            device=device,
            epochs=1,
            accumulation_steps=accumulation_steps,
        )
    else:
        # Train with gradient accumulator only
        stats = grad_accumulator.train(
            model=model,
            dataloader=dataloader,
            optimizer=optimizer,
            criterion=criterion,
            device=device,
            epochs=1,
            scaler=scaler,
        )
    
    # Get optimizer memory stats
    if hasattr(optimizer, "get_memory_stats"):
        stats.update(optimizer.get_memory_stats())
    
    # Log final stats
    logger.info(f"Training completed in {stats.get('train_time', 0):.2f} seconds")
    logger.info(f"Final loss: {stats.get('train_loss', [0])[-1]:.4f}")
    logger.info(f"Effective batch size: {stats.get('effective_batch_size', batch_size * accumulation_steps)}")
    
    # Return all stats
    return stats


def integration_benchmark():
    """
    Run benchmarks comparing different combinations of techniques.
    """
    results = []
    
    # Define configurations to test
    configs = [
        {"name": "Baseline", "use_efficient_attention": False, "use_mixed_precision": False, "zero_stage": 0},
        {"name": "Efficient Attention", "use_efficient_attention": True, "use_mixed_precision": False, "zero_stage": 0},
        {"name": "Mixed Precision", "use_efficient_attention": False, "use_mixed_precision": True, "zero_stage": 0},
        {"name": "ZeRO-1", "use_efficient_attention": False, "use_mixed_precision": False, "zero_stage": 1},
        {"name": "All Techniques", "use_efficient_attention": True, "use_mixed_precision": True, "zero_stage": 1},
    ]
    
    # Run each configuration
    for config in configs:
        logger.info(f"Running benchmark: {config['name']}")
        
        # Only run if CUDA is available or this is the baseline
        if not torch.cuda.is_available() and config['use_mixed_precision']:
            logger.info("Skipping mixed precision benchmark (CUDA not available)")
            continue
        
        # Run benchmark
        try:
            start_time = time.time()
            
            # Use smaller model for benchmarking
            stats = integration_example(
                dim=128,
                num_layers=2,
                num_heads=4,
                max_seq_len=64,
                batch_size=4,
                accumulation_steps=2,
                use_efficient_attention=config["use_efficient_attention"],
                use_mixed_precision=config["use_mixed_precision"],
                zero_stage=config["zero_stage"],
            )
            
            # Add benchmark results
            results.append({
                "name": config["name"],
                "training_time": stats.get("train_time", time.time() - start_time),
                "memory_usage": stats.get("peak_memory_usage_mb", 0),
                "memory_savings": stats.get("estimated_memory_savings_mb", 0),
                "effective_batch_size": stats.get("effective_batch_size", 0),
            })
            
        except Exception as e:
            logger.error(f"Error running benchmark {config['name']}: {e}")
    
    # Print results
    logger.info("\nBenchmark Results:")
    logger.info("-" * 80)
    logger.info(f"{'Name':<20} {'Time (s)':<10} {'Memory (MB)':<15} {'Memory Savings (MB)':<20} {'Eff. Batch Size':<15}")
    logger.info("-" * 80)
    
    for result in results:
        logger.info(
            f"{result['name']:<20} "
            f"{result['training_time']:<10.2f} "
            f"{result['memory_usage']:<15.2f} "
            f"{result['memory_savings']:<20.2f} "
            f"{result['effective_batch_size']:<15}"
        )
    
    # Calculate speedups relative to baseline
    if results:
        baseline_time = results[0]["training_time"]
        logger.info("\nSpeedups vs Baseline:")
        for result in results[1:]:
            speedup = baseline_time / result["training_time"] if result["training_time"] > 0 else 0
            logger.info(f"{result['name']}: {speedup:.2f}x speedup")


if __name__ == "__main__":
    # Run the full integration example
    integration_benchmark()
