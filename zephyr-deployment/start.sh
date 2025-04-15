#!/bin/bash

# Zephyr Deployment Startup Script
# This script sets up and runs the Zephyr API server

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}          Zephyr LLM Deployment Setup            ${NC}"
echo -e "${BLUE}==================================================${NC}"

# Check for Python
echo -e "\n${YELLOW}Checking for Python...${NC}"
if command -v python3 &>/dev/null; then
    python_cmd="python3"
    echo -e "${GREEN}Python 3 is installed!${NC}"
elif command -v python &>/dev/null; then
    python_cmd="python"
    echo -e "${GREEN}Python is installed!${NC}"
else
    echo -e "${RED}Python is not installed. Please install Python 3.8 or higher and try again.${NC}"
    exit 1
fi

# Check Python version
python_version=$($python_cmd -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo -e "${YELLOW}Python version: ${python_version}${NC}"

# Function to compare version numbers
version_lt() {
    [ "$1" = "$(echo -e "$1\n$2" | sort -V | head -n1)" ] && [ "$1" != "$2" ]
}

if version_lt "$python_version" "3.8"; then
    echo -e "${RED}Python 3.8 or higher is required. Please upgrade your Python version.${NC}"
    exit 1
fi

# Check for pip and install requirements
echo -e "\n${YELLOW}Installing required packages...${NC}"
$python_cmd -m pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install required packages. Please check your internet connection and try again.${NC}"
    exit 1
fi
echo -e "${GREEN}Packages installed successfully!${NC}"

# Check for CUDA
echo -e "\n${YELLOW}Checking for CUDA...${NC}"
if command -v nvidia-smi &>/dev/null; then
    echo -e "${GREEN}CUDA is available!${NC}"
    nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader
    use_cuda="yes"
else
    echo -e "${YELLOW}CUDA not detected. Will run in CPU mode (much slower).${NC}"
    echo -e "${YELLOW}For better performance, consider running on a machine with a CUDA-compatible GPU.${NC}"
    use_cuda="no"
fi

# Download model if needed
echo -e "\n${YELLOW}Checking for model files...${NC}"
model_dir=$(echo ~/.cache/huggingface/hub/models--HuggingFaceH4--zephyr-7b-beta)
if [ -d "$model_dir" ]; then
    echo -e "${GREEN}Model files found locally!${NC}"
else
    echo -e "${YELLOW}Model files not found. Downloading model...${NC}"
    $python_cmd download_model.py
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to download model. Please check your internet connection and try again.${NC}"
        exit 1
    fi
fi

# Create static directory if it doesn't exist
if [ ! -d "static" ]; then
    echo -e "\n${YELLOW}Creating static directory...${NC}"
    mkdir -p static
fi

# Start the server
echo -e "\n${BLUE}==================================================${NC}"
echo -e "${BLUE}          Starting Zephyr API Server             ${NC}"
echo -e "${BLUE}==================================================${NC}"
echo -e "\n${GREEN}The server will be available at: http://localhost:8000${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}\n"

exec $python_cmd main.py
