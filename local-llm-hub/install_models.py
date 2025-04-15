#!/usr/bin/env python3
"""
Model installer for Local LLM Hub.
This script handles downloading and setting up various LLM models.
"""

import os
import sys
import argparse
import shutil
import yaml
import json
from pathlib import Path
from typing import Dict, List, Optional, Union, Tuple
import subprocess
import platform
from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeElapsedColumn
from rich.table import Table
from rich.prompt import Confirm, Prompt, IntPrompt
import requests
from tqdm import tqdm

# Setup rich console
console = Console()

# Define model repositories and their details
MODEL_DETAILS = {
    "llama3.1": {
        "name": "Llama 3.1",
        "description": "Meta AI's latest open-source LLM with strong performance across tasks",
        "variants": ["8B", "70B"],
        "repository": "meta-llama/Llama-3.1-{variant}",
        "license": "Meta Llama 3 License",
        "default_variant": "8B",
        "disk_space_gb": {"8B": 16, "70B": 140},
        "ram_gb": {"8B": 16, "70B": 140},
        "recommended_vram_gb": {"8B": 12, "70B": 80},
        "can_run_on_cpu": {"8B": True, "70B": False},
        "quantization": ["4-bit", "8-bit"],
    },
    "mistral": {
        "name": "Mistral",
        "description": "Efficient open-source model with strong performance",
        "variants": ["7B"],
        "repository": "mistralai/Mistral-7B-v0.1",
        "license": "Apache 2.0",
        "default_variant": "7B",
        "disk_space_gb": {"7B": 14},
        "ram_gb": {"7B": 14},
        "recommended_vram_gb": {"7B": 10},
        "can_run_on_cpu": {"7B": True},
        "quantization": ["4-bit", "8-bit"],
    },
    "vicuna": {
        "name": "Vicuna",
        "description": "Tuned from Llama with conversational capabilities",
        "variants": ["7B", "13B"],
        "repository": "lmsys/vicuna-{variant}-v1.5",
        "license": "Non-commercial",
        "default_variant": "7B",
        "disk_space_gb": {"7B": 14, "13B": 26},
        "ram_gb": {"7B": 14, "13B": 26},
        "recommended_vram_gb": {"7B": 10, "13B": 20},
        "can_run_on_cpu": {"7B": True, "13B": True},
        "quantization": ["4-bit", "8-bit"],
    },
    "wizardlm": {
        "name": "WizardLM",
        "description": "Optimized for instruction following",
        "variants": ["7B", "13B"],
        "repository": "WizardLM/WizardLM-{variant}-v1.0",
        "license": "Non-commercial",
        "default_variant": "7B",
        "disk_space_gb": {"7B": 14, "13B": 26},
        "ram_gb": {"7B": 14, "13B": 26},
        "recommended_vram_gb": {"7B": 10, "13B": 20},
        "can_run_on_cpu": {"7B": True, "13B": True},
        "quantization": ["4-bit", "8-bit"],
    },
    "orca2": {
        "name": "Orca 2",
        "description": "Research model with strong reasoning capabilities",
        "variants": ["7B", "13B"],
        "repository": "microsoft/Orca-2-{variant}",
        "license": "Non-commercial",
        "default_variant": "7B",
        "disk_space_gb": {"7B": 14, "13B": 26},
        "ram_gb": {"7B": 14, "13B": 26},
        "recommended_vram_gb": {"7B": 10, "13B": 20},
        "can_run_on_cpu": {"7B": True, "13B": True},
        "quantization": ["4-bit", "8-bit"],
    },
    "phi3": {
        "name": "Phi-3",
        "description": "Microsoft's small but capable model",
        "variants": ["mini", "small"],
        "repository": "microsoft/phi-3-{variant}-4k-instruct",
        "license": "MIT",
        "default_variant": "mini",
        "disk_space_gb": {"mini": 2, "small": 8},
        "ram_gb": {"mini": 4, "small": 16},
        "recommended_vram_gb": {"mini": 4, "small": 10},
        "can_run_on_cpu": {"mini": True, "small": True},
        "quantization": ["4-bit", "8-bit"],
    },
    "mpt": {
        "name": "MPT",
        "description": "MosaicML's permissively licensed models",
        "variants": ["7B", "30B"],
        "repository": "mosaicml/mpt-{variant}",
        "license": "Apache 2.0",
        "default_variant": "7B",
        "disk_space_gb": {"7B": 14, "30B": 60},
        "ram_gb": {"7B": 14, "30B": 60},
        "recommended_vram_gb": {"7B": 10, "30B": 40},
        "can_run_on_cpu": {"7B": True, "30B": False},
        "quantization": ["4-bit", "8-bit"],
    },
    "falcon": {
        "name": "Falcon",
        "description": "Technology Innovation Institute's powerful model",
        "variants": ["7B", "40B"],
        "repository": "tiiuae/falcon-{variant}",
        "license": "Apache 2.0",
        "default_variant": "7B",
        "disk_space_gb": {"7B": 14, "40B": 80},
        "ram_gb": {"7B": 14, "40B": 80},
        "recommended_vram_gb": {"7B": 10, "40B": 60},
        "can_run_on_cpu": {"7B": True, "40B": False},
        "quantization": ["4-bit", "8-bit"],
    },
    "pythia": {
        "name": "Pythia",
        "description": "EleutherAI's suite of language models",
        "variants": ["7B", "12B"],
        "repository": "EleutherAI/pythia-{variant}",
        "license": "Apache 2.0",
        "default_variant": "7B",
        "disk_space_gb": {"7B": 14, "12B": 24},
        "ram_gb": {"7B": 14, "12B": 24},
        "recommended_vram_gb": {"7B": 10, "12B": 20},
        "can_run_on_cpu": {"7B": True, "12B": True},
        "quantization": ["4-bit", "8-bit"],
    },
    "rwkv": {
        "name": "RWKV",
        "description": "RNN-based alternative to transformer architecture",
        "variants": ["7B", "14B"],
        "repository": "BlinkDL/rwkv-{variant}-pile",
        "license": "Apache 2.0",
        "default_variant": "7B",
        "disk_space_gb": {"7B": 14, "14B": 28},
        "ram_gb": {"7B": 14, "14B": 28},
        "recommended_vram_gb": {"7B": 10, "14B": 24},
        "can_run_on_cpu": {"7B": True, "14B": True},
        "quantization": ["4-bit", "8-bit"],
    },
}

# Detect system capabilities
def detect_system_capabilities() -> Dict:
    """Detect system capabilities."""
    system_info = {
        "os": platform.system(),
        "cpu_count": os.cpu_count(),
        "python_version": platform.python_version(),
        "ram_gb": None,
        "gpu_info": None,
        "disk_free_gb": None,
    }
    
    # Detect RAM
    try:
        import psutil
        mem = psutil.virtual_memory()
        system_info["ram_gb"] = round(mem.total / (1024 ** 3))
        system_info["disk_free_gb"] = round(psutil.disk_usage('/').free / (1024 ** 3))
    except ImportError:
        console.print("[yellow]Warning: psutil not installed. Cannot detect RAM and disk space.[/yellow]")
    
    # Detect GPU
    try:
        import torch
        system_info["has_cuda"] = torch.cuda.is_available()
        system_info["cuda_version"] = torch.version.cuda if torch.cuda.is_available() else None
        system_info["gpu_count"] = torch.cuda.device_count() if torch.cuda.is_available() else 0
        
        if system_info["has_cuda"]:
            system_info["gpu_info"] = []
            for i in range(system_info["gpu_count"]):
                gpu_name = torch.cuda.get_device_name(i)
                # Estimate VRAM based on common known GPUs
                vram_gb = 0
                if "3090" in gpu_name: vram_gb = 24
                elif "4090" in gpu_name: vram_gb = 24
                elif "3080" in gpu_name: vram_gb = 10
                elif "2080" in gpu_name: vram_gb = 8
                elif "1080" in gpu_name: vram_gb = 8
                elif "A100" in gpu_name: vram_gb = 80
                # Add more known GPUs as needed
                
                system_info["gpu_info"].append({
                    "name": gpu_name,
                    "estimated_vram_gb": vram_gb
                })
    except ImportError:
        console.print("[yellow]Warning: PyTorch not installed. Cannot detect GPU.[/yellow]")
        system_info["has_cuda"] = False
        system_info["gpu_count"] = 0
    
    return system_info

def create_model_directory() -> str:
    """Create the models directory."""
    model_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
    os.makedirs(model_dir, exist_ok=True)
    return model_dir

def download_model(model_name: str, variant: str, model_dir: str, quantize: Optional[str] = None) -> bool:
    """Download a model from Hugging Face."""
    if model_name not in MODEL_DETAILS:
        console.print(f"[red]Error: Model {model_name} not found in the supported models list.[/red]")
        return False
    
    model_info = MODEL_DETAILS[model_name]
    if variant not in model_info["variants"]:
        console.print(f"[red]Error: Variant {variant} not found for model {model_name}.[/red]")
        return False
    
    # Create directory for the model
    model_path = os.path.join(model_dir, f"{model_name}-{variant.lower()}")
    os.makedirs(model_path, exist_ok=True)
    
    # Format repository name if it contains a placeholder
    repo_name = model_info["repository"]
    if "{variant}" in repo_name:
        repo_name = repo_name.format(variant=variant)
    
    console.print(f"[bold green]Downloading {model_info['name']} ({variant}) from {repo_name}...[/bold green]")
    
    # In a real implementation, you'd use the Hugging Face Hub API to download the model
    # This is a placeholder simulating the download process
    try:
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
            TimeElapsedColumn(),
        ) as progress:
            task = progress.add_task(f"Downloading {model_name}-{variant}", total=100)
            
            # Simulate download steps
            for i in range(100):
                # Simulate the download process
                import time
                time.sleep(0.05)  # This is just a placeholder
                progress.update(task, advance=1)
        
        # Write metadata
        with open(os.path.join(model_path, "metadata.json"), "w") as f:
            metadata = {
                "name": model_info["name"],
                "variant": variant,
                "repository": repo_name,
                "license": model_info["license"],
                "download_date": time.strftime("%Y-%m-%d %H:%M:%S"),
                "quantization": quantize
            }
            json.dump(metadata, f, indent=2)
        
        console.print(f"[bold green]Successfully downloaded {model_info['name']} ({variant})![/bold green]")
        console.print(f"[green]Model saved to: {model_path}[/green]")
        
        # In a real implementation, you'd now set up the model
        # For this simulation, we'll just create a placeholder config
        with open(os.path.join(model_path, "config.json"), "w") as f:
            config = {
                "model_type": model_name,
                "variant": variant,
                "quantization": quantize,
                "parameters": {
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "max_length": 2048
                }
            }
            json.dump(config, f, indent=2)
        
        return True
    except Exception as e:
        console.print(f"[red]Error downloading model: {str(e)}[/red]")
        return False

def update_global_config(installed_models):
    """Update the global configuration file with the installed models."""
    config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.yaml")
    
    config = {
        "models": {},
        "interface": {
            "theme": "dark",
            "port": 8000,
            "host": "127.0.0.1"
        }
    }
    
    # Load existing config if it exists
    if os.path.exists(config_path):
        with open(config_path, "r") as f:
            try:
                config = yaml.safe_load(f) or config
            except Exception:
                pass
    
    # Update models section
    for model_name, variant in installed_models:
        model_id = f"{model_name}-{variant.lower()}"
        config["models"][model_id] = {
            "path": f"./models/{model_id}",
            "type": model_name,
            "parameters": {
                "temperature": 0.7,
                "top_p": 0.9,
                "max_length": 2048
            }
        }
    
    # Write updated config
    with open(config_path, "w") as f:
        yaml.dump(config, f, default_flow_style=False)
    
    console.print(f"[green]Updated configuration in {config_path}[/green]")

def main():
    """Main function to run the installer."""
    console.print(Panel.fit(
        "[bold blue]Local LLM Hub - Model Installer[/bold blue]\n\n"
        "This tool helps you download and set up local LLM models.",
        title="Welcome",
        border_style="blue"
    ))
    
    # Create models directory
    model_dir = create_model_directory()
    
    # Detect system capabilities
    system_capabilities = detect_system_capabilities()
    
    # Display system information
    console.print("\n[bold]System Information:[/bold]")
    console.print(f"Operating System: {system_capabilities['os']}")
    console.print(f"Python Version: {system_capabilities['python_version']}")
    if system_capabilities['ram_gb']:
        console.print(f"RAM: {system_capabilities['ram_gb']} GB")
    if system_capabilities['disk_free_gb']:
        console.print(f"Free Disk Space: {system_capabilities['disk_free_gb']} GB")
    
    if system_capabilities['has_cuda']:
        console.print(f"CUDA Available: Yes (version {system_capabilities['cuda_version']})")
        console.print(f"GPU Count: {system_capabilities['gpu_count']}")
        for i, gpu in enumerate(system_capabilities['gpu_info']):
            console.print(f"  GPU {i+1}: {gpu['name']}")
            if gpu['estimated_vram_gb']:
                console.print(f"    Estimated VRAM: {gpu['estimated_vram_gb']} GB")
    else:
        console.print("CUDA Available: No")
    
    # Display available models
    console.print("\n[bold]Available Models:[/bold]")
    table = Table(show_header=True)
    table.add_column("ID", style="cyan")
    table.add_column("Name", style="green")
    table.add_column("Description")
    table.add_column("Variants", style="yellow")
    table.add_column("License", style="magenta")
    
    for model_id, model_info in MODEL_DETAILS.items():
        table.add_row(
            model_id,
            model_info["name"],
            model_info["description"],
            ", ".join(model_info["variants"]),
            model_info["license"]
        )
    
    console.print(table)
    
    # Multi-select models to install
    console.print("\n[bold]Model Selection[/bold]")
    console.print("Select models to install (comma-separated IDs, or 'all' for all models):")
    model_selection = Prompt.ask("Models to install", default="llama3.1,mistral")
    
    selected_models = []
    if model_selection.lower() == "all":
        selected_models = list(MODEL_DETAILS.keys())
    else:
        selected_models = [m.strip() for m in model_selection.split(",")]
        # Validate models
        for model in selected_models:
            if model not in MODEL_DETAILS:
                console.print(f"[red]Warning: Unknown model '{model}'. Skipping.[/red]")
                selected_models.remove(model)
    
    if not selected_models:
        console.print("[red]No valid models selected. Exiting.[/red]")
        return
    
    # Select model variants
    models_to_install = []
    for model_name in selected_models:
        model_info = MODEL_DETAILS[model_name]
        variants = model_info["variants"]
        
        if len(variants) == 1:
            console.print(f"[green]Selected {model_info['name']} with variant {variants[0]}[/green]")
            models_to_install.append((model_name, variants[0]))
        else:
            console.print(f"\n[bold]Select variant for {model_info['name']}:[/bold]")
            for i, variant in enumerate(variants):
                disk_space = model_info["disk_space_gb"][variant]
                ram_needed = model_info["ram_gb"][variant]
                console.print(f"{i+1}. {variant} (Requires {disk_space} GB disk, {ram_needed} GB RAM)")
            
            variant_choice = IntPrompt.ask(
                "Enter variant number",
                default=1,
                show_choices=False,
                show_default=True
            )
            
            if 1 <= variant_choice <= len(variants):
                selected_variant = variants[variant_choice-1]
                console.print(f"[green]Selected {model_info['name']} with variant {selected_variant}[/green]")
                models_to_install.append((model_name, selected_variant))
            else:
                console.print(f"[red]Invalid choice. Selecting default variant {model_info['default_variant']}.[/red]")
                models_to_install.append((model_name, model_info['default_variant']))
    
    # Confirm download
    console.print("\n[bold]Models to Install:[/bold]")
    for model_name, variant in models_to_install:
        model_info = MODEL_DETAILS[model_name]
        disk_space = model_info["disk_space_gb"][variant]
        console.print(f"- {model_info['name']} ({variant}) - {disk_space} GB")
    
    total_disk_space = sum(MODEL_DETAILS[model_name]["disk_space_gb"][variant] for model_name, variant in models_to_install)
    console.print(f"[yellow]Total disk space required: {total_disk_space} GB[/yellow]")
    
    if system_capabilities['disk_free_gb'] and total_disk_space > system_capabilities['disk_free_gb']:
        console.print(f"[red]Warning: You need {total_disk_space} GB but only have {system_capabilities['disk_free_gb']} GB free.[/red]")
        proceed = Confirm.ask("Do you want to proceed anyway?", default=False)
        if not proceed:
            console.print("[yellow]Installation cancelled.[/yellow]")
            return
    else:
        proceed = Confirm.ask("Proceed with installation?", default=True)
        if not proceed:
            console.print("[yellow]Installation cancelled.[/yellow]")
            return
    
    # Download models
    for model_name, variant in models_to_install:
        console.print(f"\n[bold]Installing {MODEL_DETAILS[model_name]['name']} ({variant})...[/bold]")
        
        # Ask for quantization
        quantize = None
        if Confirm.ask(f"Quantize {MODEL_DETAILS[model_name]['name']} for lower memory usage?", default=True):
            quantize_options = MODEL_DETAILS[model_name]["quantization"]
            console.print(f"Quantization options: {', '.join(quantize_options)}")
            
            quantize_choice = Prompt.ask(
                "Select quantization level",
                choices=quantize_options,
                default=quantize_options[0]
            )
            quantize = quantize_choice
            console.print(f"[green]Will apply {quantize} quantization[/green]")
        
        # Download the model
        success = download_model(model_name, variant, model_dir, quantize)
        if not success:
            console.print(f"[red]Failed to install {MODEL_DETAILS[model_name]['name']} ({variant})[/red]")
    
    # Update global configuration
    update_global_config(models_to_install)
    
    console.print("\n[bold green]Installation complete![/bold green]")
    console.print("You can now use the installed models with the Local LLM Hub.")
    console.print("Run 'python app.py' to start the web interface.")

if __name__ == "__main__":
    main()
