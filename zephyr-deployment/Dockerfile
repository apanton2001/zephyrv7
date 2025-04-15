FROM nvidia/cuda:12.1.1-cudnn8-runtime-ubuntu22.04

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    wget \
    git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN useradd -m -s /bin/bash app
USER app
WORKDIR /home/app

# Set up Python environment
ENV PATH="/home/app/.local/bin:${PATH}"
RUN python3 -m pip install --upgrade pip

# Copy requirements and install dependencies 
COPY --chown=app:app requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application
COPY --chown=app:app . .

# Expose the port
EXPOSE 8000

# Create model cache directory
RUN mkdir -p /home/app/.cache/huggingface

# Run the application
CMD ["python", "main.py"]
