import os
import time
import sys
from pathlib import Path

def get_model_files_size():
    """Get the total size of downloaded model files"""
    cache_dir = os.path.expanduser("~/.cache/huggingface/hub")
    model_dir = os.path.join(cache_dir, "models--HuggingFaceH4--zephyr-7b-beta")
    
    total_size = 0
    if os.path.exists(model_dir):
        for root, _, files in os.walk(model_dir):
            for file in files:
                if file.startswith("model-") and file.endswith(".safetensors"):
                    total_size += os.path.getsize(os.path.join(root, file))
    
    return total_size

def format_size(size_bytes):
    """Format size in bytes to human readable format"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} TB"

def monitor_progress():
    """Monitor model download progress"""
    expected_size = 4.1 * 1024 * 1024 * 1024  # ~4.1GB
    print("Monitoring Zephyr model download progress...")
    print("Expected total size: ~4.1GB")
    
    try:
        while True:
            current_size = get_model_files_size()
            progress = (current_size / expected_size) * 100
            
            # Create progress bar
            bar_length = 50
            filled_length = int(bar_length * current_size // expected_size)
            bar = '=' * filled_length + '-' * (bar_length - filled_length)
            
            # Clear line and print progress
            sys.stdout.write('\r')
            sys.stdout.write(f'Progress: [{bar}] {progress:.1f}% ({format_size(current_size)})')
            sys.stdout.flush()
            
            if current_size >= expected_size:
                print("\nDownload completed!")
                break
            
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\nMonitoring stopped by user")
    except Exception as e:
        print(f"\nError monitoring progress: {str(e)}")

if __name__ == "__main__":
    monitor_progress()
