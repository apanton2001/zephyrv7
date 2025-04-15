# Installation Guide

This guide will walk you through setting up the Business LLM Assistant on your system.

## System Requirements

- **Operating System**: Windows 10/11, macOS, or Linux
- **Python**: 3.10 or higher
- **RAM**: Minimum 8GB, recommended 16GB+
- **Storage**: At least 20GB free space for models and data
- **GPU**: Optional but recommended for better performance
  - NVIDIA GPU with CUDA support (4GB+ VRAM)
  - For CPU-only: Expect slower performance

## Installation Steps

### 1. Create a Python Environment

#### Windows

```powershell
# Install Python 3.10+ if not already installed
# Create a virtual environment
python -m venv business_llm_env
# Activate the environment
business_llm_env\Scripts\activate
```

#### macOS/Linux

```bash
# Install Python 3.10+ if not already installed
# Create a virtual environment
python -m venv business_llm_env
# Activate the environment
source business_llm_env/bin/activate
```

### 2. Install Core Dependencies

```bash
# Install base requirements
pip install -r requirements.txt
```

### 3. Download Quantized Models

The system uses several optimized LLM models. You can download them automatically using the setup script:

```bash
python setup.py --download-models
```

Or download them manually:

#### Central Coordinator Model
```bash
python -m utils.model_downloader --model="OpenHermes-2.5-Mistral-7B-GGUF" --quantization="Q4_K_M" --output="data/models"
```

#### Outreach Agent Model
```bash
python -m utils.model_downloader --model="Nous-Hermes-2-SOLAR-10.7B" --quantization="Q4_K_M" --output="data/models"
```

#### Finance Agent Model
```bash
python -m utils.model_downloader --model="Dolphin-2.5-Mistral-7B" --quantization="Q4_K_M" --output="data/models"
```

#### Data Analyzer Model
```bash
python -m utils.model_downloader --model="DeepCoder-14B-Preview" --quantization="Q4_K_M" --output="data/models"
```

### 4. Install Optional Voice Components

For voice interface support:

```bash
# Text-to-speech and speech recognition
pip install pyttsx3 SpeechRecognition pyaudio
# Install OpenAI Whisper (tiny model)
pip install git+https://github.com/openai/whisper.git
```

### 5. Configure the System

1. Create a configuration file:

```bash
python -m utils.config_generator
```

2. Edit the generated `config.yaml` file to set up:
   - Model paths
   - Database connection
   - Voice settings
   - Integration preferences

### 6. Initialize Database

```bash
python -m utils.db_setup
```

## Running the System

### Basic Run

```bash
python main.py
```

### Running with Voice Interface

```bash
python main.py --voice
```

### Running as Background Service

```bash
python main.py --daemon
```

## Troubleshooting

### Common Issues

#### "Out of Memory" Errors
- Try using more aggressive quantization (Q3_K_S or Q2_K)
- Reduce context length in config.yaml
- Try CPU-only mode with `--cpu-only` flag

#### Voice Recognition Problems
- Ensure microphone is properly connected
- Check if correct audio input device is selected
- Try running voice calibration: `python -m utils.voice_calibrate`

#### Slow Performance
- Enable memory optimization: `--optimize-memory`
- Reduce number of simultaneously loaded models
- Disable unused agents in config.yaml

## Performance Tips

- For machines with limited RAM, set `low_memory_mode: true` in config.yaml
- Enable disk offloading with `--disk-offload` for large models
- Use the batch processing mode for analyzing multiple documents

## Uninstallation

To completely remove the system:

```bash
# Remove models and data
python setup.py --clean

# Remove virtual environment
# Windows
rmdir /s /q business_llm_env
# macOS/Linux
rm -rf business_llm_env
