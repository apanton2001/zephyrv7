# Installation Guide

This guide provides step-by-step instructions for setting up the Local LLM Hub on your system.

## Prerequisites

### Hardware Requirements
- **CPU**: Modern multi-core processor (8+ cores recommended)
- **RAM**: Minimum 16GB (32GB+ recommended for running larger models)
- **GPU**: NVIDIA GPU with 8GB+ VRAM strongly recommended
  - For AMD users: ROCm compatible GPU
- **Storage**: 100GB+ free disk space (SSD recommended)

### Software Requirements
- **Python**: Version 3.8 or higher
- **Git**: For cloning repositories
- **CUDA**: Version 11.7+ for NVIDIA GPUs (or ROCm for AMD GPUs)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/local-llm-hub.git
cd local-llm-hub
```

### 2. Create a Virtual Environment

#### Windows
```bash
python -m venv venv
venv\Scripts\activate
```

#### macOS/Linux
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Install Additional GPU Support (Optional but Recommended)

#### For NVIDIA GPUs:
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

#### For AMD GPUs:
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/rocm5.4.2
```

## Installing LLMs

### Automated Installation

The easiest way to install models is using our automated script:

```bash
python install_models.py
```

This will present you with a menu to select which models you want to install.

### Manual Installation

If you prefer to install models manually or the automated script encounters issues:

#### 1. Llama 3.1

```bash
python -m llm_manager install llama3.1 --variant 8B
```

#### 2. Mistral

```bash
python -m llm_manager install mistral --variant 7B
```

#### 3. Vicuna

```bash
python -m llm_manager install vicuna --variant 7B
```

And so on for the other models...

## Configuration

After installing models, you can configure their settings in the `config.yaml` file:

```yaml
models:
  llama3.1-8b:
    path: ./models/llama-3.1-8b
    type: llama
    parameters:
      temperature: 0.7
      top_p: 0.9
  mistral-7b:
    path: ./models/mistral-7b
    type: mistral
    parameters:
      temperature: 0.8
      top_p: 0.9
```

## Troubleshooting

### Common Issues

#### Out of Memory Errors
- Try using a smaller model variant
- Reduce the context length in config.yaml
- Close other memory-intensive applications

#### CUDA/GPU Issues
- Ensure you have the latest GPU drivers
- Check CUDA compatibility with your GPU
- Try running in CPU-only mode with `--cpu-only` flag

#### Slow Performance
- Enable 4-bit or 8-bit quantization
- Reduce model parameters in config.yaml
- Consider using a smaller model

### Getting Help

If you encounter issues not covered here, please:
1. Check the GitHub issues section
2. Join our Discord community
3. Create a new issue with details about your system and the problem
