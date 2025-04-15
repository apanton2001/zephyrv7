"""
Setup script for Business LLM Assistant

This script handles installation, model downloading, and initial configuration.
"""

import os
import sys
import argparse
import logging
import subprocess
import requests
import shutil
import json
import yaml
from tqdm import tqdm
from pathlib import Path
from typing import List, Dict, Any, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Model information for downloading
MODEL_INFO = {
    # Original models
    "OpenHermes-2.5-Mistral-7B-GGUF": {
        "url": "https://huggingface.co/TheBloke/OpenHermes-2.5-Mistral-7B-GGUF/resolve/main/openhermes-2.5-mistral-7b.Q4_K_M.gguf",
        "description": "Central coordinator model",
        "size_mb": 4200,
        "quantization": "Q4_K_M",
        "type": "gguf"
    },
    "Nous-Hermes-2-SOLAR-10.7B-GGUF": {
        "url": "https://huggingface.co/TheBloke/Nous-Hermes-2-SOLAR-10.7B-GGUF/resolve/main/nous-hermes-2-solar-10.7b.Q4_K_M.gguf",
        "description": "Outreach agent model",
        "size_mb": 6800,
        "quantization": "Q4_K_M",
        "type": "gguf"
    },
    "Dolphin-2.5-Mistral-7B-GGUF": {
        "url": "https://huggingface.co/TheBloke/Dolphin-2.5-Mistral-7B-GGUF/resolve/main/dolphin-2.5-mistral-7b.Q4_K_M.gguf",
        "description": "Finance agent model",
        "size_mb": 4200,
        "quantization": "Q4_K_M",
        "type": "gguf"
    },
    "DeepCoder-14B-Preview-GGUF": {
        "url": "https://huggingface.co/TheBloke/DeepCoder-14B-Preview-GGUF/resolve/main/deepcoder-14b-preview.Q4_K_M.gguf",
        "description": "Data analyzer model",
        "size_mb": 8500,
        "quantization": "Q4_K_M",
        "type": "gguf"
    },
    
    # Newly added models
    "DeepCoder-14B-HF": {
        "url": "agentica-org/DeepCoder-14B-Preview",
        "description": "DeepCoder model (Hugging Face native)",
        "size_mb": 28000,
        "quantization": "None",
        "type": "hf",
        "requires": "16GB+ VRAM for full precision"
    },
    "Kimi-VL-A3B": {
        "url": "moonshotai/Kimi-VL-A3B-Thinking",
        "description": "Kimi VL model with visual capabilities",
        "size_mb": 7000,
        "quantization": "None",
        "type": "hf",
        "special_features": "Multimodal (vision+language)",
        "requires": "10GB+ VRAM for full precision"
    },
    "Llama-3-8B-GGUF": {
        "url": "https://huggingface.co/TheBloke/Llama-3-8B-GGUF/resolve/main/llama-3-8b.Q4_K_M.gguf",
        "description": "Llama 3 8B model (smaller alternative to Nemotron)",
        "size_mb": 5200,
        "quantization": "Q4_K_M",
        "type": "gguf"
    },
    "Llama-3-70B-GGUF": {
        "url": "https://huggingface.co/TheBloke/Llama-3-70B-GGUF/resolve/main/llama-3-70b.Q2_K.gguf",
        "description": "Llama 3 70B model (server-class)",
        "size_mb": 39000,
        "quantization": "Q2_K",
        "type": "gguf",
        "requires": "32GB+ system RAM or 16GB+ VRAM"
    }
}

# Note on Ultra-Large Models:
# The following models are not included in automated downloads due to their extreme size:
# - Llama-3_1-Nemotron-Ultra-253B-v1: 253B parameters, requires specialized hardware
#   This model requires datacenter-grade hardware (multiple A100/H100 GPUs)
#   For inference using this model, consider API alternatives


def download_file(url: str, destination: str) -> bool:
    """
    Download a file with progress bar
    
    Args:
        url: URL to download
        destination: Destination path
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(destination), exist_ok=True)
        
        # Download with progress bar
        response = requests.get(url, stream=True)
        total_size = int(response.headers.get('content-length', 0))
        block_size = 1024  # 1 Kibibyte
        
        with open(destination, 'wb') as f, tqdm(
                desc=os.path.basename(destination),
                total=total_size,
                unit='iB',
                unit_scale=True,
                unit_divisor=1024,
            ) as bar:
            for data in response.iter_content(block_size):
                size = f.write(data)
                bar.update(size)
        
        return True
        
    except Exception as e:
        logger.error(f"Error downloading {url}: {str(e)}")
        return False


def download_models(model_dir: str, models: Optional[List[str]] = None) -> bool:
    """
    Download specified models
    
    Args:
        model_dir: Directory to save models
        models: List of model names to download, or None for all
        
    Returns:
        True if all downloads successful, False otherwise
    """
    os.makedirs(model_dir, exist_ok=True)
    logger.info(f"Downloading models to {model_dir}")
    
    # If no models specified, download all
    if not models:
        models = list(MODEL_INFO.keys())
    
    success = True
    
    for model_name in models:
        if model_name not in MODEL_INFO:
            logger.warning(f"Unknown model: {model_name}")
            success = False
            continue
        
        model_info = MODEL_INFO[model_name]
        model_type = model_info.get("type", "gguf")
        
        if model_type == "gguf":
            # Handle GGUF direct download
            model_file = os.path.join(model_dir, f"{model_name}.gguf")
            
            # Check if model already exists
            if os.path.exists(model_file):
                logger.info(f"Model {model_name} already exists at {model_file}")
                continue
            
            # Download model
            logger.info(f"Downloading {model_name} ({model_info['description']}, {model_info['size_mb']} MB)")
            if download_file(model_info['url'], model_file):
                logger.info(f"Successfully downloaded {model_name} to {model_file}")
            else:
                logger.error(f"Failed to download {model_name}")
                success = False
                
        elif model_type == "hf":
            # For Hugging Face models, we just prepare the directory and report
            # as these are downloaded via the transformers library when first used
            model_dir_hf = os.path.join(model_dir, model_name)
            os.makedirs(model_dir_hf, exist_ok=True)
            
            logger.info(f"Prepared directory for Hugging Face model: {model_name}")
            logger.info(f"This model ({model_info['description']}) will be downloaded when first used")
            logger.info(f"Model repository: {model_info['url']}")
            
            if 'requires' in model_info:
                logger.info(f"Hardware requirements: {model_info['requires']}")
            
            if 'special_features' in model_info:
                logger.info(f"Special features: {model_info['special_features']}")
            
            # Create a marker file to indicate this is a Hugging Face model
            with open(os.path.join(model_dir_hf, ".hf_model"), "w") as f:
                f.write(f"Model: {model_name}\nRepository: {model_info['url']}\n")
        
        else:
            logger.warning(f"Unknown model type '{model_type}' for {model_name}")
            success = False
    
    return success


def install_requirements() -> bool:
    """
    Install required packages
    
    Returns:
        True if successful, False otherwise
    """
    try:
        logger.info("Installing requirements")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        logger.info("Requirements installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Error installing requirements: {str(e)}")
        return False


def generate_config(config_path: str) -> bool:
    """
    Generate default configuration file
    
    Args:
        config_path: Path to save configuration
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Check if config already exists
        if os.path.exists(config_path):
            logger.info(f"Configuration file already exists at {config_path}")
            return True
        
        # Create default configuration
        config = {
            "system": {
                "model_dir": "data/models",
                "use_gpu": True,
                "low_memory_mode": False,
                "log_level": "INFO"
            },
            "agents": [
                {
                    "name": "coordinator",
                    "type": "coordinator",
                    "model_name": "OpenHermes-2.5-Mistral-7B-GGUF.gguf",
                    "model_type": "gguf",
                    "context_length": 4096,
                    "temperature": 0.7,
                    "top_p": 0.9
                },
                {
                    "name": "outreach",
                    "type": "outreach",
                    "model_name": "Nous-Hermes-2-SOLAR-10.7B-GGUF.gguf",
                    "model_type": "gguf",
                    "context_length": 4096,
                    "temperature": 0.7,
                    "top_p": 0.9
                },
                {
                    "name": "finance",
                    "type": "finance",
                    "model_name": "Dolphin-2.5-Mistral-7B-GGUF.gguf",
                    "model_type": "gguf",
                    "context_length": 4096,
                    "temperature": 0.7,
                    "top_p": 0.9
                },
                {
                    "name": "data_analyzer",
                    "type": "data_analyzer",
                    "model_name": "DeepCoder-14B-Preview-GGUF.gguf",
                    "model_type": "gguf",
                    "context_length": 4096,
                    "temperature": 0.7,
                    "top_p": 0.9
                }
            ],
            "api": {
                "enabled": False,
                "port": 5000,
                "host": "127.0.0.1"
            },
            "voice": {
                "enabled": False,
                "wake_word": "Business Assistant",
                "tts_engine": "pyttsx3",
                "stt_engine": "whisper"
            },
            "mcp": {
                "enabled": True,
                "servers": [
                    "content-assistant",
                    "dev-assistant"
                ]
            }
        }
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(config_path), exist_ok=True)
        
        # Save configuration
        with open(config_path, 'w') as f:
            yaml.dump(config, f, default_flow_style=False, sort_keys=False)
        
        logger.info(f"Generated configuration file at {config_path}")
        return True
        
    except Exception as e:
        logger.error(f"Error generating configuration: {str(e)}")
        return False


def create_directories() -> bool:
    """
    Create required directories
    
    Returns:
        True if successful, False otherwise
    """
    try:
        directories = [
            "data/models",
            "data/documents",
            "data/vector_db",
            "data/conversation",
            "logs"
        ]
        
        for directory in directories:
            os.makedirs(directory, exist_ok=True)
            logger.info(f"Created directory: {directory}")
        
        return True
        
    except Exception as e:
        logger.error(f"Error creating directories: {str(e)}")
        return False


def clean() -> bool:
    """
    Clean up data files
    
    Returns:
        True if successful, False otherwise
    """
    try:
        directories = [
            "data/models",
            "data/documents",
            "data/vector_db",
            "data/conversation",
            "__pycache__",
            "*.pyc"
        ]
        
        for pattern in directories:
            if pattern.startswith("*"):
                # Use glob for pattern matching
                import glob
                for file in glob.glob(pattern):
                    os.remove(file)
                    logger.info(f"Removed file: {file}")
            else:
                # Remove directory if it exists
                if os.path.exists(pattern):
                    shutil.rmtree(pattern)
                    logger.info(f"Removed directory: {pattern}")
        
        return True
        
    except Exception as e:
        logger.error(f"Error cleaning: {str(e)}")
        return False


def main():
    """
    Main function for setup script
    """
    parser = argparse.ArgumentParser(description='Setup Business LLM Assistant')
    
    # Main options
    parser.add_argument('--download-models', action='store_true', help='Download pre-trained models')
    parser.add_argument('--models', nargs='+', help='Specific models to download')
    parser.add_argument('--install-requirements', action='store_true', help='Install required packages')
    parser.add_argument('--generate-config', action='store_true', help='Generate default configuration')
    parser.add_argument('--create-directories', action='store_true', help='Create required directories')
    parser.add_argument('--clean', action='store_true', help='Clean up data files')
    parser.add_argument('--all', action='store_true', help='Perform all setup actions')
    
    # Configuration
    parser.add_argument('--config-path', type=str, default='config.yaml', help='Path to configuration file')
    parser.add_argument('--model-dir', type=str, default='data/models', help='Directory to store models')
    
    args = parser.parse_args()
    
    # If no arguments provided, show help
    if len(sys.argv) == 1:
        parser.print_help()
        return
    
    # Execute requested actions
    if args.all or args.create_directories:
        create_directories()
    
    if args.all or args.install_requirements:
        install_requirements()
    
    if args.all or args.generate_config:
        generate_config(args.config_path)
    
    if args.all or args.download_models:
        download_models(args.model_dir, args.models)
    
    if args.clean:
        clean()


if __name__ == "__main__":
    main()
