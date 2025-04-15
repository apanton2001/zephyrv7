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
                    showNotification(`Model ${modelId} loaded successfully`, 'success');
                } else {
                    console.error(`Error loading model ${modelId}: ${data.error}`);
                    showNotification(`Error loading model: ${data.error}`, 'error');
                }
            })
            .catch(error => {
                console.error(`Error loading model: ${error.message}`);
                showNotification(`Error loading model: ${error.message}`, 'error');
            });
    }
    
    // Show a notification
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
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
                                ${data.response.replace(/\n/g, '<br>')}
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
    
    // Models management
    const loadModelButtons = document.querySelectorAll('[data-action="load-model"]');
    if (loadModelButtons) {
        loadModelButtons.forEach(button => {
            button.addEventListener('click', function() {
                const modelId = this.dataset.modelId;
                loadModel(modelId);
            });
        });
    }
    
    // Settings forms
    const settingsForms = document.querySelectorAll('form[id$="-settings-form"]');
    if (settingsForms) {
        settingsForms.forEach(form => {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // In a real implementation, this would send the form data to the server
                // For now, just show a notification
                showNotification('Settings saved successfully', 'success');
            });
        });
    }
    
    // Update range input display values
    document.querySelectorAll('input[type="range"]').forEach(input => {
        const valueDisplay = document.getElementById(`${input.id}-value`);
        if (valueDisplay) {
            input.addEventListener('input', () => {
                valueDisplay.textContent = input.value;
            });
        }
    });
});

// Add CSS for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 10px 20px;
    border-radius: 4px;
    color: white;
    z-index: 1000;
    opacity: 0;
    transform: translateY(-20px);
    transition: opacity 0.3s, transform 0.3s;
}

.notification.show {
    opacity: 1;
    transform: translateY(0);
}

.notification.info {
    background-color: #3498db;
}

.notification.success {
    background-color: #2ecc71;
}

.notification.warning {
    background-color: #f39c12;
}

.notification.error {
    background-color: #e74c3c;
}
`;
document.head.appendChild(notificationStyles);
