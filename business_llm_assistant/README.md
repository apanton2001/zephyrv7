# Business LLM Assistant

A multi-agent LLM system designed to help manage business operations, focusing on outreach, onboarding, revenue tracking, and data utilization.

## System Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                     Central Coordinator                       │
│  [Small 1-3B model that routes requests and manages workflow] │
└───────────────┬─────────────────┬───────────────┬─────────────┘
                │                 │               │
    ┌───────────▼─────┐   ┌──────▼────────┐   ┌──▼──────────────┐
    │  Outreach Agent  │   │ Finance Agent │   │  Data Analyzer  │
    │    [3-7B LLM]    │   │   [2-4B LLM]  │   │    [4-7B LLM]   │
    └───────────┬─────┘   └──────┬────────┘   └──┬──────────────┘
                │                 │               │
                └─────────────────┼───────────────┘
                                  │
                        ┌─────────▼──────────┐
                        │  Document Storage  │
                        │   & Knowledge DB   │
                        └────────────────────┘
```

## Features

- **Outreach Management**: Track and manage client communications
- **Financial Tracking**: Monitor revenue streams and business metrics
- **Data Analysis**: Analyze business data for actionable insights
- **Voice Interface**: Interact via voice commands
- **Automated Scheduling**: Manage appointments and follow-ups
- **Document Analysis**: Extract and leverage information from documents

## Project Structure

```
business_llm_assistant/
├── core/                 # Core system components
│   ├── coordinator.py    # Central workflow coordinator
│   ├── message_bus.py    # Inter-agent communication
│   ├── model_loader.py   # Model loading and management
│   └── voice_interface.py# Voice interaction components
│
├── agents/               # Specialized LLM agents
│   ├── outreach.py       # Client communication agent
│   ├── finance.py        # Revenue tracking agent
│   └── data_analyzer.py  # Data analysis agent
│
├── utils/                # Utility functions
│   ├── db_manager.py     # Database interactions
│   ├── file_processor.py # File handling utilities
│   ├── memory_manager.py # Memory optimization
│   └── security.py       # Data security utilities
│
├── data/                 # Data storage directory
│   ├── documents/        # Document storage
│   ├── vector_db/        # Vector embeddings storage
│   └── conversation/     # Conversation history
│
└── docs/                 # Documentation
    ├── installation.md   # Installation guide
    ├── usage.md          # Usage instructions
    └── api.md            # API documentation
```

## Requirements

- Python 3.10+
- Local LLM models (quantized for efficiency)
- 8GB+ RAM recommended
- CUDA-compatible GPU recommended but not required

## Installation

Detailed installation instructions can be found in [docs/installation.md](docs/installation.md).

## Usage

Basic usage instructions can be found in [docs/usage.md](docs/usage.md).

## License

MIT License
