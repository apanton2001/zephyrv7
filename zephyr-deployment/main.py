import os
import torch
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, FileResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TextIteratorStreamer,
    BitsAndBytesConfig
)
import uvicorn
from threading import Thread

# Configuration
MODEL_ID = "HuggingFaceH4/zephyr-7b-beta" # Default model, can be changed to other Zephyr variants
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
MAX_LENGTH = 2048
DEFAULT_MAX_NEW_TOKENS = 512
DEFAULT_TEMPERATURE = 0.7
DEFAULT_TOP_P = 0.9
DEFAULT_TOP_K = 50
QUANTIZATION = True  # Set to False to use full precision (requires more VRAM)

app = FastAPI(title="Zephyr API", description="API for the Zephyr language model")

# Mount static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request models
class GenerationRequest(BaseModel):
    prompt: str
    max_new_tokens: Optional[int] = Field(DEFAULT_MAX_NEW_TOKENS, ge=1, le=4096)
    temperature: Optional[float] = Field(DEFAULT_TEMPERATURE, ge=0.0, le=2.0)
    top_p: Optional[float] = Field(DEFAULT_TOP_P, ge=0.0, le=1.0)
    top_k: Optional[int] = Field(DEFAULT_TOP_K, ge=0)
    stream: Optional[bool] = False
    system_prompt: Optional[str] = "You are a helpful assistant."

class HealthResponse(BaseModel):
    status: str
    model: str
    device: str
    quantized: bool

# Global variables to hold loaded model and tokenizer
model = None
tokenizer = None

def load_model():
    """Load the model and tokenizer"""
    global model, tokenizer
    
    print(f"Loading model {MODEL_ID}...")
    print(f"Using device: {DEVICE}")
    
    # Prepare quantization config if needed
    if QUANTIZATION and DEVICE == "cuda":
        print("Using 4-bit quantization...")
        quantization_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_use_double_quant=True,
        )
    else:
        quantization_config = None
    
    # Load tokenizer
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
    
    # Load model with appropriate configuration
    if DEVICE == "cuda":
        # GPU configuration with quantization
        model = AutoModelForCausalLM.from_pretrained(
            MODEL_ID,
            torch_dtype=torch.float16,
            device_map="auto",
            quantization_config=quantization_config,
            low_cpu_mem_usage=True,
        )
    else:
        # CPU configuration with memory optimization
        model = AutoModelForCausalLM.from_pretrained(
            MODEL_ID,
            torch_dtype=torch.float32,
            device_map=None,
            low_cpu_mem_usage=True,
            offload_folder="offload",  # Temporary directory for memory offloading
            offload_state_dict=True,  # Offload state dict to disk when possible
        ).to(DEVICE)
        
        # Clear CUDA cache if it was used before
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    
    print("Model loaded successfully!")

@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    load_model()

@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve the web UI"""
    return FileResponse("static/index.html")

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Check if the service is healthy and model is loaded"""
    if model is None or tokenizer is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    return {
        "status": "healthy",
        "model": MODEL_ID,
        "device": DEVICE,
        "quantized": QUANTIZATION
    }

def format_chat_prompt(messages):
    """Format the chat messages into a prompt for Zephyr"""
    # Zephyr uses specific format for system, user, and assistant messages
    formatted_prompt = ""
    
    if isinstance(messages, str):
        # If just a string is provided, treat as a single user message
        return f"<|user|>\n{messages}\n<|assistant|>\n"
    
    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        
        if role == "system":
            formatted_prompt += f"<|system|>\n{content}\n"
        elif role == "user":
            formatted_prompt += f"<|user|>\n{content}\n"
        elif role == "assistant":
            formatted_prompt += f"<|assistant|>\n{content}\n"
    
    # Add the final assistant marker for the response
    if not formatted_prompt.endswith("<|assistant|>\n"):
        formatted_prompt += "<|assistant|>\n"
    
    return formatted_prompt

@app.post("/generate")
async def generate_text(request: GenerationRequest):
    """Generate text based on the provided prompt"""
    if model is None or tokenizer is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    # Format the prompt with system instruction
    messages = [
        {"role": "system", "content": request.system_prompt},
        {"role": "user", "content": request.prompt}
    ]
    prompt = format_chat_prompt(messages)
    
    # Prepare generation config
    generation_config = {
        "max_new_tokens": request.max_new_tokens,
        "temperature": request.temperature,
        "top_p": request.top_p,
        "top_k": request.top_k,
        "pad_token_id": tokenizer.eos_token_id,
        "do_sample": request.temperature > 0.0,
    }
    
    try:
        # Tokenize input
        inputs = tokenizer(prompt, return_tensors="pt").to(DEVICE)
        
        # Generate response
        with torch.no_grad():
            output = model.generate(
                **inputs,
                **generation_config
            )
        
        # Decode and format response
        generated_text = tokenizer.decode(output[0], skip_special_tokens=True)
        
        # Extract only the assistant's response
        assistant_response = generated_text.split("<|assistant|>")[-1].strip()
        
        return {
            "generated_text": assistant_response,
            "model": MODEL_ID,
            "parameters": {
                "max_new_tokens": request.max_new_tokens,
                "temperature": request.temperature,
                "top_p": request.top_p,
                "top_k": request.top_k
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation error: {str(e)}")

if __name__ == "__main__":
    # Run with uvicorn if executed directly
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
