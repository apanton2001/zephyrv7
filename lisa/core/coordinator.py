"""
Coordinator Module for Lisa

This module implements the central coordinator that manages the workflow between
different specialized LLM agents. It handles routing requests to the appropriate agent,
maintaining conversation context, and coordinating responses.
"""

import os
import json
import logging
import time
from typing import Dict, List, Any, Optional, Tuple, Union
from queue import Queue, PriorityQueue
from threading import Lock
import yaml

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import local modules
try:
    from .model_loader import ModelLoader
except ImportError:
    # Adjust import path if module is run directly
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from core.model_loader import ModelLoader


class Message:
    """
    Represents a message in the system
    """
    def __init__(self, 
                 content: str, 
                 sender: str, 
                 receiver: str = "coordinator",
                 message_type: str = "text",
                 metadata: Optional[Dict[str, Any]] = None):
        """
        Initialize a message

        Args:
            content: Message content
            sender: Name of sender agent
            receiver: Name of receiver agent
            message_type: Type of message (text, command, data, etc.)
            metadata: Additional metadata
        """
        self.content = content
        self.sender = sender
        self.receiver = receiver
        self.message_type = message_type
        self.metadata = metadata or {}
        self.timestamp = time.time()
        self.id = f"{sender}-{receiver}-{int(self.timestamp * 1000)}"
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert message to dictionary for serialization

        Returns:
            Dictionary representation of message
        """
        return {
            "id": self.id,
            "content": self.content,
            "sender": self.sender,
            "receiver": self.receiver,
            "message_type": self.message_type,
            "metadata": self.metadata,
            "timestamp": self.timestamp
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Message':
        """
        Create message from dictionary

        Args:
            data: Dictionary with message data

        Returns:
            Message object
        """
        msg = cls(
            content=data["content"],
            sender=data["sender"],
            receiver=data["receiver"],
            message_type=data["message_type"],
            metadata=data["metadata"]
        )
        msg.timestamp = data["timestamp"]
        msg.id = data["id"]
        return msg
    
    def __str__(self) -> str:
        """
        String representation of message

        Returns:
            Message as string
        """
        return f"Message from {self.sender} to {self.receiver}: {self.content[:50]}..." if len(self.content) > 50 else self.content


class Agent:
    """
    Base class for LLM-based agents
    """
    def __init__(self, name: str, model_name: str, model_type: str = "gguf"):
        """
        Initialize an agent

        Args:
            name: Agent name
            model_name: Name of model to use
            model_type: Type of model (gguf or hf)
        """
        self.name = name
        self.model_name = model_name
        self.model_type = model_type
        self.model = None
        self.tokenizer = None
        self.prompt_template = ""
        self.system_message = ""
        self.conversation_history = []
        self.max_history = 10  # Default max conversation history size
    
    def initialize(self, model_loader: ModelLoader) -> bool:
        """
        Initialize agent with appropriate model

        Args:
            model_loader: ModelLoader instance to load the model

        Returns:
            True if successful, False otherwise
        """
        raise NotImplementedError("Subclasses must implement initialize()")
    
    def process_message(self, message: Message) -> Message:
        """
        Process a message and generate a response

        Args:
            message: Message to process

        Returns:
            Response message
        """
        raise NotImplementedError("Subclasses must implement process_message()")
    
    def update_history(self, message: Message) -> None:
        """
        Update conversation history with a new message

        Args:
            message: Message to add to history
        """
        self.conversation_history.append(message.to_dict())
        
        # Trim history if needed
        if len(self.conversation_history) > self.max_history:
            self.conversation_history = self.conversation_history[-self.max_history:]
    
    def clear_history(self) -> None:
        """
        Clear conversation history
        """
        self.conversation_history = []
    
    def get_prompt(self, message: Message) -> str:
        """
        Generate prompt from message and conversation history

        Args:
            message: Current message

        Returns:
            Complete prompt for the model
        """
        raise NotImplementedError("Subclasses must implement get_prompt()")


class Coordinator:
    """
    Central coordinator for managing multiple agents
    """
    def __init__(self, config_path: str = None):
        """
        Initialize coordinator

        Args:
            config_path: Path to configuration file
        """
        # Initialize basic components
        self.agents = {}
        self.model_loader = ModelLoader()
        self.message_queue = Queue()
        self.priority_queue = PriorityQueue()
        self.lock = Lock()
        self.running = False
        self.message_history = []
        self.max_history = 500  # Increased history for advanced analysis
        
        # Load configuration if provided
        self.config = self._load_config(config_path) if config_path else {}
        
        # Initialize conversation storage
        self.conversation_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "conversations")
        os.makedirs(self.conversation_dir, exist_ok=True)
        
        # For inter-agent collaboration
        self.global_context = {}
        self.agent_capabilities = {}
        
        logger.info("Lisa coordinator initialized")
    
    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """
        Load configuration from YAML file

        Args:
            config_path: Path to configuration file

        Returns:
            Configuration dictionary
        """
        try:
            with open(config_path, 'r') as f:
                config = yaml.safe_load(f)
            logger.info(f"Loaded configuration from {config_path}")
            return config
        except Exception as e:
            logger.error(f"Error loading configuration from {config_path}: {str(e)}")
            return {}
    
    def register_agent(self, agent: Agent) -> bool:
        """
        Register an agent with the coordinator

        Args:
            agent: Agent to register

        Returns:
            True if successful, False otherwise
        """
        if agent.name in self.agents:
            logger.warning(f"Agent {agent.name} is already registered")
            return False
        
        # Initialize agent
        success = agent.initialize(self.model_loader)
        if not success:
            logger.error(f"Failed to initialize agent {agent.name}")
            return False
        
        # Register agent
        self.agents[agent.name] = agent
        
        # Register agent capabilities if available
        if hasattr(agent, 'get_capabilities'):
            self.agent_capabilities[agent.name] = agent.get_capabilities()
        
        logger.info(f"Registered agent: {agent.name}")
        return True
    
    def unregister_agent(self, agent_name: str) -> bool:
        """
        Unregister an agent

        Args:
            agent_name: Name of agent to unregister

        Returns:
            True if successful, False otherwise
        """
        if agent_name not in self.agents:
            logger.warning(f"Agent {agent_name} is not registered")
            return False
        
        # Unload model
        if self.model_loader.is_model_loaded(agent_name):
            self.model_loader.unload_model(agent_name)
        
        # Unregister agent
        del self.agents[agent_name]
        if agent_name in self.agent_capabilities:
            del self.agent_capabilities[agent_name]
            
        logger.info(f"Unregistered agent: {agent_name}")
        return True
    
    def send_message(self, message: Message, priority: int = 1) -> None:
        """
        Send a message between agents

        Args:
            message: Message to send
            priority: Message priority (1-5, lower is higher priority)
        """
        # Add to history
        self.update_history(message)
        
        # If receiver is specified and exists, send directly
        if message.receiver in self.agents:
            self.priority_queue.put((priority, message))
        elif message.receiver == "coordinator":
            # Handle coordinator messages
            self._process_coordinator_message(message)
        elif message.receiver == "all":
            # Broadcast to all agents
            self._broadcast_message(message, priority)
        else:
            logger.warning(f"Unknown receiver: {message.receiver}")
    
    def _broadcast_message(self, message: Message, priority: int = 2) -> None:
        """
        Broadcast a message to all agents

        Args:
            message: Message to broadcast
            priority: Message priority
        """
        for agent_name in self.agents.keys():
            # Create a copy of the message for each agent
            agent_message = Message(
                content=message.content,
                sender=message.sender,
                receiver=agent_name,
                message_type=message.message_type,
                metadata=message.metadata.copy()
            )
            self.priority_queue.put((priority, agent_message))
        
        logger.debug(f"Broadcasted message from {message.sender} to all agents")
    
    def _process_coordinator_message(self, message: Message) -> None:
        """
        Process messages sent to the coordinator

        Args:
            message: Message to process
        """
        # Handle based on message type
        if message.message_type == "command":
            self._handle_command(message)
        elif message.message_type == "query":
            self._handle_query(message)
        elif message.message_type == "collaboration":
            self._handle_collaboration(message)
        else:
            # Default to routing to appropriate agent
            self._route_message(message)
    
    def _handle_command(self, message: Message) -> None:
        """
        Handle command messages

        Args:
            message: Command message
        """
        command = message.content.strip().lower()
        
        # Process common commands
        if command.startswith("switch "):
            # Switch to specific agent
            agent_name = command.split(" ")[1]
            if agent_name in self.agents:
                response = Message(
                    f"Switched to {agent_name} agent",
                    sender="coordinator",
                    receiver=message.sender,
                    message_type="response"
                )
                self.send_message(response)
            else:
                response = Message(
                    f"Agent {agent_name} not found",
                    sender="coordinator",
                    receiver=message.sender,
                    message_type="error"
                )
                self.send_message(response)
        
        elif command == "help":
            # Send help information
            help_text = self._generate_help_text()
            response = Message(
                help_text,
                sender="coordinator",
                receiver=message.sender,
                message_type="response"
            )
            self.send_message(response)
        
        elif command == "agents":
            # List available agents
            agent_list = ", ".join(self.agents.keys())
            if not agent_list:
                agent_list = "No agents currently registered"
            
            response = Message(
                f"Available agents: {agent_list}",
                sender="coordinator",
                receiver=message.sender,
                message_type="response"
            )
            self.send_message(response)
        
        elif command == "clear":
            # Clear conversation history
            for agent in self.agents.values():
                agent.clear_history()
            self.message_history = []
            
            response = Message(
                "Conversation history cleared",
                sender="coordinator",
                receiver=message.sender,
                message_type="response"
            )
            self.send_message(response)
        
        elif command == "exit":
            # Prepare for exit
            response = Message(
                "Shutting down...",
                sender="coordinator",
                receiver=message.sender,
                message_type="response"
            )
            self.send_message(response)
            self.running = False
        
        elif command == "save":
            # Save conversation
            filepath = self.save_conversation()
            response = Message(
                f"Conversation saved to {filepath}",
                sender="coordinator",
                receiver=message.sender,
                message_type="response"
            )
            self.send_message(response)
        
        elif command == "status":
            # System status
            status = self._get_system_status()
            response = Message(
                status,
                sender="coordinator",
                receiver=message.sender,
                message_type="response"
            )
            self.send_message(response)
        
        else:
            # Unknown command
            response = Message(
                f"Unknown command: {command}",
                sender="coordinator",
                receiver=message.sender,
                message_type="error"
            )
            self.send_message(response)
    
    def _handle_query(self, message: Message) -> None:
        """
        Handle query messages

        Args:
            message: Query message
        """
        query = message.content.strip().lower()
        
        # Process queries
        if query.startswith("status"):
            # Get system status
            status = self._get_system_status()
            response = Message(
                status,
                sender="coordinator",
                receiver=message.sender,
                message_type="response"
            )
            self.send_message(response)
        
        elif query.startswith("capabilities"):
            # Get agent capabilities
            capabilities = self._get_agent_capabilities()
            response = Message(
                capabilities,
                sender="coordinator",
                receiver=message.sender,
                message_type="response"
            )
            self.send_message(response)
        
        else:
            # Route other queries to appropriate agent
            self._route_message(message)
    
    def _handle_collaboration(self, message: Message) -> None:
        """
        Handle collaboration messages between agents

        Args:
            message: Collaboration message
        """
        # Extract collaboration type from metadata
        collab_type = message.metadata.get("collaboration_type", "request")
        
        if collab_type == "request":
            # An agent is requesting collaboration
            agent_name = message.metadata.get("target_agent")
            if agent_name in self.agents:
                # Forward request to target agent
                self.priority_queue.put((2, Message(
                    content=message.content,
                    sender=message.sender,
                    receiver=agent_name,
                    message_type="collaboration",
                    metadata={"collaboration_type": "incoming_request"}
                )))
            else:
                # Try to find suitable agents based on capabilities
                suitable_agents = self._find_suitable_agents(message)
                if suitable_agents:
                    # Forward to most suitable agent
                    self.priority_queue.put((2, Message(
                        content=message.content,
                        sender=message.sender,
                        receiver=suitable_agents[0],
                        message_type="collaboration",
                        metadata={"collaboration_type": "incoming_request"}
                    )))
                else:
                    # No suitable agent found
                    self.send_message(Message(
                        content="No suitable agent found for collaboration",
                        sender="coordinator",
                        receiver=message.sender,
                        message_type="error"
                    ))
        
        elif collab_type == "response":
            # An agent is responding to a collaboration request
            target_agent = message.metadata.get("target_agent")
            if target_agent in self.agents:
                # Forward response to requesting agent
                self.priority_queue.put((2, Message(
                    content=message.content,
                    sender=message.sender,
                    receiver=target_agent,
                    message_type="collaboration",
                    metadata={"collaboration_type": "incoming_response"}
                )))
        
        elif collab_type == "broadcast":
            # Broadcast to all agents (except sender)
            for agent_name in self.agents.keys():
                if agent_name != message.sender:
                    self.priority_queue.put((3, Message(
                        content=message.content,
                        sender=message.sender,
                        receiver=agent_name,
                        message_type="collaboration",
                        metadata={"collaboration_type": "broadcast"}
                    )))
    
    def _find_suitable_agents(self, message: Message) -> List[str]:
        """
        Find suitable agents for a collaboration request

        Args:
            message: Collaboration request message

        Returns:
            List of suitable agent names, sorted by relevance
        """
        required_capabilities = message.metadata.get("required_capabilities", [])
        
        # Find agents with matching capabilities
        matches = []
        for agent_name, capabilities in self.agent_capabilities.items():
            # Skip the requesting agent
            if agent_name == message.sender:
                continue
                
            # Check capability match
            matching_caps = [cap for cap in required_capabilities if cap in capabilities]
            if matching_caps:
                matches.append((agent_name, len(matching_caps) / len(required_capabilities)))
        
        # Sort by match score (descending)
        matches.sort(key=lambda x: x[1], reverse=True)
        
        # Return just the agent names
        return [match[0] for match in matches]
    
    def _route_message(self, message: Message) -> None:
        """
        Route a message to the appropriate agent

        Args:
            message: Message to route
        """
        # Analyze message content to determine best agent
        best_agent = self._determine_best_agent(message)
        
        if best_agent:
            # Update receiver and add to queue
            message.receiver = best_agent
            self.priority_queue.put((3, message))  # Normal priority
        else:
            # No suitable agent found
            response = Message(
                "I'm not sure how to handle this request. Please try specifying which agent you want to use.",
                sender="coordinator",
                receiver=message.sender,
                message_type="error"
            )
            self.send_message(response)
    
    def _determine_best_agent(self, message: Message) -> Optional[str]:
        """
        Determine the best agent to handle a message

        Args:
            message: Message to route

        Returns:
            Name of the best agent, or None if no suitable agent
        """
        content = message.content.lower()
        
        # Check for specific keywords to determine agent
        if any(word in content for word in ["email", "mail", "inbox", "message", "send", "reply"]):
            return "email" if "email" in self.agents else None
        
        if any(word in content for word in ["system", "file", "folder", "computer", "resource", "disk", "memory", "cpu"]):
            return "system" if "system" in self.agents else None
        
        if any(word in content for word in ["suggest", "advice", "recommend", "idea", "proposal"]):
            return "suggestion" if "suggestion" in self.agents else None
        
        if any(word in content for word in ["content", "create", "write", "draft", "article", "post"]):
            return "content" if "content" in self.agents else None
        
        # If we have capabilities data, use it for more intelligent routing
        if self.agent_capabilities and "required_capabilities" in message.metadata:
            suitable_agents = self._find_suitable_agents(message)
            if suitable_agents:
                return suitable_agents[0]
        
        # If we got here, choose the first appropriate agent or None
        agent_candidates = ["suggestion", "system", "content", "email"]
        for candidate in agent_candidates:
            if candidate in self.agents:
                return candidate
        
        # If no good candidates, return None
        return None
    
    def _generate_help_text(self) -> str:
        """
        Generate help text for available commands

        Returns:
            Help text string
        """
        help_text = "Lisa Commands:\n"
        help_text += "- help: Display this help message\n"
        help_text += "- agents: List available specialized agents\n"
        help_text += "- switch [agent]: Switch to a specific agent\n"
        help_text += "- clear: Clear conversation history\n"
        help_text += "- save: Save the current conversation\n"
        help_text += "- status: Display system status\n"
        help_text += "- exit: Exit the system\n\n"
        
        help_text += "Special Command Categories:\n"
        help_text += "- email [subcommand]: Email-related commands (try 'email help')\n"
        help_text += "- system [subcommand]: System access commands (try 'system help')\n"
        help_text += "- llm [subcommand]: LLM interaction commands (try 'llm help')\n\n"
        
        help_text += "Available Agents:\n"
        for name, agent in self.agents.items():
            agent_type = agent.__class__.__name__
            help_text += f"- {name}: {agent_type}\n"
        
        if not self.agents:
            help_text += "  No agents currently registered\n"
        
        return help_text
    
    def _get_system_status(self) -> str:
        """
        Get system status information

        Returns:
            Status string
        """
        status = "Lisa System Status:\n"
        
        # Model information
        model_info = self.model_loader.get_model_info()
        status += "Loaded Models:\n"
        if model_info:
            for agent_name, info in model_info.items():
                model_type = info.get("type", "Unknown")
                device = info.get("device", "Unknown")
                is_current = " (current)" if info.get("is_current", False) else ""
                status += f"- {agent_name}: {model_type} on {device}{is_current}\n"
        else:
            status += "  No models currently loaded\n"
        
        # Queue information
        status += f"\nMessage Queue: {self.message_queue.qsize()} messages\n"
        status += f"Priority Queue: {self.priority_queue.qsize()} messages\n"
        
        # Agent information
        status += f"\nActive Agents: {len(self.agents)}\n"
        for name in self.agents.keys():
            status += f"- {name}\n"
        
        # Memory usage
        try:
            import psutil
            process = psutil.Process(os.getpid())
            memory_use = process.memory_info().rss / 1024 / 1024  # MB
            status += f"\nMemory Usage: {memory_use:.2f} MB\n"
        except ImportError:
            status += "\nMemory Usage: psutil not available\n"
        
        # Conversation stats
        status += f"\nConversation History: {len(self.message_history)} messages\n"
        
        return status
    
    def _get_agent_capabilities(self) -> str:
        """
        Get information about agent capabilities

        Returns:
            Capabilities string
        """
        capabilities = "Agent Capabilities:\n"
        
        if not self.agent_capabilities:
            capabilities += "No agent capabilities registered\n"
            return capabilities
        
        for agent_name, caps in self.agent_capabilities.items():
            capabilities += f"\n{agent_name}:\n"
            for cap in caps:
                capabilities += f"- {cap}\n"
        
        return capabilities
    
    def update_history(self, message: Message) -> None:
        """
        Update message history

        Args:
            message: Message to add to history
        """
        self.message_history.append(message.to_dict())
        
        # Trim history if needed
        if len(self.message_history) > self.max_history:
            self.message_history = self.message_history[-self.max_history:]
    
    def save_conversation(self, filename: Optional[str] = None) -> str:
        """
        Save conversation history to file

        Args:
            filename: Optional filename, if None a timestamp will be used

        Returns:
            Path to saved file
        """
        if not filename:
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            filename = f"conversation_{timestamp}.json"
        
        filepath = os.path.join(self.conversation_dir, filename)
        
        try:
            with open(filepath, 'w') as f:
                json.dump(self.message_history, f, indent=2)
            logger.info(f"Saved conversation to {filepath}")
            return filepath
        except Exception as e:
            logger.error(f"Error saving conversation: {str(e)}")
            return ""
    
    def load_conversation(self, filepath: str) -> bool:
        """
        Load conversation history from file

        Args:
            filepath: Path to conversation file

        Returns:
            True if successful, False otherwise
        """
        try:
            with open(filepath, 'r') as f:
                self.message_history = json.load(f)
            logger.info(f"Loaded conversation from {filepath}")
            return True
        except Exception as e:
            logger.error(f"Error loading conversation: {str(e)}")
            return False
    
    def run(self) -> None:
        """
        Run the coordinator message processing loop
        """
        self.running = True
        
        logger.info("Starting Lisa coordinator message processing")
        
        try:
            while self.running:
                # Process messages in priority queue
                if not self.priority_queue.empty():
                    priority, message = self.priority_queue.get()
                    
                    # Skip if sender or receiver is unknown and not user or coordinator
                    if message.sender != "user" and message.sender not in self.agents and message.sender != "coordinator":
                        logger.warning(f"Unknown sender: {message.sender}")
                        continue
                    
                    if message.receiver not in self.agents and message.receiver != "coordinator" and message.receiver != "user":
                        logger.warning(f"Unknown receiver: {message.receiver}")
                        continue
                    
                    # Process message
                    if message.receiver == "coordinator":
                        self._process_coordinator_message(message)
                    elif message.receiver == "user":
                        # Messages to user are handled outside the coordinator
                        # They would typically be processed by the CLI or API
                        pass
                    else:
                        # Get receiving agent
                        agent = self.agents[message.receiver]
                        
                        # Have agent process message
                        response = agent.process_message(message)
                        
                        # Add response to queue
                        self.send_message(response)
                
                # Sleep briefly to prevent CPU hogging
                time.sleep(0.01)
                
        except KeyboardInterrupt:
            logger.info("Coordinator stopped by user")
        except Exception as e:
            logger.error(f"Error in coordinator loop: {str(e)}")
        finally:
            # Clean up
            self.save_conversation("auto_save_on_exit.json")
            self.model_loader.clean_up()
            self.running = False


# For testing
if __name__ == "__main__":
    # Simple test
    coordinator = Coordinator()
    print("Lisa Coordinator initialized")
