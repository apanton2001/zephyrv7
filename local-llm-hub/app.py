#!/usr/bin/env python3
"""
Local LLM Hub - Main Application
This script starts the web interface for interacting with local LLM models.
"""

import os
import sys
import time
import json
import yaml
import logging
import argparse
from typing import Dict, List, Optional, Union, Any
from pathlib import Path

# Flask components for web interface
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from waitress import serve

# Rich for CLI output
from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn

# Model handling imports
try:
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False
    print("Warning: PyTorch/Transformers not installed. Limited functionality available.")

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger('local_llm_hub')

# Setup rich console
console = Console()

# Initialize Flask app
app = Flask(__name__, 
            static_folder='static',
            template_folder='templates')
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Global variables
loaded_models = {}
config = {}
model_lock = False  # Simple lock to prevent concurrent model loading

class MockModel:
    """Mock model for demonstration when real models aren't available."""
    
    def __init__(self, model_id, model_config):
        self.model_id = model_id
        self.config = model_config
        self.name = model_config.get('name', model_id)
        self.parameters = model_config.get('parameters', {})
    
    def generate(self, prompt, max_length=100, temperature=0.7, top_p=0.9):
        """Mock generation function."""
        time.sleep(1)  # Simulate thinking time
        
        # Simple responses based on model ID
        if "llama" in self.model_id:
            return f"[Llama 3.1 response]: I'm a helpful assistant trained by Meta AI. Here's my response to '{prompt}'..."
        elif "mistral" in self.model_id:
            return f"[Mistral response]: I'm an efficient assistant. Regarding '{prompt}', I think..."
        elif "vicuna" in self.model_id:
            return f"[Vicuna response]: As a conversational assistant, I'd like to discuss '{prompt}' with you..."
        else:
            return f"[{self.name} response]: This is a simulated response to '{prompt}'. In a real implementation, the actual model would generate content here."

def load_config() -> Dict:
    """Load configuration from config.yaml."""
    config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.yaml")
    
    default_config = {
        "models": {},
        "interface": {
            "theme": "dark",
            "port": 8000,
            "host": "127.0.0.1"
        }
    }
    
    if not os.path.exists(config_path):
        console.print("[yellow]Warning: config.yaml not found. Using default configuration.[/yellow]")
        # Create default config
        with open(config_path, "w") as f:
            yaml.dump(default_config, f, default_flow_style=False)
        return default_config
    
    try:
        with open(config_path, "r") as f:
            loaded_config = yaml.safe_load(f)
            return loaded_config or default_config
    except Exception as e:
        console.print(f"[red]Error loading config: {str(e)}. Using default configuration.[/red]")
        return default_config

def load_model(model_id: str) -> Optional[Any]:
    """Load a model based on its ID."""
    global loaded_models, config, model_lock
    
    if model_lock:
        console.print("[yellow]Another model is currently being loaded. Please wait.[/yellow]")
        return None
    
    if model_id in loaded_models:
        console.print(f"[green]Model {model_id} already loaded[/green]")
        return loaded_models[model_id]
    
    if model_id not in config.get('models', {}):
        console.print(f"[red]Model {model_id} not found in configuration[/red]")
        return None
    
    model_config = config['models'][model_id]
    model_path = model_config.get('path', '')
    model_type = model_config.get('type', '')
    
    # Check if path exists
    if not os.path.exists(model_path):
        # Try relative path
        relative_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), model_path)
        if not os.path.exists(relative_path):
            console.print(f"[red]Model path not found: {model_path}[/red]")
            return None
        model_path = relative_path
    
    model_lock = True
    try:
        console.print(f"[bold]Loading model {model_id}...[/bold]")
        
        # In a real implementation, this would use transformers or llama.cpp to load the model
        # For this demo, we'll create a mock model
        if HAS_TORCH and False:  # Set to True once implementation is complete
            # This would be the real implementation
            pass
        else:
            # Use mock implementation for now
            model = MockModel(model_id, model_config)
            loaded_models[model_id] = model
            console.print(f"[green]Loaded model {model_id} (simulation)[/green]")
        
        return loaded_models[model_id]
    except Exception as e:
        console.print(f"[red]Error loading model {model_id}: {str(e)}[/red]")
        return None
    finally:
        model_lock = False

def get_available_models() -> List[Dict]:
    """Get list of available models from config."""
    models_list = []
    
    for model_id, model_config in config.get('models', {}).items():
        # Check if model files exist
        model_path = model_config.get('path', '')
        path_exists = os.path.exists(model_path)
        
        # If path doesn't exist, try relative path
        if not path_exists:
            relative_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), model_path)
            path_exists = os.path.exists(relative_path)
        
        models_list.append({
            'id': model_id,
            'name': model_config.get('name', model_id),
            'type': model_config.get('type', 'unknown'),
            'loaded': model_id in loaded_models,
            'available': path_exists
        })
    
    return models_list

def check_models_directory():
    """Check if models directory exists and contains models."""
    models_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
    
    if not os.path.exists(models_dir):
        console.print("[yellow]Models directory not found. Creating it now.[/yellow]")
        os.makedirs(models_dir, exist_ok=True)
        return False
    
    # Check if directory contains any models
    subdirs = [f for f in os.listdir(models_dir) if os.path.isdir(os.path.join(models_dir, f))]
    if not subdirs:
        console.print("[yellow]No models found in models directory.[/yellow]")
        return False
    
    return True

def generate_response(model_id: str, prompt: str, parameters: Optional[Dict] = None) -> Dict:
    """Generate a response from a model."""
    if model_id not in loaded_models:
        model = load_model(model_id)
        if not model:
            return {
                'success': False,
                'error': f'Model {model_id} could not be loaded',
                'response': None
            }
    else:
        model = loaded_models[model_id]
    
    # Set default parameters
    params = {
        'temperature': 0.7,
        'top_p': 0.9,
        'max_length': 100,
    }
    
    # Update with model-specific parameters from config
    if model_id in config.get('models', {}):
        model_params = config['models'][model_id].get('parameters', {})
        params.update(model_params)
    
    # Update with request parameters
    if parameters:
        params.update(parameters)
    
    try:
        # Generate response
        start_time = time.time()
        response = model.generate(prompt, **params)
        end_time = time.time()
        
        return {
            'success': True,
            'model_id': model_id,
            'response': response,
            'parameters': params,
            'generation_time': end_time - start_time
        }
    except Exception as e:
        logger.error(f"Error generating response from model {model_id}: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'response': None
        }

def setup_static_files():
    """Setup static files for the web interface."""
    static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
    templates_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "templates")
    
    # Create directories if they don't exist
    os.makedirs(static_dir, exist_ok=True)
    os.makedirs(templates_dir, exist_ok=True)
    os.makedirs(os.path.join(static_dir, "css"), exist_ok=True)
    os.makedirs(os.path.join(static_dir, "js"), exist_ok=True)
    
    # Create basic CSS
    css_file = os.path.join(static_dir, "css", "style.css")
    if not os.path.exists(css_file):
        with open(css_file, "w") as f:
            f.write("""
:root {
    --primary-color: #2563eb;
    --secondary-color: #4b5563;
    --background-color: #1f2937;
    --text-color: #f3f4f6;
    --input-bg: #374151;
    --border-color: #4b5563;
    --hover-color: #3b82f6;
}

body.light-theme {
    --primary-color: #2563eb;
    --secondary-color: #6b7280;
    --background-color: #f9fafb;
    --text-color: #1f2937;
    --input-bg: #ffffff;
    --border-color: #d1d5db;
    --hover-color: #3b82f6;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background-color: var(--background-color);
    color: var(--text-color);
    margin: 0;
    padding: 0;
    line-height: 1.6;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
}

header {
    background-color: var(--primary-color);
    padding: 1rem 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

header .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.logo {
    font-size: 1.5rem;
    font-weight: bold;
    color: white;
}

nav ul {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
}

nav ul li {
    margin-left: 1.5rem;
}

nav ul li a {
    color: white;
    text-decoration: none;
    transition: opacity 0.2s;
}

nav ul li a:hover {
    opacity: 0.8;
}

.main-content {
    padding: 2rem 0;
}

.section {
    margin-bottom: 2rem;
}

.card {
    background-color: var(--input-bg);
    border-radius: 0.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    margin-bottom: 1.5rem;
}

h1, h2, h3 {
    margin-top: 0;
}

.btn {
    background-color: var(--primary-color);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.2s;
}

.btn:hover {
    background-color: var(--hover-color);
}

.btn:disabled {
    background-color: var(--secondary-color);
    cursor: not-allowed;
}

.input-group {
    margin-bottom: 1rem;
}

label {
    display: block;
    margin-bottom: 0.5rem;
}

input, select, textarea {
    width: 100%;
    padding: 0.5rem;
    font-size: 1rem;
    border: 1px solid var(--border-color);
    border-radius: 0.25rem;
    background-color: var(--input-bg);
    color: var(--text-color);
}

textarea {
    min-height: 100px;
    resize: vertical;
}

.model-selector {
    margin-bottom: 1.5rem;
}

.chat-container {
    display: flex;
    flex-direction: column;
    height: 60vh;
    max-height: 600px;
}

.messages {
    flex-grow: 1;
    overflow-y: auto;
    padding: 1rem;
    background-color: var(--input-bg);
    border-radius: 0.5rem 0.5rem 0 0;
    border: 1px solid var(--border-color);
}

.message {
    margin-bottom: 1rem;
    padding: 0.75rem;
    border-radius: 0.5rem;
    max-width: 80%;
}

.user-message {
    background-color: var(--primary-color);
    color: white;
    align-self: flex-end;
    margin-left: auto;
}

.bot-message {
    background-color: var(--secondary-color);
    color: white;
    align-self: flex-start;
}

.message-input {
    display: flex;
    border: 1px solid var(--border-color);
    border-top: none;
    border-radius: 0 0 0.5rem 0.5rem;
    overflow: hidden;
}

.message-input textarea {
    flex-grow: 1;
    border: none;
    border-radius: 0;
    padding: 0.75rem;
    min-height: 50px;
}

.message-input button {
    background-color: var(--primary-color);
    color: white;
    border: none;
    padding: 0 1.5rem;
    cursor: pointer;
    transition: background-color 0.2s;
}

.message-input button:hover {
    background-color: var(--hover-color);
}

.parameter-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1rem;
}

.parameter-control {
    flex: 1;
    min-width: 150px;
}

.parameter-control label {
    display: block;
    margin-bottom: 0.25rem;
}

.comparison-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 1.5rem;
}

.theme-toggle {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    font-size: 1.5rem;
}

.model-card {
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;
    background-color: var(--input-bg);
    transition: transform 0.2s, box-shadow 0.2s;
}

.model-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.model-card.selected {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px var(--primary-color);
}

.models-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
}

footer {
    background-color: var(--secondary-color);
    color: white;
    padding: 1rem 0;
    text-align: center;
    margin-top: 2rem;
}

.loading {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255,255,255,.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* Responsive styles */
@media (max-width: 768px) {
    .comparison-container {
        grid-template-columns: 1fr;
    }
    
    .models-grid {
        grid-template-columns: 1fr;
    }
    
    nav ul {
        flex-direction: column;
    }
    
    nav ul li {
        margin-left: 0;
        margin-bottom: 0.5rem;
    }
}
            """)
    
    # Create basic JavaScript
    js_file = os.path.join(static_dir, "js", "main.js")
    if not os.path.exists(js_file):
        with open(js_file, "w") as f:
            f.write("""
document.addEventListener('DOMContentLoaded', function() {
    // Theme toggling
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('light-theme');
            const isDark = !document.body.classList.contains('light-theme');
            themeToggle.innerHTML = isDark ? '☀️' : '🌙';
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
        
        // Load saved theme
        const savedTheme = localStorage.getItem('theme') || 'dark';
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
            themeToggle.innerHTML = '🌙';
        }
    }
    
    // Model selection
    const modelSelect = document.getElementById('model-select');
    if (modelSelect) {
        modelSelect.addEventListener('change', function() {
            loadModel(this.value);
        });
    }
    
    // Chat form submission
    const chatForm = document.getElementById('chat-form');
    const messagesContainer = document.getElementById('messages');
    const promptInput = document.getElementById('prompt-input');
    
    if (chatForm && messagesContainer && promptInput) {
        chatForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const prompt = promptInput.value.trim();
            if (!prompt) return;
            
            // Add user message
            addMessage('user', prompt);
            promptInput.value = '';
            
            // Get selected model
            const modelId = modelSelect.value;
            
            // Get parameters
            const temperature = document.getElementById('temperature').value;
            const topP = document.getElementById('top-p').value;
            const maxLength = document.getElementById('max-length').value;
            
            // Show loading indicator
            const loadingMsg = addMessage('system', 'Generating response...');
            
            // Send request to API
            fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model_id: modelId,
                    prompt: prompt,
                    parameters: {
                        temperature: parseFloat(temperature),
                        top_p: parseFloat(topP),
                        max_length: parseInt(maxLength)
                    }
                })
            })
            .then(response => response.json())
            .then(data => {
                // Remove loading message
                loadingMsg.remove();
                
                if (data.success) {
                    // Add bot message
                    addMessage('bot', data.response);
                } else {
                    // Add error message
                    addMessage('error', 'Error: ' + data.error);
                }
            })
            .catch(error => {
                // Remove loading message
                loadingMsg.remove();
                
                // Add error message
                addMessage('error', 'Error: ' + error.message);
            });
        });
    }
    
    function addMessage(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        
        if (type === 'user') {
            messageDiv.classList.add('user-message');
            messageDiv.textContent = content;
        } else if (type === 'bot') {
            messageDiv.classList.add('bot-message');
            messageDiv.textContent = content;
        } else if (type === 'system' || type === 'error') {
            messageDiv.classList.add('system-message');
            messageDiv.textContent = content;
        }
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        return messageDiv;
    }
    
    function loadModel(modelId) {
        fetch(`/api/load_model/${modelId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log(`Model ${modelId} loaded successfully`);
                } else {
                    console.error(`Error loading model ${modelId}: ${data.error}`);
                }
            })
            .catch(error => {
                console.error(`Error loading model: ${error.message}`);
            });
    }
    
    // Comparison mode
    const comparisonForm = document.getElementById('comparison-form');
    const comparisonResults = document.getElementById('comparison-results');
    
    if (comparisonForm && comparisonResults) {
        comparisonForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const prompt = document.getElementById('comparison-prompt').value.trim();
            if (!prompt) return;
            
            // Get selected models
            const selectedModels = Array.from(document.querySelectorAll('.comparison-model-checkbox:checked'))
                .map(checkbox => checkbox.value);
            
            if (selectedModels.length === 0) {
                alert('Please select at least one model for comparison');
                return;
            }
            
            // Clear previous results
            comparisonResults.innerHTML = '';
            
            // Get parameters
            const temperature = document.getElementById('comparison-temperature').value;
            const topP = document.getElementById('comparison-top-p').value;
            const maxLength = document.getElementById('comparison-max-length').value;
            
            // Add loading indicators
            selectedModels.forEach(modelId => {
                const resultDiv = document.createElement('div');
                resultDiv.className = 'card';
                resultDiv.innerHTML = `
                    <h3>${modelId}</h3>
                    <p>Generating response...</p>
                    <div class="loading"></div>
                `;
                resultDiv.id = `result-${modelId}`;
                comparisonResults.appendChild(resultDiv);
            });
            
            // Send requests for each model
            selectedModels.forEach(modelId => {
                fetch('/api/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model_id: modelId,
                        prompt: prompt,
                        parameters: {
                            temperature: parseFloat(temperature),
                            top_p: parseFloat(topP),
                            max_length: parseInt(maxLength)
                        }
                    })
                })
                .then(response => response.json())
                .then(data => {
                    const resultDiv = document.getElementById(`result-${modelId}`);
                    
                    if (data.success) {
                        resultDiv.innerHTML = `
                            <h3>${modelId}</h3>
                            <p class="generation-time">Generated in ${data.generation_time.toFixed(2)}s</p>
                            <div class="response-text">
                                ${data.response.replace(/\\n/g, '<br>')}
                            </div>
                        `;
                    } else {
                        resultDiv.innerHTML = `
                            <h3>${modelId}</h3>
                            <p class="error">Error: ${data.error}</p>
                        `;
                    }
                })
                .catch(error => {
                    const resultDiv = document.getElementById(`result-${modelId}`);
                    resultDiv.innerHTML = `
                        <h3>${modelId}</h3>
                        <p class="error">Error: ${error.message}</p>
                    `;
                });
            });
        });
    }
});
            """)
    
    # Move existing templates to templates directory if created in main dir
    compare_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "compare.html")
    if os.path.exists(compare_file):
        template_compare = os.path.join(templates_dir, "compare.html")
        if not os.path.exists(template_compare):
            import shutil
            shutil.copy(compare_file, template_compare)
            console.print(f"[green]Moved compare.html to templates directory[/green]")
    
    # Create index.html template
    index_file = os.path.join(templates_dir, "index.html")
    if not os.path.exists(index_file):
        with open(index_file, "w") as f:
            f.write("""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Local LLM Hub</title>
    <link rel="stylesheet" href="/static/css/style.css">
</head>
<body>
    <header>
        <div class="container">
            <div class="logo">Local LLM Hub</div>
            <nav>
                <ul>
                    <li><a href="/">Chat</a></li>
                    <li><a href="/compare">Compare</a></li>
                    <li><a href="/models">Models</a></li>
                    <li><a href="/settings">Settings</a></li>
                </ul>
            </nav>
            <button id="theme-toggle" class="theme-toggle">☀️</button>
        </div>
    </header>

    <div class="container main-content">
        <div class="section">
            <h1>Chat with Local LLMs</h1>
            
            <div class="model-selector">
                <label for="model-select">Select Model:</label>
                <select id="model-select">
                    {% for model in models %}
                    <option value="{{ model.id }}" {% if model.id == selected_model %}selected{% endif %}>
                        {{ model.name }} {% if not model.available %}(Not installed){% endif %}
                    </option>
                    {% endfor %}
                </select>
                <button class="btn" id="load-model-btn" onclick="loadModel(document.getElementById('model-select').value)">Load Model</button>
            </div>
            
            <div class="parameter-controls">
                <div class="parameter-control">
                    <label for="temperature">Temperature:</label>
                    <input type="range" id="temperature" min="0" max="2" step="0.1" value="0.7">
                    <span id="temperature-value">0.7</span>
                </div>
                
                <div class="parameter-control">
                    <label for="top-p">Top P:</label>
                    <input type="range" id="top-p" min="0" max="1" step="0.05" value="0.9">
                    <span id="top-p-value">0.9</span>
                </div>
                
                <div class="parameter-control">
                    <label for="max-length">Max Length:</label>
                    <input type="range" id="max-length" min="10" max="2000" step="10" value="100">
                    <span id="max-length-value">100</span>
                </div>
            </div>
            
            <div class="chat-container">
                <div class="messages" id="messages"></div>
                
                <form id="chat-form" class="message-input">
                    <textarea id="prompt-input" placeholder="Type your message here..."></textarea>
                    <button type="submit">Send</button>
                </form>
            </div>
        </div>
    </div>

    <footer>
        <div class="container">
            Local LLM Hub © 2025 - Run your own AI locally
        </div>
    </footer>

    <script src="/static/js/main.js"></script>
    <script>
        // Update range input display values
        document.querySelectorAll('input[type="range"]').forEach(input => {
            const valueDisplay = document.getElementById(`${input.id}-value`);
            if (valueDisplay) {
                input.addEventListener('input', () => {
                    valueDisplay.textContent = input.value;
                });
            }
        });
    </script>
</body>
</html>
            """)

# Define Flask routes
@app.route('/')
def index():
    """Render the main chat interface."""
    models = get_available_models()
    selected_model = request.args.get('model', None)
    
    if not selected_model and models:
        selected_model = models[0]['id']
    
    return render_template('index.html', models=models, selected_model=selected_model)

@app.route('/compare')
def compare():
    """Render the model comparison interface."""
    models = get_available_models()
    selected_model = request.args.get('model', None)
    
    if not selected_model and models:
        selected_model = models[0]['id']
    
    return render_template('compare.html', models=models, selected_model=selected_model)

@app.route('/models')
def models():
    """Render the models management interface."""
    models = get_available_models()
    return render_template('models.html', models=models)

@app.route('/settings')
def settings():
    """Render the settings interface."""
    return render_template('settings.html', config=config)

# API routes
@app.route('/api/models', methods=['GET'])
def api_models():
    """Get list of available models."""
    return jsonify(get_available_models())

@app.route('/api/load_model/<model_id>', methods=['GET'])
def api_load_model(model_id):
    """Load a model."""
    model = load_model(model_id)
    if model:
        return jsonify({
            'success': True,
            'model_id': model_id
        })
    else:
        return jsonify({
            'success': False,
            'error': f'Failed to load model {model_id}'
        })

@app.route('/api/generate', methods=['POST'])
def api_generate():
    """Generate a response from a model."""
    data = request.json
    
    if not data:
        return jsonify({
            'success': False,
            'error': 'No data provided'
        })
    
    model_id = data.get('model_id')
    prompt = data.get('prompt')
    parameters = data.get('parameters')
    
    if not model_id:
        return jsonify({
            'success': False,
            'error': 'No model ID provided'
        })
    
    if not prompt:
        return jsonify({
            'success': False,
            'error': 'No prompt provided'
        })
    
    result = generate_response(model_id, prompt, parameters)
    return jsonify(result)

def main():
    """Run the main application."""
    parser = argparse.ArgumentParser(description='Local LLM Hub')
    parser.add_argument('--host', type=str, help='Host to bind to')
    parser.add_argument('--port', type=int, help='Port to bind to')
    parser.add_argument('--debug', action='store_true', help='Run in debug mode')
    args = parser.parse_args()
    
    # Load configuration
    global config
    config = load_config()
    
    # Setup static files
    setup_static_files()
    
    # Check models directory
    has_models = check_models_directory()
    if not has_models:
        console.print("[yellow]No models found. Run install_models.py to download and install models.[/yellow]")
    
    # Get host and port
    host = args.host or config.get('interface', {}).get('host', '127.0.0.1')
    port = args.port or config.get('interface', {}).get('port', 8000)
    debug = args.debug
    
    console.print(Panel.fit(
        f"[bold blue]Local LLM Hub[/bold blue]\n\n"
        f"Access the web interface at http://{host}:{port}\n"
        f"Press Ctrl+C to quit",
        title="Server Started",
        border_style="green"
    ))
    
    # Run the app
    if debug:
        app.run(host=host, port=port, debug=True)
    else:
        # Use waitress for production
        serve(app, host=host, port=port)

if __name__ == "__main__":
    main()
