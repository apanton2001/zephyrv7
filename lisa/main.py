#!/usr/bin/env python
"""
Lisa - Advanced AI Assistant

This script provides the main entry point for Lisa, an advanced AI assistant
designed to access system resources, read emails, make suggestions,
and collaborate with other LLM systems.
"""

import os
import sys
import argparse
import logging
import yaml
import time
import threading
from typing import Dict, Any, Optional, List

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(os.path.dirname(__file__), "data", "lisa.log")),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Import local modules
from core.coordinator import Coordinator, Message, Agent
from core.model_loader import ModelLoader
from core.system_access import SystemAccessManager
from core.email_manager import EmailManager
from core.llm_connector import LLMConnector

# Import agents dynamically
try:
    from agents.system_agent import SystemAgent
except ImportError:
    logger.warning("SystemAgent not available")
    SystemAgent = None

try:
    from agents.email_agent import EmailAgent
except ImportError:
    logger.warning("EmailAgent not available")
    EmailAgent = None

try:
    from agents.content_agent import ContentAgent
except ImportError:
    logger.warning("ContentAgent not available")
    ContentAgent = None

try:
    from agents.suggestion_agent import SuggestionAgent
except ImportError:
    logger.warning("SuggestionAgent not available")
    SuggestionAgent = None


class LisaCLI:
    """
    Command Line Interface for Lisa
    """
    
    def __init__(self, coordinator: Coordinator, system_access: SystemAccessManager, 
                 email_manager: Optional[EmailManager] = None, 
                 llm_connector: Optional[LLMConnector] = None):
        """
        Initialize Lisa CLI
        
        Args:
            coordinator: Coordinator instance
            system_access: SystemAccessManager instance
            email_manager: EmailManager instance (optional)
            llm_connector: LLMConnector instance (optional)
        """
        self.coordinator = coordinator
        self.system_access = system_access
        self.email_manager = email_manager
        self.llm_connector = llm_connector
        self.running = False
        self.current_agent = "coordinator"
        
        # Setup paths
        self.log_dir = os.path.join(os.path.dirname(__file__), "data", "logs")
        os.makedirs(self.log_dir, exist_ok=True)
    
    def start(self):
        """
        Start the CLI interface
        """
        self.running = True
        
        # Welcome message
        print("\n" + "="*50)
        print("Welcome to Lisa - Advanced AI Assistant")
        print("="*50)
        print("Type 'help' for a list of commands, or 'exit' to quit.")
        print("Type 'agents' to see available specialized agents.")
        print("="*50 + "\n")
        
        # Main input loop
        while self.running:
            try:
                # Get user input
                user_input = input(f"Lisa ({self.current_agent})> ")
                
                # Skip empty input
                if not user_input.strip():
                    continue
                
                # Process special commands
                if user_input.lower() == "exit":
                    # Send exit command to coordinator
                    self._send_message(user_input, message_type="command")
                    self.running = False
                    print("Exiting Lisa...")
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
                elif user_input.lower().startswith("email "):
                    # Handle email command
                    self._handle_email_command(user_input)
                elif user_input.lower().startswith("system "):
                    # Handle system command
                    self._handle_system_command(user_input)
                elif user_input.lower().startswith("llm "):
                    # Handle LLM command
                    self._handle_llm_command(user_input)
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
    
    def _handle_email_command(self, command: str):
        """
        Handle email-specific commands
        
        Args:
            command: Email command string
        """
        if not self.email_manager:
            print("Email functionality is not available.")
            return
        
        parts = command.split(" ", 2)
        if len(parts) < 2:
            print("Invalid email command. Try 'email help' for assistance.")
            return
        
        subcmd = parts[1].lower()
        
        if subcmd == "help":
            print("\nEmail Commands:")
            print("  email check - Check for new emails")
            print("  email read [limit] - Read recent emails")
            print("  email search [query] - Search emails")
            print("  email analyze - Analyze recent communications")
            print("  email setup - Configure email settings")
            print()
        
        elif subcmd == "check":
            try:
                count = self.email_manager.check_new_emails()
                print(f"You have {count} new messages.")
            except Exception as e:
                print(f"Error checking emails: {str(e)}")
        
        elif subcmd == "read":
            limit = 5  # Default
            if len(parts) > 2:
                try:
                    limit = int(parts[2])
                except ValueError:
                    pass
            
            try:
                emails = self.email_manager.get_recent_emails(limit)
                if not emails:
                    print("No emails found.")
                    return
                
                for i, email in enumerate(emails):
                    print(f"\n--- Email {i+1}/{len(emails)} ---")
                    print(f"From: {email['from']}")
                    print(f"Subject: {email['subject']}")
                    print(f"Date: {email['date']}")
                    print(f"\n{email['body'][:200]}...")
                    print("-" * 40)
            except Exception as e:
                print(f"Error reading emails: {str(e)}")
        
        elif subcmd == "search" and len(parts) > 2:
            query = parts[2]
            try:
                results = self.email_manager.search_emails(query)
                print(f"Found {len(results)} matching emails.")
                for i, email in enumerate(results[:5]):  # Show first 5
                    print(f"\n--- Result {i+1}/{min(len(results), 5)} ---")
                    print(f"From: {email['from']}")
                    print(f"Subject: {email['subject']}")
                    print(f"Date: {email['date']}")
                    print("-" * 40)
            except Exception as e:
                print(f"Error searching emails: {str(e)}")
        
        elif subcmd == "analyze":
            try:
                analysis = self.email_manager.analyze_communications()
                print("\nEmail Communication Analysis:")
                print(analysis)
            except Exception as e:
                print(f"Error analyzing emails: {str(e)}")
        
        elif subcmd == "setup":
            try:
                self.email_manager.setup_email_config()
                print("Email configuration has been updated.")
            except Exception as e:
                print(f"Error setting up email: {str(e)}")
        
        else:
            print(f"Unknown email command: {subcmd}")
            print("Try 'email help' for assistance.")
    
    def _handle_system_command(self, command: str):
        """
        Handle system-specific commands
        
        Args:
            command: System command string
        """
        parts = command.split(" ", 2)
        if len(parts) < 2:
            print("Invalid system command. Try 'system help' for assistance.")
            return
        
        subcmd = parts[1].lower()
        
        if subcmd == "help":
            print("\nSystem Commands:")
            print("  system info - Display system information")
            print("  system files [path] - List files in directory")
            print("  system search [query] - Search for files")
            print("  system monitor - Show system resource usage")
            print("  system scan - Scan for potential issues")
            print()
        
        elif subcmd == "info":
            try:
                info = self.system_access.get_system_info()
                print("\nSystem Information:")
                for key, value in info.items():
                    print(f"  {key}: {value}")
            except Exception as e:
                print(f"Error getting system info: {str(e)}")
        
        elif subcmd == "files" and len(parts) > 2:
            path = parts[2]
            try:
                files = self.system_access.list_files(path)
                print(f"\nContents of {path}:")
                for item in files:
                    item_type = "DIR" if item["is_dir"] else "FILE"
                    size = f"{item['size']/1024:.1f} KB" if not item["is_dir"] else ""
                    print(f"  [{item_type}] {item['name']} {size}")
            except Exception as e:
                print(f"Error listing files: {str(e)}")
        
        elif subcmd == "search" and len(parts) > 2:
            query = parts[2]
            try:
                results = self.system_access.search_files(query)
                print(f"\nFound {len(results)} matching files:")
                for i, item in enumerate(results[:10]):  # Show first 10
                    print(f"  {i+1}. {item['path']}")
                if len(results) > 10:
                    print(f"  ... and {len(results)-10} more")
            except Exception as e:
                print(f"Error searching files: {str(e)}")
        
        elif subcmd == "monitor":
            try:
                stats = self.system_access.get_resource_usage()
                print("\nSystem Resource Usage:")
                print(f"  CPU: {stats['cpu_percent']}%")
                print(f"  Memory: {stats['memory_used']:.1f} GB / {stats['memory_total']:.1f} GB ({stats['memory_percent']}%)")
                print(f"  Disk: {stats['disk_used']:.1f} GB / {stats['disk_total']:.1f} GB ({stats['disk_percent']}%)")
                print(f"  Network: ↓ {stats['network_down']:.1f} MB/s  ↑ {stats['network_up']:.1f} MB/s")
                
                print("\nTop Processes:")
                for proc in stats['top_processes']:
                    print(f"  {proc['name']}: CPU {proc['cpu']}%, Mem {proc['memory']} MB")
            except Exception as e:
                print(f"Error monitoring system: {str(e)}")
        
        elif subcmd == "scan":
            try:
                issues = self.system_access.scan_system_health()
                if not issues:
                    print("\nNo significant issues detected.")
                else:
                    print("\nPotential System Issues:")
                    for issue in issues:
                        print(f"  [{issue['severity']}] {issue['description']}")
                        if 'recommendation' in issue:
                            print(f"     Recommendation: {issue['recommendation']}")
            except Exception as e:
                print(f"Error scanning system: {str(e)}")
        
        else:
            print(f"Unknown system command: {subcmd}")
            print("Try 'system help' for assistance.")

    def _handle_llm_command(self, command: str):
        """
        Handle LLM-specific commands
        
        Args:
            command: LLM command string
        """
        if not self.llm_connector:
            print("LLM connector functionality is not available.")
            return
        
        parts = command.split(" ", 2)
        if len(parts) < 2:
            print("Invalid LLM command. Try 'llm help' for assistance.")
            return
        
        subcmd = parts[1].lower()
        
        if subcmd == "help":
            print("\nLLM Commands:")
            print("  llm list - List available LLM models")
            print("  llm connect [model] - Connect to a specific LLM")
            print("  llm query [text] - Send a query to connected LLMs")
            print("  llm compare [text] - Compare responses from all connected LLMs")
            print("  llm disconnect [model] - Disconnect from a specific LLM")
            print()
        
        elif subcmd == "list":
            try:
                models = self.llm_connector.list_available_models()
                print("\nAvailable LLM Models:")
                for model in models:
                    status = "Connected" if model["connected"] else "Disconnected"
                    print(f"  {model['name']} - {model['type']} - {status}")
            except Exception as e:
                print(f"Error listing models: {str(e)}")
        
        elif subcmd == "connect" and len(parts) > 2:
            model_name = parts[2]
            try:
                success = self.llm_connector.connect_to_model(model_name)
                if success:
                    print(f"Successfully connected to {model_name}.")
                else:
                    print(f"Failed to connect to {model_name}.")
            except Exception as e:
                print(f"Error connecting to model: {str(e)}")
        
        elif subcmd == "query" and len(parts) > 2:
            query = parts[2]
            try:
                responses = self.llm_connector.query_models(query)
                print("\nLLM Responses:")
                for model, response in responses.items():
                    print(f"\n--- {model} ---")
                    print(response)
                    print("-" * 40)
            except Exception as e:
                print(f"Error querying models: {str(e)}")
        
        elif subcmd == "compare" and len(parts) > 2:
            query = parts[2]
            try:
                comparison = self.llm_connector.compare_responses(query)
                print("\nLLM Response Comparison:")
                print(comparison)
            except Exception as e:
                print(f"Error comparing responses: {str(e)}")
        
        elif subcmd == "disconnect" and len(parts) > 2:
            model_name = parts[2]
            try:
                success = self.llm_connector.disconnect_from_model(model_name)
                if success:
                    print(f"Successfully disconnected from {model_name}.")
                else:
                    print(f"Failed to disconnect from {model_name}.")
            except Exception as e:
                print(f"Error disconnecting from model: {str(e)}")
        
        else:
            print(f"Unknown LLM command: {subcmd}")
            print("Try 'llm help' for assistance.")
    
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
            print("1. Configure Lisa by editing config.yaml")
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


def initialize_agents(coordinator: Coordinator, system_access: SystemAccessManager, 
                     email_manager: Optional[EmailManager], 
                     llm_connector: Optional[LLMConnector],
                     config: Dict[str, Any]) -> bool:
    """
    Initialize agents based on configuration
    
    Args:
        coordinator: Coordinator instance
        system_access: SystemAccessManager instance
        email_manager: EmailManager instance (optional)
        llm_connector: LLMConnector instance (optional)
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
        if agent_type == "system" and SystemAgent:
            agent = SystemAgent(agent_name, system_access=system_access, **agent_config)
            if not coordinator.register_agent(agent):
                logger.warning(f"Failed to register agent: {agent_name}")
                success = False
        
        elif agent_type == "email" and EmailAgent and email_manager:
            agent = EmailAgent(agent_name, email_manager=email_manager, **agent_config)
            if not coordinator.register_agent(agent):
                logger.warning(f"Failed to register agent: {agent_name}")
                success = False
        
        elif agent_type == "content" and ContentAgent:
            agent = ContentAgent(agent_name, **agent_config)
            if not coordinator.register_agent(agent):
                logger.warning(f"Failed to register agent: {agent_name}")
                success = False
        
        elif agent_type == "suggestion" and SuggestionAgent and llm_connector:
            agent = SuggestionAgent(agent_name, llm_connector=llm_connector, **agent_config)
            if not coordinator.register_agent(agent):
                logger.warning(f"Failed to register agent: {agent_name}")
                success = False
        
        else:
            logger.warning(f"Unknown or unavailable agent type: {agent_type}")
            success = False
    
    return success


def main():
    """
    Main entry point
    """
    parser = argparse.ArgumentParser(description='Lisa - Advanced AI Assistant')
    
    # Main options
    parser.add_argument('--config', type=str, default='config.yaml', help='Path to configuration file')
    parser.add_argument('--log-level', type=str, choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'], default='INFO', help='Logging level')
    parser.add_argument('--full-system', action='store_true', help='Run with full LLM system')
    parser.add_argument('--no-email', action='store_true', help='Disable email functionality')
    parser.add_argument('--no-system-access', action='store_true', help='Disable system access')
    parser.add_argument('--no-llm-connector', action='store_true', help='Disable LLM connector')
    
    # Output options
    parser.add_argument('--output-dir', type=str, default='data/logs', help='Directory for logs and output')
    
    args = parser.parse_args()
    
    # Set logging level
    logging.getLogger().setLevel(getattr(logging, args.log_level))
    
    # Create output directory
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Load configuration
    config_path = os.path.join(os.path.dirname(__file__), args.config)
    config = load_config(config_path)
    
    # Initialize system components
    system_access = None if args.no_system_access else SystemAccessManager()
    email_manager = None if args.no_email else EmailManager(config.get("email", {}))
    llm_connector = None if args.no_llm_connector else LLMConnector(config.get("llm", {}))
    
    # Create coordinator
    coordinator = Coordinator(config_path if os.path.exists(config_path) else None)
    
    # Initialize full system if requested
    if args.full_system:
        # Initialize agents
        if not initialize_agents(coordinator, system_access, email_manager, llm_connector, config):
            logger.warning("Failed to initialize some agents")
        
        # Start coordinator message processing in a separate thread
        coordinator_thread = threading.Thread(target=coordinator.run)
        coordinator_thread.daemon = True
        coordinator_thread.start()
        logger.info("Coordinator started")
    
    # Create CLI and start
    cli = LisaCLI(coordinator, system_access, email_manager, llm_connector)
    cli.start()
    
    # Shutdown
    if args.full_system:
        logger.info("Shutting down...")
        coordinator.running = False


if __name__ == "__main__":
    main()
