import os
import sys
import argparse
from huggingface_hub import snapshot_download
from transformers import AutoModelForCausalLM, AutoTokenizer

def download_model(model_id, revision=None, force_download=False):
    """
    Download model files from Hugging Face Hub
    
    Args:
        model_id: The model ID to download
        revision: Optional specific model revision
        force_download: Whether to force re-download if files exist
    """
    print(f"Downloading model: {model_id}")
    print("This may take a while depending on your internet connection...")
    
    try:
        # Download the tokenizer first (smaller)
        print("\nDownloading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(
            model_id, 
            revision=revision,
            force_download=force_download
        )
        print("Tokenizer downloaded successfully!")
        
        # Download the full model files
        print("\nDownloading model files...")
        snapshot_download(
            repo_id=model_id,
            revision=revision,
            local_dir=os.path.join(os.path.expanduser("~"), ".cache", "huggingface", "hub"),
            local_dir_use_symlinks=False,
            force_download=force_download
        )
        
        print("\nModel files downloaded successfully!")
        print(f"Model ID: {model_id}")
        
        # Get model size info
        model_info = os.path.getsize(os.path.join(os.path.expanduser("~"), ".cache", "huggingface", "hub", model_id))
        print(f"Approximate download size: {model_info / (1024 * 1024 * 1024):.2f} GB")
        
        print("\nThe model is now ready for use with the Zephyr API server.")
        print("You can start the server with: python main.py")
        
    except Exception as e:
        print(f"Error downloading model: {str(e)}")
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Download Zephyr LLM model files")
    parser.add_argument(
        "--model", 
        default="HuggingFaceH4/zephyr-7b-beta",
        help="Model ID to download (default: HuggingFaceH4/zephyr-7b-beta)"
    )
    parser.add_argument(
        "--revision",
        default=None,
        help="Optional specific model revision"
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force re-download even if files exist"
    )
    
    args = parser.parse_args()
    download_model(args.model, args.revision, args.force)

if __name__ == "__main__":
    main()
