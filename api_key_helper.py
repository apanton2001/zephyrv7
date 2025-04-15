#!/usr/bin/env python3
"""
Helper module for retrieving API keys from environment variables.
This can be used with the Uncensored-HackerCoding-GPT configuration.
"""

import os
from typing import Optional

def get_api_key(key_name: str, default_value: Optional[str] = None) -> Optional[str]:
    """
    Retrieve an API key from environment variables.
    
    Args:
        key_name: The name of the environment variable containing the API key
        default_value: A default value to return if the key is not found
        
    Returns:
        The API key string if found, otherwise the default_value
        
    Example:
        # Get Hugging Face API key
        hf_api_key = get_api_key('HUGGINGFACE_API_KEY')
        
        # With a default value
        hf_api_key = get_api_key('HUGGINGFACE_API_KEY', 'default-key')
    """
    return os.environ.get(key_name, default_value)

def update_config_with_env_key(config_path: str, key_env_var: str, key_default: str = None) -> bool:
    """
    Update a configuration file with an API key from environment variables.
    
    Args:
        config_path: Path to the configuration JSON file
        key_env_var: Name of the environment variable containing the API key
        key_default: Default key to use if environment variable is not set
        
    Returns:
        True if successful, False otherwise
        
    Example:
        # Update Cline config with Hugging Face key
        update_config_with_env_key(
            'cline_hacker_gpt_config.json', 
            'HUGGINGFACE_API_KEY', 
            'your-default-key'
        )
    """
    import json
    
    # Get the API key from environment or use default
    api_key = get_api_key(key_env_var, key_default)
    if not api_key:
        print(f"No API key found in environment variable {key_env_var} and no default provided")
        return False
    
    try:
        # Read the configuration file
        with open(config_path, 'r') as f:
            config = json.load(f)
        
        # Update the API key
        if "api_config" in config:
            config["api_config"]["api_key"] = api_key
            if "headers" in config["api_config"] and "Authorization" in config["api_config"]["headers"]:
                config["api_config"]["headers"]["Authorization"] = f"Bearer {api_key}"
        
        # Write the updated configuration
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
        
        print(f"Successfully updated {config_path} with API key from {key_env_var}")
        return True
    
    except Exception as e:
        print(f"Error updating configuration: {e}")
        return False

if __name__ == "__main__":
    # Example usage
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python api_key_helper.py CONFIG_FILE [ENV_VAR_NAME] [DEFAULT_KEY]")
        sys.exit(1)
    
    config_file = sys.argv[1]
    env_var = sys.argv[2] if len(sys.argv) > 2 else "HUGGINGFACE_API_KEY"
    default = sys.argv[3] if len(sys.argv) > 3 else None
    
    success = update_config_with_env_key(config_file, env_var, default)
    sys.exit(0 if success else 1)
