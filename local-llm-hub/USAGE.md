# Using Local LLM Hub

This guide explains how to use the Local LLM Hub after installation.

## Getting Started

### Launching the Interface

Start the web interface by running:

```bash
python app.py
```

This will start a local web server, typically on http://localhost:8000. Open this URL in your browser to access the interface.

## Basic Usage

### Selecting a Model

1. From the main interface, select a model from the dropdown menu
2. The model will be loaded (this may take a few moments for larger models)
3. Once loaded, you can begin interacting with the model

### Chatting with a Model

1. Type your message in the input field
2. Press Enter or click the Send button
3. The model will process your input and display its response
4. Continue the conversation as needed

### Adjusting Parameters

You can modify the model's behavior by adjusting parameters in real-time:

- **Temperature**: Controls randomness (higher = more creative, lower = more focused)
- **Top P**: Controls diversity of responses
- **Context Length**: Maximum tokens to consider for context
- **Max Length**: Maximum length of generated responses

### Comparing Models

To compare responses from different models:

1. Select "Comparison Mode" from the menu
2. Choose the models you want to compare
3. Enter your prompt once
4. View side-by-side responses from each model

## Advanced Features

### Custom System Prompts

You can set a custom system prompt to influence the model's behavior:

1. Go to Settings > System Prompts
2. Create a new prompt or select from templates
3. Apply the prompt to your current session

### Saving and Loading Conversations

Save interesting conversations for later reference:

1. Click "Save Conversation" in the menu
2. Give your conversation a name
3. Access saved conversations from the "History" tab

### Batch Processing

Process multiple prompts in one go:

1. Go to Tools > Batch Processing
2. Upload a text file with one prompt per line
3. Select the model(s) to use
4. Download results as CSV or JSON

### Model Performance Metrics

View performance statistics for your models:

1. Go to Settings > Performance
2. See metrics like response time, token usage, etc.
3. Compare performance across different models

## Command Line Interface

For advanced users, there's also a command-line interface:

```bash
# Get a single response
python cli.py --model llama3.1-8b --prompt "Explain quantum computing"

# Compare models
python cli.py --compare --models llama3.1-8b,mistral-7b --prompt "Solve this riddle: what has keys but no locks?"

# Run in chat mode
python cli.py --model vicuna-7b --chat
```

## Working with Specific Models

Each model may have unique characteristics or capabilities. Here are some model-specific tips:

### Llama 3.1
- Excels at creative writing and balanced reasoning
- Works well with role-playing prompts

### Mistral
- Strong at following complex instructions
- Good balance of performance and resource usage

### Vicuna
- Particularly strong at conversational interactions
- Works well when personality is important

### WizardLM
- Excellent at step-by-step reasoning
- Good choice for educational content

## Customizing the Interface

You can customize the interface by editing the `config.yaml` file:

```yaml
interface:
  theme: dark  # Options: light, dark, system
  layout: split  # Options: split, full, compact
  features:
    code_highlighting: true
    markdown_support: true
    syntax_highlighting: true
```

## Troubleshooting

### Slow Responses

If responses are taking too long:
- Try reducing the context length
- Enable 4-bit quantization in settings
- Use a smaller model variant

### Incorrect or Nonsensical Responses

If you're getting poor quality responses:
- Try increasing the temperature slightly
- Ensure your prompt is clear and specific
- Try a different model that may be better suited to your task

### Browser Compatibility

The interface works best with modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari

Internet Explorer is not supported.
