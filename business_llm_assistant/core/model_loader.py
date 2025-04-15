"""
Model Loader Module

This module handles loading, unloading, and managing LLM models
with efficient memory usage. It supports loading models with different 
quantization levels based on available hardware resources.
"""

import os
import gc
import logging
import torch
import psutil
from typing import Dict, Optional, List, Union, Tuple, Any
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from llama_cpp import Llama

# Optional imports for multimodal models
try:
    from transformers import AutoProcessor, AutoModelForVision2Seq
    VISION_IMPORTS_AVAILABLE = True
except ImportError:
    VISION_IMPORTS_AVAILABLE = False
    logging.warning("Vision model imports not available. Install with pip install transformers accelerate")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ModelLoader:
    """
    Handles loading and unloading of LLM models with memory optimization
    """
    
    def __init__(self, 
                 model_dir: str = "data/models", 
                 use_gpu: bool = True,
                 low_memory_mode: bool = False):
        """
        Initialize the model loader

        Args:
            model_dir: Directory where models are stored
            use_gpu: Whether to use GPU if available
            low_memory_mode: Whether to optimize for low memory usage
        """
        self.model_dir = model_dir
        self.use_gpu = use_gpu and torch.cuda.is_available()
        self.low_memory_mode = low_memory_mode
        self.loaded_models = {}
        self.loaded_tokenizers = {}
        self.current_model = None
        
        # Create model directory if it doesn't exist
        os.makedirs(model_dir, exist_ok=True)
        
        logger.info(f"Model loader initialized. GPU enabled: {self.use_gpu}")
        if self.use_gpu:
            logger.info(f"Available GPU: {torch.cuda.get_device_name(0)}")
            logger.info(f"GPU memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.2f} GB")
        
        # Log memory resources
        mem_info = psutil.virtual_memory()
        logger.info(f"System memory: {mem_info.total / 1024**3:.2f} GB total, {mem_info.available / 1024**3:.2f} GB available")
    
    def _get_optimal_quantization(self) -> str:
        """
        Determine the optimal quantization level based on available resources

        Returns:
            String indicating the quantization level to use
        """
        if not self.use_gpu:
            return "Q4_0"  # Balanced quality and performance for CPU
        
        # Check available GPU memory
        gpu_mem = torch.cuda.get_device_properties(0).total_memory / 1024**3  # GB
        free_mem = torch.cuda.memory_reserved(0) / 1024**3  # GB
        
        if gpu_mem > 24:
            return "Q5_K_M"  # Higher quality for high-end GPUs
        elif gpu_mem > 8:
            return "Q4_K_M"  # Good balance for mid-range GPUs
        else:
            return "Q3_K_S" if self.low_memory_mode else "Q4_0"  # Aggressive for low memory
    
    def load_hf_model(self, 
                   model_name: str,
                   agent_name: str,
                   force_cpu: bool = False,
                   quantization: Optional[str] = None,
                   model_type: str = "text") -> Tuple[Any, Any]:
        """
        Load a model from Hugging Face

        Args:
            model_name: Name of the model to load (e.g., "mistralai/Mistral-7B-v0.1")
            agent_name: Name of the agent using this model
            force_cpu: Force CPU usage even if GPU is available
            quantization: Quantization type to use (e.g., "4bit", "8bit", None for full precision)
            model_type: Type of model ("text", "vision", "multimodal")

        Returns:
            Tuple of (model, tokenizer/processor)
        """
        logger.info(f"Loading HF model: {model_name} for {agent_name}")
        
        # Check if model is already loaded
        if agent_name in self.loaded_models:
            logger.info(f"Model for {agent_name} already loaded")
            return self.loaded_models[agent_name], self.loaded_tokenizers[agent_name]
        
        # Free memory if in low memory mode
        if self.low_memory_mode and self.current_model and self.current_model != agent_name:
            self.unload_model(self.current_model)
        
        # Set device
        device = "cpu" if force_cpu or not self.use_gpu else "cuda"
        
        # Prepare quantization config
        quant_config = None
        if quantization == "4bit" and device == "cuda":
            quant_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.float16,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_use_double_quant=True
            )
        elif quantization == "8bit" and device == "cuda":
            quant_config = BitsAndBytesConfig(
                load_in_8bit=True,
                bnb_8bit_compute_dtype=torch.float16
            )
        
        try:
            # Different loading based on model type
            if model_type in ["multimodal", "vision"]:
                if not VISION_IMPORTS_AVAILABLE:
                    raise ImportError("Vision model imports not available. Please install transformers with pip.")
                
                # Load processor for multimodal model
                processor = AutoProcessor.from_pretrained(model_name)
                
                # Load model
                load_params = {
                    "pretrained_model_name_or_path": model_name,
                    "device_map": "auto" if device == "cuda" else None,
                    "torch_dtype": torch.float16 if device == "cuda" else torch.float32,
                }
                
                if quant_config:
                    load_params["quantization_config"] = quant_config
                
                # For vision models, use the correct model class
                model = AutoModelForVision2Seq.from_pretrained(**load_params)
                
                logger.info(f"Loaded multimodal model: {model_name}")
                
                # Save loaded model and processor
                self.loaded_models[agent_name] = model
                self.loaded_tokenizers[agent_name] = processor
                self.current_model = agent_name
                
                return model, processor
                
            else:
                # Standard text model
                # Load tokenizer
                tokenizer = AutoTokenizer.from_pretrained(model_name)
                
                # Load model with appropriate settings
                load_params = {
                    "pretrained_model_name_or_path": model_name,
                    "device_map": "auto" if device == "cuda" else None,
                    "torch_dtype": torch.float16 if device == "cuda" else torch.float32,
                }
                
                if quant_config:
                    load_params["quantization_config"] = quant_config
                
                model = AutoModelForCausalLM.from_pretrained(**load_params)
                
                # Save loaded model and tokenizer
                self.loaded_models[agent_name] = model
                self.loaded_tokenizers[agent_name] = tokenizer
                self.current_model = agent_name
                
                logger.info(f"Successfully loaded text model for {agent_name}")
                return model, tokenizer
            
        except Exception as e:
            logger.error(f"Error loading model {model_name}: {str(e)}")
            raise
    
    def load_gguf_model(self, 
                      model_path: str,
                      agent_name: str,
                      n_ctx: int = 2048,
                      n_gpu_layers: int = -1,
                      quantization: Optional[str] = None,
                      model_kwargs: Optional[Dict[str, Any]] = None) -> Llama:
        """
            model_kwargs: Additional kwargs to pass to the Llama constructor
            
        Load a GGUF model using llama-cpp-python

        Args:
            model_path: Path to the GGUF model file
            agent_name: Name of the agent using this model
            n_ctx: Context window size
            n_gpu_layers: Number of layers to offload to GPU (-1 = all)
            quantization: Quantization type (if None, will determine automatically)

        Returns:
            Loaded Llama model
        """
        logger.info(f"Loading GGUF model: {model_path} for {agent_name}")
        
        # Check if model is already loaded
        if agent_name in self.loaded_models:
            logger.info(f"Model for {agent_name} already loaded")
            return self.loaded_models[agent_name]
        
        # Free memory if in low memory mode
        if self.low_memory_mode and self.current_model and self.current_model != agent_name:
            self.unload_model(self.current_model)
        
        # Adjust GPU layers based on availability
        if not self.use_gpu:
            n_gpu_layers = 0
        
        # Use appropriate quantization if not specified
        if not quantization:
            quantization = self._get_optimal_quantization()
        
        # Prepare full path
        if not os.path.isabs(model_path):
            model_path = os.path.join(self.model_dir, model_path)
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}")
        
        try:
            # Prepare kwargs
            kwargs = {
                "model_path": model_path,
                "n_ctx": n_ctx,
                "n_gpu_layers": n_gpu_layers,
                "verbose": False
            }
            
            # Add additional kwargs if provided
            if model_kwargs:
                kwargs.update(model_kwargs)
            
            # Load the model
            model = Llama(**kwargs)
            
            # Save loaded model
            self.loaded_models[agent_name] = model
            self.current_model = agent_name
            
            logger.info(f"Successfully loaded GGUF model for {agent_name}")
            return model
            
        except Exception as e:
            logger.error(f"Error loading GGUF model {model_path}: {str(e)}")
            raise
    
    def unload_model(self, agent_name: str) -> bool:
        """
        Unload a model to free up memory

        Args:
            agent_name: Name of the agent whose model should be unloaded

        Returns:
            True if successful, False otherwise
        """
        if agent_name not in self.loaded_models:
            logger.warning(f"No model loaded for {agent_name}")
            return False
        
        try:
            # Get model
            model = self.loaded_models[agent_name]
            
            # Delete from loaded models
            del self.loaded_models[agent_name]
            if agent_name in self.loaded_tokenizers:
                del self.loaded_tokenizers[agent_name]
            
            # Delete model and run garbage collection
            del model
            torch.cuda.empty_cache() if self.use_gpu else None
            gc.collect()
            
            logger.info(f"Unloaded model for {agent_name}")
            
            if self.current_model == agent_name:
                self.current_model = None
            
            return True
            
        except Exception as e:
            logger.error(f"Error unloading model for {agent_name}: {str(e)}")
            return False
    
    def get_model_info(self, agent_name: Optional[str] = None) -> Dict:
        """
        Get information about loaded models

        Args:
            agent_name: Specific agent to check, or None for all

        Returns:
            Dictionary with model information
        """
        if agent_name and agent_name in self.loaded_models:
            # Return info for specific model
            model = self.loaded_models[agent_name]
            if isinstance(model, Llama):
                return {
                    "type": "GGUF",
                    "loaded": True,
                    "context_length": model.n_ctx(),
                    "n_gpu_layers": model.n_gpu_layers()
                }
            else:
                return {
                    "type": "Hugging Face",
                    "loaded": True,
                    "device": next(model.parameters()).device.type,
                    "dtype": next(model.parameters()).dtype
                }
        
        # Return summary of all models
        result = {}
        for name, model in self.loaded_models.items():
            if isinstance(model, Llama):
                result[name] = {
                    "type": "GGUF",
                    "loaded": True,
                    "is_current": name == self.current_model
                }
            else:
                result[name] = {
                    "type": "Hugging Face",
                    "loaded": True,
                    "device": next(model.parameters()).device.type,
                    "is_current": name == self.current_model
                }
        
        return result
    
    def is_model_loaded(self, agent_name: str) -> bool:
        """
        Check if a model is loaded for the specified agent

        Args:
            agent_name: Name of the agent to check

        Returns:
            True if loaded, False otherwise
        """
        return agent_name in self.loaded_models
    
    def clean_up(self) -> None:
        """
        Unload all models and free memory
        """
        logger.info("Cleaning up all models")
        
        for agent_name in list(self.loaded_models.keys()):
            self.unload_model(agent_name)
        
        # Extra cleanup
        torch.cuda.empty_cache() if self.use_gpu else None
        gc.collect()
        
