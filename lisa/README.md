# Lisa - Advanced AI Assistant

Lisa is a powerful, modular AI assistant designed to access system resources, read emails, make intelligent suggestions, and collaborate with other LLM models. It's built to be extensible and secure, with a focus on providing comprehensive assistance while respecting privacy.

## Key Features

- **System Access**: Lisa can safely interact with your computer's file system, monitor resources, and provide system information
- **Email Integration**: Read, analyze, and respond to emails while building an understanding of your communication patterns
- **Multi-Model Collaboration**: Connect to and leverage multiple LLM models, comparing their responses for better answers
- **Modular Architecture**: Specialized agents that focus on different tasks and collaborate to solve complex problems
- **Privacy First**: All data remains local, with configurable safety levels to control system access

## Architecture

Lisa is built on a modular architecture with multiple specialized components:

```
lisa/
├── core/               # Core system components
│   ├── coordinator.py  # Central message router and coordinator 
│   ├── model_loader.py # Loads and manages LLM models
│   ├── system_access.py # Safe system resource access
│   ├── email_manager.py # Email access and analysis
│   └── llm_connector.py # Multi-LLM connectivity and comparison
├── agents/             # Specialized AI agents
│   ├── system_agent.py # Handles system operations
│   ├── email_agent.py  # Manages email-related tasks
│   ├── content_agent.py # Creates and analyzes content
│   └── suggestion_agent.py # Generates recommendations
├── data/               # Data storage
│   ├── models/         # LLM model files
│   ├── cache/          # Response caching
│   └── logs/           # System logs
├── dashboard/          # Web dashboard (future)
├── main.py             # Main entry point
├── config.yaml         # Configuration
└── README.md           # This file
```

## Installation

### Prerequisites

- Python 3.9 or higher
- Pip package manager
- Required Python libraries (see below)

### Setup

1. Clone or download this repository

2. Install required packages:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure Lisa by editing `config.yaml` or through interactive setup during first run

4. Run Lisa:
   ```bash
   python main.py
   ```

5. For full LLM capabilities, run with:
   ```bash
   python main.py --full-system
   ```

## Usage

Lisa provides a command-line interface with various commands:

### Basic Commands

- `help` - Display available commands
- `agents` - List available specialized agents
- `switch [agent]` - Switch to a specific agent
- `clear` - Clear conversation history
- `save` - Save the current conversation
- `status` - Display system status
- `exit` - Exit the program

### System Commands

Access system information and files with:

```
system info            # Display system information
system files [path]    # List files in directory
system search [query]  # Search for files
system monitor         # Show system resource usage
system scan            # Scan for potential issues
```

### Email Commands

Access email functionality with:

```
email check           # Check for new emails
email read [limit]    # Read recent emails
email search [query]  # Search emails
email analyze         # Analyze email communications
email setup           # Configure email settings
```

### LLM Commands

Interact with multiple LLM models:

```
llm list              # List available LLM models
llm connect [model]   # Connect to a specific model
llm query [text]      # Query connected models
llm compare [text]    # Compare responses from all models
llm disconnect [model] # Disconnect from a model
```

## Configuration

Lisa is configured through `config.yaml` file, which includes settings for:

- System access permissions and safety levels
- Email credentials and settings
- LLM model configurations
- Agent setup and specialized behaviors

## Security Considerations

- Lisa employs a safety system for system access with configurable safety levels
- Email credentials are stored securely and not included in configuration files
- All data processing happens locally on your machine
- No data is sent to external servers except for explicit LLM API calls

## Privacy

- Lisa processes data locally when possible
- External API calls are made only when needed and with your configured credentials
- Your data is never stored or analyzed outside of your computer without permission

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Development

Lisa is under active development. Future enhancements include:
- Web dashboard for visual interaction
- More specialized agents
- Plugin system for community extensions
- Voice interaction capabilities
- Advanced document analysis

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Disclaimer

Lisa is an assistant tool and should be used responsibly. Always verify important information and decisions. The system has safety mechanisms but should be configured properly to prevent unintended access to sensitive system resources.
