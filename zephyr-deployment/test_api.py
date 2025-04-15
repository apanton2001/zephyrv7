import requests
import time
import sys

def test_health():
    """Test the health check endpoint"""
    try:
        response = requests.get("http://localhost:8000/health")
        if response.status_code == 200:
            data = response.json()
            print("\n✓ Health check passed:")
            print(f"  • Status: {data['status']}")
            print(f"  • Model: {data['model']}")
            print(f"  • Device: {data['device']}")
            print(f"  • Quantized: {data['quantized']}")
            return True
        else:
            print(f"\n✗ Health check failed with status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"\n✗ Health check failed with error: {str(e)}")
        return False

def test_generation():
    """Test the text generation endpoint"""
    test_prompt = "What is machine learning? Explain it in one sentence."
    
    try:
        response = requests.post(
            "http://localhost:8000/generate",
            json={
                "prompt": test_prompt,
                "max_new_tokens": 100,
                "temperature": 0.7,
                "system_prompt": "You are a helpful AI teacher."
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            print("\n✓ Generation test passed:")
            print(f"  • Prompt: {test_prompt}")
            print(f"  • Response: {data['generated_text']}")
            return True
        else:
            print(f"\n✗ Generation test failed with status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"\n✗ Generation test failed with error: {str(e)}")
        return False

def wait_for_api(timeout=300, interval=10):
    """Wait for the API to become available"""
    print("Waiting for API to become available...")
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        try:
            requests.get("http://localhost:8000/health")
            return True
        except:
            sys.stdout.write(".")
            sys.stdout.flush()
            time.sleep(interval)
    
    return False

def main():
    print("Starting API tests...")
    
    if not wait_for_api():
        print("\n✗ API did not become available within timeout period")
        return False
    
    print("\nAPI is available, running tests...")
    
    health_result = test_health()
    if not health_result:
        return False
    
    generation_result = test_generation()
    if not generation_result:
        return False
    
    print("\n✓ All tests passed successfully!")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
