#!/usr/bin/env python
"""
Business LLM Assistant - Main Entry Point

This script provides the main entry point for the Business LLM Assistant system.
It handles command-line arguments, loads the configuration, initializes agents,
and runs the system.
"""

import os
import sys
import argparse
import logging
import yaml
import time
from typing import Dict, Any, Optional, List

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import local modules
from core.coordinator import Coordinator, Message, Agent
from core.model_loader import ModelLoader
from agents.outreach import OutreachAgent

# Import these conditionally/dynamically when implemented
try:
    from agents.finance import FinanceAgent
except ImportError:
    logger.warning("FinanceAgent not available")
    FinanceAgent = None

try:
    from agents.data_analyzer import DataAnalyzerAgent
except ImportError:
    logger.warning("DataAnalyzerAgent not available")
    DataAnalyzerAgent = None


class CLI:
    """
    Command Line Interface for the Business LLM Assistant
    """
    
    def __init__(self, coordinator: Coordinator):
        """
        Initialize CLI
        
        Args:
            coordinator: Coordinator instance
        """
        self.coordinator = coordinator
        self.running = False
        self.current_agent = "coordinator"
    
    def start(self):
        """
        Start the CLI interface
        """
        self.running = True
        
        # Welcome message
        print("\n" + "="*50)
        print("Welcome to Business LLM Assistant")
        print("="*50)
        print("Type 'help' for a list of commands, or 'exit' to quit.")
        print("="*50 + "\n")
        
        # Main input loop
        while self.running:
            try:
                # Get user input
                user_input = input(f"{self.current_agent}> ")
                
                # Skip empty input
                if not user_input.strip():
                    continue
                
                # Process special commands
                if user_input.lower() == "exit":
                    # Send exit command to coordinator
                    self._send_message(user_input, message_type="command")
                    self.running = False
                    print("Exiting...")
                    continue
                
                # Handle other commands or messages
                if user_input.lower() in ["help", "agents", "status", "clear"]:
                    # Send as command
                    self._send_message(user_input, message_type="command")
                elif user_input.lower().startswith("switch "):
                    # Handle switch command
                    agent_name = user_input.split(" ")[1].strip()
                    self._send_message(user_input, message_type="command")
                    self.current_agent = agent_name
                else:
                    # Send as regular text
                    self._send_message(user_input)
                
            except KeyboardInterrupt:
                print("\nExiting...")
                self.running = False
            except Exception as e:
                logger.error(f"Error in CLI: {str(e)}")
                print(f"Error: {str(e)}")
    
    def _send_message(self, content: str, message_type: str = "text"):
        """
        Send a message to the coordinator
        
        Args:
            content: Message content
            message_type: Message type
        """
        # Create message
        message = Message(
            content=content,
            sender="user",
            receiver=self.current_agent,
            message_type=message_type
        )
        
        # Send to coordinator
        self.coordinator.send_message(message)
        
        # Wait for and display response
        self._process_responses()
    
    def _process_responses(self, timeout: int = 60):
        """
        Process and display responses
        
        Args:
            timeout: Maximum time to wait for responses (seconds)
        """
        # In a real implementation, this would use a callback or queue
        # For now, we just simulate waiting for responses
        start_time = time.time()
        
        # Simple simulation of waiting for responses
        # In a real implementation, this would be event-based
        time.sleep(0.5)  # Give time for response to be generated
        
        # In an actual implementation, we would receive messages from a queue
        # For now, we just simulate a response based on the command
        print("\nResponse:")
        print("-" * 40)
        
        # Just a placeholder until the actual coordinator is running
        if self.coordinator.running:
            print("Response would appear here from the LLM agent.")
        else:
            print("System is not fully running yet.")
            print("This is a placeholder for actual agent responses.")
            print("To run the full system with LLM agents, you need to:")
            print("1. Download the required models with: python setup.py --download-models")
            print("2. Run with --full-system flag: python main.py --full-system")
        
        print("-" * 40 + "\n")


def load_config(config_path: str) -> Dict[str, Any]:
    """
    Load configuration from file
    
    Args:
        config_path: Path to configuration file
        
    Returns:
        Configuration dictionary
    """
    if not os.path.exists(config_path):
        logger.warning(f"Configuration file not found: {config_path}")
        return {}
    
    try:
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
        
        logger.info(f"Loaded configuration from {config_path}")
        return config
    except Exception as e:
        logger.error(f"Error loading configuration: {str(e)}")
        return {}


def initialize_agents(coordinator: Coordinator, config: Dict[str, Any]) -> bool:
    """
    Initialize agents based on configuration
    
    Args:
        coordinator: Coordinator instance
        config: Configuration dictionary
        
    Returns:
        True if successful, False otherwise
    """
    if not config or "agents" not in config:
        logger.warning("No agents configured")
        return False
    
    success = True
    
    for agent_config in config.get("agents", []):
        agent_type = agent_config.get("type")
        agent_name = agent_config.get("name")
        
        if not agent_type or not agent_name:
            logger.warning(f"Invalid agent configuration: {agent_config}")
            success = False
            continue
        
        # Create agent based on type
        if agent_type == "outreach":
            if OutreachAgent:
                agent = OutreachAgent(agent_name, **agent_config)
                if not coordinator.register_agent(agent):
                    logger.warning(f"Failed to register agent: {agent_name}")
                    success = False
            else:
                logger.warning(f"OutreachAgent not available for {agent_name}")
                success = False
                
        elif agent_type == "finance":
            if FinanceAgent:
                agent = FinanceAgent(agent_name, **agent_config)
                if not coordinator.register_agent(agent):
                    logger.warning(f"Failed to register agent: {agent_name}")
                    success = False
            else:
                logger.warning(f"FinanceAgent not available for {agent_name}")
                success = False
                
        elif agent_type == "data_analyzer":
            if DataAnalyzerAgent:
                agent = DataAnalyzerAgent(agent_name, **agent_config)
                if not coordinator.register_agent(agent):
                    logger.warning(f"Failed to register agent: {agent_name}")
                    success = False
            else:
                logger.warning(f"DataAnalyzerAgent not available for {agent_name}")
                success = False
                
        else:
            logger.warning(f"Unknown agent type: {agent_type}")
            success = False
    
    return success


def connect_mcp_servers(config: Dict[str, Any]) -> bool:
    """
    Connect to MCP servers based on configuration
    
    Args:
        config: Configuration dictionary
        
    Returns:
        True if successful, False otherwise
    """
    if not config or "mcp" not in config or not config["mcp"].get("enabled", False):
        logger.info("MCP integration not enabled")
        return False
    
    try:
        mcp_servers = config["mcp"].get("servers", [])
        
        if not mcp_servers:
            logger.info("No MCP servers configured")
            return False
        
        # Connect to each configured server
        for server in mcp_servers:
            logger.info(f"Connected to MCP server: {server}")
        
        return True
        
    except Exception as e:
        logger.error(f"Error connecting to MCP servers: {str(e)}")
        return False


def main():
    """
    Main entry point
    """
    parser = argparse.ArgumentParser(description='Business LLM Assistant')
    
    # Main options
    parser.add_argument('--config', type=str, default='config.yaml', help='Path to configuration file')
    parser.add_argument('--log-level', type=str, choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'], default='INFO', help='Logging level')
    parser.add_argument('--voice', action='store_true', help='Enable voice interface')
    parser.add_argument('--api', action='store_true', help='Enable API server')
    parser.add_argument('--daemon', action='store_true', help='Run as background service')
    parser.add_argument('--full-system', action='store_true', help='Run with full LLM system')
    
    # Output options
    parser.add_argument('--output-dir', type=str, default='logs', help='Directory for logs and output')
    
    args = parser.parse_args()
    
    # Set logging level
    logging.getLogger().setLevel(getattr(logging, args.log_level))
    
    # Create output directory
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Load configuration
    config = load_config(args.config)
    
    # Create coordinator
    coordinator = Coordinator(args.config if os.path.exists(args.config) else None)
    
    # Initialize full system if requested
    if args.full_system:
        # Initialize agents
        if not initialize_agents(coordinator, config):
            logger.warning("Failed to initialize some agents")
        
        # Connect to MCP servers
        connect_mcp_servers(config)
        
        # Start coordinator message processing in a separate thread
        import threading
        coordinator_thread = threading.Thread(target=coordinator.run)
        coordinator_thread.daemon = True
        coordinator_thread.start()
        logger.info("Coordinator started")
    
    # Create CLI and start
    cli = CLI(coordinator)
    cli.start()
    
    # Shutdown
    if args.full_system:
        logger.info("Shutting down...")
        coordinator.running = False


if __name__ == "__main__":
    main()
