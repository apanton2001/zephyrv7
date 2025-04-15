#!/usr/bin/env python3
"""
Command-line interface for Local LLM Hub.
This script provides command-line access to the LLM models.
"""

import os
import sys
import time
import json
import yaml
import logging
import argparse
from typing import Dict, List, Optional, Union, Any
from pathlib import Path
# Optional readline import for better CLI experience (not available on Windows)
try:
    import readline
except ImportError:
    pass  # readline not available on Windows

# Rich for CLI output
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich import box
from rich.markdown import Markdown
from rich.syntax import Syntax
from rich.prompt import Prompt, Confirm

# Import core functionality from the main module
# (We're duplicating some code here for simplicity, but in a real implementation
# we'd refactor shared code into separate modules)
try:
    from app import load_config, get_available_models, load_model, generate_response
except ImportError:
    # Define the core functions here if imports fail
    def load_config():
        """Load configuration from config.yaml."""
        config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.yaml")
        
        default_config = {
            "models": {},
            "interface": {
                "theme": "dark",
                "port": 8000,
                "host": "127.0.0.1"
            }
        }
        
        if not os.path.exists(config_path):
            print("Warning: config.yaml not found. Using default configuration.")
            # Create default config
            with open(config_path, "w") as f:
                yaml.dump(default_config, f, default_flow_style=False)
            return default_config
        
        try:
            with open(config_path, "r") as f:
                loaded_config = yaml.safe_load(f)
                return loaded_config or default_config
        except Exception as e:
            print(f"Error loading config: {str(e)}. Using default configuration.")
            return default_config
    
    # Mock model for demonstration
    class MockModel:
        def __init__(self, model_id, model_config):
            self.model_id = model_id
            self.config = model_config
            self.name = model_config.get('name', model_id)
            self.parameters = model_config.get('parameters', {})
        
        def generate(self, prompt, max_length=100, temperature=0.7, top_p=0.9):
            """Mock generation function."""
            time.sleep(1)  # Simulate thinking time
            
            # Simple responses based on model ID
            if "llama" in self.model_id:
                return f"[Llama 3.1 response]: I'm a helpful assistant trained by Meta AI. Here's my response to '{prompt}'..."
            elif "mistral" in self.model_id:
                return f"[Mistral response]: I'm an efficient assistant. Regarding '{prompt}', I think..."
            elif "vicuna" in self.model_id:
                return f"[Vicuna response]: As a conversational assistant, I'd like to discuss '{prompt}' with you..."
            else:
                return f"[{self.name} response]: This is a simulated response to '{prompt}'. In a real implementation, the actual model would generate content here."
    
    # Global variables
    loaded_models = {}
    config = load_config()
    
    def get_available_models() -> List[Dict]:
        """Get list of available models from config."""
        models_list = []
        
        for model_id, model_config in config.get('models', {}).items():
            # Check if model files exist
            model_path = model_config.get('path', '')
            path_exists = os.path.exists(model_path)
            
            # If path doesn't exist, try relative path
            if not path_exists:
                relative_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), model_path)
                path_exists = os.path.exists(relative_path)
            
            models_list.append({
                'id': model_id,
                'name': model_config.get('name', model_id),
                'type': model_config.get('type', 'unknown'),
                'loaded': model_id in loaded_models,
                'available': path_exists
            })
        
        return models_list
    
    def load_model(model_id: str) -> Optional[Any]:
        """Load a model based on its ID."""
        global loaded_models, config
        
        if model_id in loaded_models:
            print(f"Model {model_id} already loaded")
            return loaded_models[model_id]
        
        if model_id not in config.get('models', {}):
            print(f"Model {model_id} not found in configuration")
            return None
        
        model_config = config['models'][model_id]
        model_path = model_config.get('path', '')
        
        # Check if path exists
        if not os.path.exists(model_path):
            # Try relative path
            relative_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), model_path)
            if not os.path.exists(relative_path):
                print(f"Model path not found: {model_path}")
                return None
            model_path = relative_path
        
        try:
            print(f"Loading model {model_id}...")
            
            # Use mock implementation for this standalone script
            model = MockModel(model_id, model_config)
            loaded_models[model_id] = model
            print(f"Loaded model {model_id} (simulation)")
            
            return loaded_models[model_id]
        except Exception as e:
            print(f"Error loading model {model_id}: {str(e)}")
            return None
    
    def generate_response(model_id: str, prompt: str, parameters: Optional[Dict] = None) -> Dict:
        """Generate a response from a model."""
        if model_id not in loaded_models:
            model = load_model(model_id)
            if not model:
                return {
                    'success': False,
                    'error': f'Model {model_id} could not be loaded',
                    'response': None
                }
        else:
            model = loaded_models[model_id]
        
        # Set default parameters
        params = {
            'temperature': 0.7,
            'top_p': 0.9,
            'max_length': 100,
        }
        
        # Update with model-specific parameters from config
        if model_id in config.get('models', {}):
            model_params = config['models'][model_id].get('parameters', {})
            params.update(model_params)
        
        # Update with request parameters
        if parameters:
            params.update(parameters)
        
        try:
            # Generate response
            start_time = time.time()
            response = model.generate(prompt, **params)
            end_time = time.time()
            
            return {
                'success': True,
                'model_id': model_id,
                'response': response,
                'parameters': params,
                'generation_time': end_time - start_time
            }
        except Exception as e:
            print(f"Error generating response from model {model_id}: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'response': None
            }

# Setup rich console
console = Console()

def print_header():
    """Print the CLI header."""
    console.print(Panel.fit(
        "[bold blue]Local LLM Hub - CLI[/bold blue]\n\n"
        "Access your local LLMs from the command line",
        title="Welcome",
        border_style="blue"
    ))

def list_models():
    """List available models."""
    models = get_available_models()
    
    if not models:
        console.print("[yellow]No models found in configuration.[/yellow]")
        console.print("Run [green]python install_models.py[/green] to install models.")
        return

    table = Table(title="Available Models", box=box.ROUNDED)
    table.add_column("ID", style="cyan")
    table.add_column("Name", style="green")
    table.add_column("Type", style="magenta")
    table.add_column("Status", style="yellow")
    
    for model in models:
        status = "Loaded" if model['loaded'] else "Available" if model['available'] else "Not Found"
        table.add_row(model['id'], model['name'], model['type'], status)
    
    console.print(table)

def single_response(model_id, prompt, temperature=0.7, top_p=0.9, max_length=2048):
    """Generate a single response from a model."""
    console.print(f"[bold]Generating response from [cyan]{model_id}[/cyan]...[/bold]")
    
    parameters = {
        'temperature': temperature,
        'top_p': top_p,
        'max_length': max_length
    }
    
    result = generate_response(model_id, prompt, parameters)
    
    if result['success']:
        console.print("\n[bold green]Response:[/bold green]")
        console.print(Panel(result['response'], title=f"Model: {model_id}", expand=False))
        console.print(f"[dim]Generated in {result['generation_time']:.2f} seconds[/dim]")
    else:
        console.print(f"[bold red]Error: {result['error']}[/bold red]")

def compare_models(model_ids, prompt, temperature=0.7, top_p=0.9, max_length=2048):
    """Compare responses from multiple models."""
    models = []
    
    # Validate and load models
    for model_id in model_ids:
        model = load_model(model_id)
        if model:
            models.append(model_id)
        else:
            console.print(f"[yellow]Warning: Could not load model [cyan]{model_id}[/cyan]. Skipping.[/yellow]")
    
    if not models:
        console.print("[red]No valid models to compare. Exiting.[/red]")
        return
    
    console.print(f"[bold]Comparing {len(models)} models on prompt:[/bold]")
    console.print(Panel(prompt, title="Prompt", expand=False))
    
    parameters = {
        'temperature': temperature,
        'top_p': top_p,
        'max_length': max_length
    }
    
    # Generate responses from each model
    results = []
    with console.status(f"[bold green]Generating responses from {len(models)} models...[/bold green]"):
        for model_id in models:
            result = generate_response(model_id, prompt, parameters)
            results.append(result)
    
    # Display results in a table
    table = Table(title="Model Comparison Results", box=box.ROUNDED)
    table.add_column("Model", style="cyan")
    table.add_column("Response", style="green")
    table.add_column("Time", style="magenta")
    
    for result in results:
        if result['success']:
            model_id = result['model_id']
            response = result['response']
            time_taken = f"{result['generation_time']:.2f}s"
            table.add_row(model_id, response, time_taken)
        else:
            model_id = result['model_id']
            table.add_row(model_id, f"[red]Error: {result['error']}[/red]", "N/A")
    
    console.print(table)

def chat_mode(model_id, temperature=0.7, top_p=0.9, max_length=2048):
    """Interactive chat mode with a model."""
    model = load_model(model_id)
    if not model:
        console.print(f"[red]Could not load model {model_id}. Exiting chat mode.[/red]")
        return
    
    console.print(Panel.fit(
        f"[bold blue]Chat Mode with {model_id}[/bold blue]\n\n"
        "Type your messages and press Enter to get responses.\n"
        "Type 'exit', 'quit', or press Ctrl+C to end the chat.",
        title="Chat Started",
        border_style="green"
    ))
    
    parameters = {
        'temperature': temperature,
        'top_p': top_p,
        'max_length': max_length
    }
    
    # Chat history (could be used for context in a real implementation)
    history = []
    
    try:
        while True:
            console.print("\n[bold blue]You:[/bold blue] ", end="")
            user_input = input()
            
            if user_input.lower() in ['exit', 'quit', 'q', 'bye']:
                console.print("[bold green]Ending chat session.[/bold green]")
                break
            
            history.append(("user", user_input))
            
            # In a real implementation, we would pass the full history for context
            result = generate_response(model_id, user_input, parameters)
            
            if result['success']:
                console.print(f"\n[bold green]{model_id}:[/bold green] {result['response']}")
                history.append(("assistant", result['response']))
            else:
                console.print(f"\n[bold red]Error: {result['error']}[/bold red]")
    
    except KeyboardInterrupt:
        console.print("\n[bold green]Chat session ended by user.[/bold green]")

def parse_arguments():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description='Local LLM Hub CLI')
    
    # Add commands
    subparsers = parser.add_subparsers(dest='command', help='Command to run')
    
    # List models command
    list_parser = subparsers.add_parser('list', help='List available models')
    
    # Generate response command
    generate_parser = subparsers.add_parser('generate', help='Generate a response from a model')
    generate_parser.add_argument('--model', '-m', type=str, required=True, help='Model ID to use')
    generate_parser.add_argument('--prompt', '-p', type=str, required=True, help='Prompt for the model')
    generate_parser.add_argument('--temperature', '-t', type=float, default=0.7, help='Temperature parameter (0-2)')
    generate_parser.add_argument('--top-p', type=float, default=0.9, help='Top P parameter (0-1)')
    generate_parser.add_argument('--max-length', type=int, default=2048, help='Maximum response length')
    
    # Compare models command
    compare_parser = subparsers.add_parser('compare', help='Compare responses from multiple models')
    compare_parser.add_argument('--models', '-m', type=str, required=True, help='Comma-separated list of model IDs')
    compare_parser.add_argument('--prompt', '-p', type=str, required=True, help='Prompt for the models')
    compare_parser.add_argument('--temperature', '-t', type=float, default=0.7, help='Temperature parameter (0-2)')
    compare_parser.add_argument('--top-p', type=float, default=0.9, help='Top P parameter (0-1)')
    compare_parser.add_argument('--max-length', type=int, default=2048, help='Maximum response length')
    
    # Chat mode command
    chat_parser = subparsers.add_parser('chat', help='Interactive chat with a model')
    chat_parser.add_argument('--model', '-m', type=str, required=True, help='Model ID to chat with')
    chat_parser.add_argument('--temperature', '-t', type=float, default=0.7, help='Temperature parameter (0-2)')
    chat_parser.add_argument('--top-p', type=float, default=0.9, help='Top P parameter (0-1)')
    chat_parser.add_argument('--max-length', type=int, default=2048, help='Maximum response length')
    
    return parser.parse_args()

def main():
    """Main function to run the CLI."""
    print_header()
    
    args = parse_arguments()
    
    # Handle commands
    if args.command == 'list':
        list_models()
    
    elif args.command == 'generate':
        single_response(
            args.model,
            args.prompt,
            temperature=args.temperature,
            top_p=args.top_p,
            max_length=args.max_length
        )
    
    elif args.command == 'compare':
        models = [m.strip() for m in args.models.split(',')]
        compare_models(
            models,
            args.prompt,
            temperature=args.temperature,
            top_p=args.top_p,
            max_length=args.max_length
        )
    
    elif args.command == 'chat':
        chat_mode(
            args.model,
            temperature=args.temperature,
            top_p=args.top_p,
            max_length=args.max_length
        )
    
    else:
        # If no command is specified, show help
        console.print("[yellow]No command specified.[/yellow]")
        console.print("Available commands: [green]list[/green], [green]generate[/green], [green]compare[/green], [green]chat[/green]")
        console.print("Use [green]--help[/green] for more information.")

if __name__ == "__main__":
    main()
