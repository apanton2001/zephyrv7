"""
Model Loader Module for Lisa

This module handles loading, unloading, and managing LLM models
with efficient memory usage. It supports loading models with different 
quantization levels based on available hardware resources.
"""

import os
import gc
import logging
import torch
import shutil
from typing import Dict, Optional, List, Union, Tuple, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Optional imports for better error messages
TRANSFORMERS_AVAILABLE = False
LLAMA_CPP_AVAILABLE = False
VISION_IMPORTS_AVAILABLE = False

try:
    from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
    TRANSFORMERS_AVAILABLE = True
    
    # Try importing vision model components
    try:
        from transformers import AutoProcessor, AutoModelForVision2Seq
        VISION_IMPORTS_AVAILABLE = True
    except ImportError:
        logger.warning("Vision model imports not available. Install with pip install transformers accelerate")
except ImportError:
    logger.warning("Transformers library not available. Install with pip install transformers")

try:
    import psutil
except ImportError:
    logger.warning("psutil not available. Install with pip install psutil for better memory management")

try:
    from llama_cpp import Llama
    LLAMA_CPP_AVAILABLE = True
except ImportError:
    logger.warning("llama-cpp-python not available. Install with pip install llama-cpp-python for GGUF model support")


class ModelLoader:
    """
    Handles loading and unloading of LLM models with memory optimization
    """
    
    def __init__(self, 
                 model_dir: str = None, 
                 use_gpu: bool = True,
                 low_memory_mode: bool = False,
                 max_loaded_models: int = 3):
        """
        Initialize the model loader

        Args:
            model_dir: Directory where models are stored
            use_gpu: Whether to use GPU if available
            low_memory_mode: Whether to optimize for low memory usage
            max_loaded_models: Maximum number of models to keep loaded
        """
        # Set default model directory if not provided
        if model_dir is None:
            self.model_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "models")
        else:
            self.model_dir = model_dir
            
        self.use_gpu = use_gpu and torch.cuda.is_available()
        self.low_memory_mode = low_memory_mode
        self.max_loaded_models = max_loaded_models
        self.loaded_models = {}
        self.loaded_tokenizers = {}
        self.current_model = None
        self.model_load_order = []  # Track order of model loading for LRU eviction
        
        # Create model directory if it doesn't exist
        os.makedirs(self.model_dir, exist_ok=True)
        
        # Create subdirectories for different model types
        os.makedirs(os.path.join(self.model_dir, "gguf"), exist_ok=True)
        os.makedirs(os.path.join(self.model_dir, "hf"), exist_ok=True)
        os.makedirs(os.path.join(self.model_dir, "vision"), exist_ok=True)
        
        logger.info(f"Model loader initialized. GPU enabled: {self.use_gpu}")
        if self.use_gpu:
            logger.info(f"Available GPU: {torch.cuda.get_device_name(0)}")
            logger.info(f"GPU memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.2f} GB")
        
        # Log memory resources
        try:
            mem_info = psutil.virtual_memory()
            logger.info(f"System memory: {mem_info.total / 1024**3:.2f} GB total, {mem_info.available / 1024**3:.2f} GB available")
        except (NameError, AttributeError):
            logger.info("System memory information unavailable (psutil not installed)")
    
    def _get_optimal_quantization(self) -> str:
        """
        Determine the optimal quantization level based on available resources

        Returns:
            String indicating the quantization level to use
        """
        if not self.use_gpu:
            return "Q4_0"  # Balanced quality and performance for CPU
        
        # Check available GPU memory
        try:
            gpu_mem = torch.cuda.get_device_properties(0).total_memory / 1024**3  # GB
            free_mem = torch.cuda.memory_reserved(0) / 1024**3  # GB
            
            if gpu_mem > 24:
                return "Q5_K_M"  # Higher quality for high-end GPUs
            elif gpu_mem > 8:
                return "Q4_K_M"  # Good balance for mid-range GPUs
            else:
                return "Q3_K_S" if self.low_memory_mode else "Q4_0"  # Aggressive for low memory
        except (RuntimeError, AttributeError):
            # Fall back to conservative option if GPU memory check fails
            return "Q4_0"
    
    def _manage_loaded_models(self, new_model_name: str) -> None:
        """
        Manage loaded models to prevent memory issues
        
        Args:
            new_model_name: Name of new model being loaded
        """
        # Add new model to load order or move it to the end if already loaded
        if new_model_name in self.model_load_order:
            self.model_load_order.remove(new_model_name)
        self.model_load_order.append(new_model_name)
        
        # If we exceed max models, unload the least recently used model
        if len(self.loaded_models) > self.max_loaded_models:
            # Get oldest model (first in order list)
            oldest_model = self.model_load_order[0]
            
            # Skip unloading if it's the model we're currently loading
            if oldest_model != new_model_name:
                logger.info(f"Unloading least recently used model: {oldest_model}")
                self.unload_model(oldest_model)
                self.model_load_order.pop(0)
    
    def download_hf_model(self, model_name: str, target_dir: Optional[str] = None) -> str:
        """
        Download a model from Hugging Face
        
        Args:
            model_name: Name of model to download (e.g., "mistralai/Mistral-7B-v0.1")
            target_dir: Optional target directory to save model
            
        Returns:
            Path where model was saved
        """
        if not TRANSFORMERS_AVAILABLE:
            raise ImportError("transformers library is required to download models")
        
        from transformers import AutoTokenizer, AutoModelForCausalLM
        
        logger.info(f"Downloading model: {model_name}")
        
        # Use default directory if not specified
        if target_dir is None:
            target_dir = os.path.join(self.model_dir, "hf", model_name.split("/")[-1])
        
        # Ensure directory exists
        os.makedirs(target_dir, exist_ok=True)
        
        # Download tokenizer and model
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = AutoModelForCausalLM.from_pretrained(model_name)
        
        # Save locally
        tokenizer.save_pretrained(target_dir)
        model.save_pretrained(target_dir)
        
        logger.info(f"Model {model_name} downloaded to {target_dir}")
        
        return target_dir
    
    def download_gguf_model(self, url: str, output_filename: Optional[str] = None) -> str:
        """
        Download a GGUF model from URL
        
        Args:
            url: URL to download from
            output_filename: Optional filename to save as
            
        Returns:
            Path where model was saved
        """
        import requests
        from tqdm import tqdm
        
        if output_filename is None:
            # Extract filename from URL
            output_filename = url.split("/")[-1]
        
        output_path = os.path.join(self.model_dir, "gguf", output_filename)
        
        logger.info(f"Downloading GGUF model from {url}")
        
        # Download with progress bar
        with requests.get(url, stream=True) as r:
            r.raise_for_status()
            total_size = int(r.headers.get('content-length', 0))
            
            with open(output_path, 'wb') as f, tqdm(
                total=total_size, unit='B', unit_scale=True, 
                desc=output_filename
            ) as pbar:
                for chunk in r.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        pbar.update(len(chunk))
        
        logger.info(f"GGUF model downloaded to {output_path}")
        
        return output_path
    
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
        if not TRANSFORMERS_AVAILABLE:
            raise ImportError("transformers library is required to load Hugging Face models")
        
        logger.info(f"Loading HF model: {model_name} for {agent_name}")
        
        # Check if model is already loaded
        if agent_name in self.loaded_models:
            logger.info(f"Model for {agent_name} already loaded")
            self._manage_loaded_models(agent_name)  # Update model load order
            return self.loaded_models[agent_name], self.loaded_tokenizers[agent_name]
        
        # Manage loaded models (might unload old models)
        self._manage_loaded_models(agent_name)
        
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
                      n_ctx: int = 4096,
                      n_gpu_layers: int = -1,
                      quantization: Optional[str] = None,
                      model_kwargs: Optional[Dict[str, Any]] = None) -> Any:
        """
        Load a GGUF model using llama-cpp-python

        Args:
            model_path: Path to the GGUF model file
            agent_name: Name of the agent using this model
            n_ctx: Context window size
            n_gpu_layers: Number of layers to offload to GPU (-1 = all)
            quantization: Quantization type (if None, will determine automatically)
            model_kwargs: Additional kwargs to pass to the Llama constructor

        Returns:
            Loaded Llama model
        """
        if not LLAMA_CPP_AVAILABLE:
            raise ImportError("llama-cpp-python library is required to load GGUF models")
        
        logger.info(f"Loading GGUF model: {model_path} for {agent_name}")
        
        # Check if model is already loaded
        if agent_name in self.loaded_models:
            logger.info(f"Model for {agent_name} already loaded")
            self._manage_loaded_models(agent_name)  # Update model load order
            return self.loaded_models[agent_name]
        
        # Manage loaded models (might unload old models)
        self._manage_loaded_models(agent_name)
        
        # Adjust GPU layers based on availability
        if not self.use_gpu:
            n_gpu_layers = 0
        
        # Use appropriate quantization if not specified
        if not quantization:
            quantization = self._get_optimal_quantization()
        
        # Prepare full path
        if not os.path.isabs(model_path):
            model_path = os.path.join(self.model_dir, "gguf", model_path)
        
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
            
            # Remove from load order tracking
            if agent_name in self.model_load_order:
                self.model_load_order.remove(agent_name)
            
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
            
            try:
                if hasattr(model, 'n_ctx'):  # GGUF model
                    return {
                        "type": "GGUF",
                        "loaded": True,
                        "context_length": model.n_ctx(),
                        "n_gpu_layers": model.n_gpu_layers(),
                        "device": "GPU" if model.n_gpu_layers() > 0 else "CPU",
                        "is_current": agent_name == self.current_model
                    }
                else:  # HF model
                    return {
                        "type": "Hugging Face",
                        "loaded": True,
                        "device": next(model.parameters()).device.type,
                        "dtype": str(next(model.parameters()).dtype),
                        "is_current": agent_name == self.current_model
                    }
            except Exception as e:
                logger.error(f"Error getting model info: {str(e)}")
                return {
                    "type": "Unknown",
                    "loaded": True,
                    "error": str(e),
                    "is_current": agent_name == self.current_model
                }
        
        # Return summary of all models
        result = {}
        for name, model in self.loaded_models.items():
            try:
                if hasattr(model, 'n_ctx'):  # GGUF model
                    result[name] = {
                        "type": "GGUF",
                        "loaded": True,
                        "device": "GPU" if model.n_gpu_layers() > 0 else "CPU",
                        "is_current": name == self.current_model
                    }
                else:  # HF model
                    result[name] = {
                        "type": "Hugging Face",
                        "loaded": True,
                        "device": next(model.parameters()).device.type,
                        "is_current": name == self.current_model
                    }
            except Exception:
                result[name] = {
                    "type": "Unknown",
                    "loaded": True,
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
    
    def list_available_models(self) -> Dict[str, List[Dict[str, str]]]:
        """
        List all available models in the model directory
        
        Returns:
            Dictionary with model types and lists of models
        """
        result = {
            "gguf": [],
            "hf": [],
            "vision": []
        }
        
        # Check GGUF models
        gguf_dir = os.path.join(self.model_dir, "gguf")
        if os.path.exists(gguf_dir):
            for filename in os.listdir(gguf_dir):
                if filename.endswith('.gguf'):
                    result["gguf"].append({
                        "name": filename,
                        "path": os.path.join(gguf_dir, filename)
                    })
        
        # Check HF models
        hf_dir = os.path.join(self.model_dir, "hf")
        if os.path.exists(hf_dir):
            for dirname in os.listdir(hf_dir):
                model_dir = os.path.join(hf_dir, dirname)
                if os.path.isdir(model_dir):
                    result["hf"].append({
                        "name": dirname,
                        "path": model_dir
                    })
        
        # Check Vision models
        vision_dir = os.path.join(self.model_dir, "vision")
        if os.path.exists(vision_dir):
            for dirname in os.listdir(vision_dir):
                model_dir = os.path.join(vision_dir, dirname)
                if os.path.isdir(model_dir):
                    result["vision"].append({
                        "name": dirname,
                        "path": model_dir
                    })
        
        return result
    
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
        

# For testing
if __name__ == "__main__":
    # Simple test
    loader = ModelLoader()
    print(f"Model directory: {loader.model_dir}")
    print(f"Available models: {loader.list_available_models()}")
