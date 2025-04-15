#!/usr/bin/env python3
"""
Example script demonstrating how to use the Uncensored-HackerCoding-GPT model 
with Cline programmatically (for educational purposes only).

This is a demonstration script to show the concept of how such an integration
might work. It requires a valid Hugging Face API key.
"""

import json
import os
import requests
import sys

# Configuration paths
CONFIG_FILE = "cline_hacker_gpt_config.json"
USER_CONFIG_DIR = os.path.expanduser("~/.config/cline/models/")

def load_config(config_path):
    """Load the Uncensored-HackerCoding-GPT configuration."""
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
        return config
    except FileNotFoundError:
        print(f"Error: Configuration file not found at {config_path}")
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON in configuration file at {config_path}")
        sys.exit(1)

def validate_config(config):
    """Check if the configuration contains a valid API key."""
    api_key = config.get("api_config", {}).get("api_key", "")
    if api_key == "YOUR_HUGGINGFACE_API_KEY" or not api_key:
        print("Error: Please update the configuration with your Hugging Face API key")
        return False
    return True

def install_config():
    """Copy the configuration file to the Cline models directory."""
    os.makedirs(USER_CONFIG_DIR, exist_ok=True)
    dest_path = os.path.join(USER_CONFIG_DIR, "uncensored_hacker_gpt.json")
    
    try:
        config = load_config(CONFIG_FILE)
        with open(dest_path, 'w') as f:
            json.dump(config, f, indent=2)
        print(f"Configuration installed to {dest_path}")
        return True
    except Exception as e:
        print(f"Error installing configuration: {e}")
        return False

def send_prompt_to_model(config, prompt):
    """Send a programming prompt to the model and get a response."""
    base_url = config["api_config"]["base_url"]
    headers = config["api_config"]["headers"]
    
    # Set up the payload based on the inference parameters
    payload = {
        "inputs": prompt,
        **config["inference_params"]
    }
    
    try:
        response = requests.post(base_url, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"API request error: {e}")
        return None

def main():
    print("Uncensored-HackerCoding-GPT Demo for Cline")
    print("===========================================")
    print("This script demonstrates how to use the configuration for educational purposes.")
    
    # Check for command line arguments
    if len(sys.argv) > 1:
        action = sys.argv[1]
        
        # Load configuration
        try:
            config = load_config(CONFIG_FILE)
        except Exception as e:
            print(f"Error loading configuration: {e}")
            sys.exit(1)
        
        # Process command line actions
        if action == "install":
            install_config()
            sys.exit(0)
            
        elif action == "test":
            if len(sys.argv) > 2:
                prompt = sys.argv[2]
                print(f"Testing prompt: {prompt}")
                response = send_prompt_to_model(config, prompt)
                
                if response:
                    print("\n--- Model Response ---")
                    if isinstance(response, list):
                        # Handle list response format from Hugging Face
                        for item in response:
                            if isinstance(item, dict) and "generated_text" in item:
                                print(item["generated_text"])
                            else:
                                print(item)
                    else:
                        # Handle direct text response
                        print(response)
                    print("----------------------")
                else:
                    print("Failed to get a response from the model.")
                sys.exit(0)
            else:
                print("Error: No prompt provided for testing.")
                print("Usage: python use_hacker_gpt_with_cline.py test 'your prompt here'")
                sys.exit(1)
        
        # If no valid command line action is provided, fall through to interactive mode
    
    # Interactive mode
    # Load and validate configuration
    config = load_config(CONFIG_FILE)
    if not validate_config(config):
        print("The configuration file contains an invalid or missing API key.")
        print(f"Please edit {CONFIG_FILE} to update your Hugging Face API key.")
        print("Current API key has been updated with the value from your command.")
        sys.exit(1)
    
    # Menu options
    while True:
        try:
            print("\nOptions:")
            print("1. Install configuration to Cline")
            print("2. Test a coding prompt")
            print("3. Exit")
            
            choice = input("Select an option: ")
            
            if choice == "1":
                install_config()
            
            elif choice == "2":
                prompt = input("Enter a programming prompt: ")
                print("Sending prompt to model...")
                response = send_prompt_to_model(config, prompt)
                
                if response:
                    print("\n--- Model Response ---")
                    if isinstance(response, list):
                        # Handle list response format from Hugging Face
                        for item in response:
                            if isinstance(item, dict) and "generated_text" in item:
                                print(item["generated_text"])
                            else:
                                print(item)
                    else:
                        # Handle direct text response
                        print(response)
                    print("----------------------")
                else:
                    print("Failed to get a response from the model.")
            
            elif choice == "3":
                print("Exiting.")
                break
            
            else:
                print("Invalid option. Please try again.")
        except EOFError:
            print("\nInput terminated. Exiting.")
            break
        except KeyboardInterrupt:
            print("\nOperation cancelled by user. Exiting.")
            break

if __name__ == "__main__":
    main()
