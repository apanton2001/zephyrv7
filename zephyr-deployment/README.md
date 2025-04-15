# Zephyr LLM Deployment

This repository provides a simple API server for deploying the Zephyr large language model (LLM) from Hugging Face. Zephyr is a fine-tuned version of Mistral 7B optimized for instruction following and assistant-like conversations.

## Features

- FastAPI server for Zephyr model inference
- 4-bit quantization support for efficient deployment on consumer GPUs
- Configurable generation parameters
- Simple Python client for interacting with the API
- Health check endpoint

## Prerequisites

- Python 3.8 or higher
- CUDA-compatible GPU with at least 8GB VRAM (for GPU acceleration)
- At least 16GB of system RAM

## Installation

1. Clone this repository:
```bash
git clone <your-repo-url>
cd zephyr-deployment
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. (Optional) Adjust configuration in `main.py` if needed:
```python
# Change model variant
MODEL_ID = "HuggingFaceH4/zephyr-7b-beta"  # You can try other versions like zephyr-7b-alpha

# Disable quantization if you have enough VRAM
QUANTIZATION = True  # Set to False for full precision (requires more VRAM)
```

## Usage

### Starting the Server

#### Using the Startup Scripts (Recommended)

The easiest way to start the server is using the provided startup scripts:

**Linux/macOS:**
```bash
# Make the script executable
chmod +x start.sh
# Run the script
./start.sh
```

**Windows:**
```cmd
start.bat
```

These scripts will:
1. Check for Python and CUDA availability
2. Install required packages
3. Download the Zephyr model (if not already cached)
4. Start the API server on http://localhost:8000

#### Manual Start

Alternatively, you can start the server manually:

```bash
# Install requirements
pip install -r requirements.txt

# Optional: Pre-download the model
python download_model.py

# Start the server
python main.py
```

Once started, you can:
- Access the web UI at http://localhost:8000
- Access the API documentation at http://localhost:8000/docs

### Web Interface

A simple web interface is available at http://localhost:8000 which provides a user-friendly way to interact with the model. The interface allows you to:

- Customize system prompt
- Adjust generation parameters like temperature and max tokens
- Submit prompts and view generated responses
- Monitor API health status

### Testing and Verification

#### Automated Tests
The project includes automated test scripts to verify the API functionality:

**Windows:**
```cmd
run_tests.bat
```

**Linux/macOS:**
```bash
chmod +x run_tests.sh
./run_tests.sh
```

The test suite verifies:
- API health and availability
- Model loading status
- Text generation capabilities
- Parameter handling

#### Command-Line Client
For manual testing and interaction, use the included `client.py`:

```bash
# Check if the API is healthy
python client.py --health

# Generate text with default settings
python client.py "What is the capital of France?"

# Generate text with custom parameters
python client.py --temperature 0.8 --max-tokens 1024 --system "You are a helpful geography teacher." "Tell me about the major rivers in Asia."
```

#### Web Interface Testing
You can also test the API through the web interface at http://localhost:8000, which provides:
- Real-time health status monitoring
- Interactive parameter adjustment
- Visual feedback for generation results

### API Endpoints

#### `/generate` (POST)

Generates text based on a prompt.

Request body:
```json
{
  "prompt": "What is artificial intelligence?",
  "max_new_tokens": 512,
  "temperature": 0.7,
  "top_p": 0.9,
  "top_k": 50,
  "stream": false,
  "system_prompt": "You are a helpful assistant."
}
```

Response:
```json
{
  "generated_text": "Artificial intelligence (AI) refers to...",
  "model": "HuggingFaceH4/zephyr-7b-beta",
  "parameters": {
    "max_new_tokens": 512,
    "temperature": 0.7,
    "top_p": 0.9,
    "top_k": 50
  }
}
```

#### `/health` (GET)

Checks if the API is healthy and the model is loaded.

Response:
```json
{
  "status": "healthy",
  "model": "HuggingFaceH4/zephyr-7b-beta",
  "device": "cuda",
  "quantized": true
}
```

## Performance Considerations

### GPU Mode (Recommended)
- **Requirements**: CUDA-compatible GPU with at least 8GB VRAM
- **Memory Usage**: With 4-bit quantization, Zephyr 7B requires approximately 6-8GB of VRAM
- **Speed**: Expect around 10-30 tokens per second on a consumer GPU
- **First Request**: Initial request may take longer as the model optimizes for inference
- **Benefits**: 
  * 4-bit quantization for efficient memory usage
  * Parallel processing for faster generation
  * Suitable for production use

### CPU Mode
- **Requirements**: At least 32GB of system RAM recommended
- **Memory Usage**: Uses system RAM instead of VRAM
- **Speed**: Significantly slower, around 1-2 tokens per second
- **Limitations**:
  * No quantization support in CPU mode
  * Sequential processing only
  * Not recommended for production use
  * Best suited for testing and development

### General Considerations
- First-time startup requires downloading the model (~4GB)
- Model files are cached locally for subsequent runs
- Generation parameters (temperature, max tokens) affect speed and quality
- Consider using streaming responses for better user experience with longer generations

## Production Deployment

### Docker Deployment

The project includes Docker support for easy deployment:

```bash
# Build and start with docker-compose
docker-compose up --build

# Or using Docker directly
docker build -t zephyr-api .
docker run -p 8000:8000 --gpus all zephyr-api
```

### Additional Production Considerations

For production deployment, consider:

1. Using a reverse proxy like Nginx
2. Implementing proper authentication
3. Setting up monitoring and logging
4. Running with a process manager like Supervisor or as a systemd service
5. Deploying on a machine with adequate GPU resources (at least 8GB VRAM recommended)
6. Setting up proper firewall rules if exposing the API publicly

## License

This project is provided for educational purposes. The Zephyr model itself is subject to the license terms specified by Hugging Face for the HuggingFaceH4/zephyr-7b-beta model.
