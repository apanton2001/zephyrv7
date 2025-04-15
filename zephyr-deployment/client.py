import requests
import argparse
import json

# Default settings
DEFAULT_API_URL = "http://localhost:8000"
DEFAULT_TEMPERATURE = 0.7
DEFAULT_MAX_TOKENS = 512
DEFAULT_SYSTEM_PROMPT = "You are a helpful assistant."

def generate_text(prompt, api_url, temperature, max_tokens, system_prompt):
    """Send a request to the Zephyr API and get a response"""
    
    endpoint = f"{api_url}/generate"
    
    payload = {
        "prompt": prompt,
        "temperature": temperature,
        "max_new_tokens": max_tokens,
        "system_prompt": system_prompt
    }
    
    try:
        response = requests.post(endpoint, json=payload)
        response.raise_for_status()  # Raise an exception for HTTP errors
        
        result = response.json()
        return result["generated_text"]
    
    except requests.exceptions.RequestException as e:
        print(f"Error connecting to API: {str(e)}")
        return None

def check_api_health(api_url):
    """Check if the API is running and healthy"""
    
    try:
        response = requests.get(f"{api_url}/health")
        response.raise_for_status()
        
        health_info = response.json()
        print(f"API Status: {health_info['status']}")
        print(f"Model: {health_info['model']}")
        print(f"Device: {health_info['device']}")
        print(f"Quantized: {health_info['quantized']}")
        return True
    
    except requests.exceptions.RequestException:
        print("API is not available or not healthy")
        return False

def main():
    parser = argparse.ArgumentParser(description="Client for Zephyr LLM API")
    parser.add_argument("--url", default=DEFAULT_API_URL, help="API URL")
    parser.add_argument("--temperature", type=float, default=DEFAULT_TEMPERATURE, help="Temperature for generation")
    parser.add_argument("--max-tokens", type=int, default=DEFAULT_MAX_TOKENS, help="Maximum number of tokens to generate")
    parser.add_argument("--system", default=DEFAULT_SYSTEM_PROMPT, help="System prompt")
    parser.add_argument("--health", action="store_true", help="Check API health")
    parser.add_argument("prompt", nargs="?", default=None, help="Prompt to send (optional if checking health)")
    
    args = parser.parse_args()
    
    if args.health:
        check_api_health(args.url)
        if args.prompt is None:
            return
    
    if args.prompt is None:
        parser.print_help()
        return
    
    result = generate_text(
        args.prompt, 
        args.url, 
        args.temperature, 
        args.max_tokens, 
        args.system
    )
    
    if result:
        print("\n----- Generated Response -----")
        print(result)
        print("-----------------------------")

if __name__ == "__main__":
    main()
