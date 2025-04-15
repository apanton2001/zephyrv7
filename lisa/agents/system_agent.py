"""
System Agent Module for Lisa

This agent specializes in handling system operations, file management,
and resource monitoring using the system access module.
"""

import os
import re
import json
import logging
import time
from typing import Dict, List, Any, Optional, Tuple, Union
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import core modules
try:
    from ..core.coordinator import Agent, Message
    from ..core.model_loader import ModelLoader
    from ..core.system_access import SystemAccessManager
except ImportError:
    # Adjust import path if module is run directly
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from core.coordinator import Agent, Message
    from core.model_loader import ModelLoader
    from core.system_access import SystemAccessManager


class SystemAgent(Agent):
    """
    Agent responsible for system operations and resource monitoring
    """
    
    def __init__(self, name: str, model_name: str = "gpt-4", 
                 model_type: str = "openai", 
                 system_access: Optional[SystemAccessManager] = None,
                 **kwargs):
        """
        Initialize the system agent
        
        Args:
            name: Agent name
            model_name: Name of model to use
            model_type: Type of model (openai, llama, etc.)
            system_access: SystemAccessManager instance
            **kwargs: Additional configuration options
        """
        super().__init__(name, model_name, model_type)
        
        # Set up system message for system tasks
        self.system_message = """You are a helpful system assistant that specializes in:

1. Accessing and managing files and directories
2. Monitoring system resources and performance
3. Providing system information and diagnostics
4. Identifying and suggesting solutions for system issues
5. Organizing and searching files

Be precise and accurate in your operations on the system.
Always consider security and safety when performing system operations.
Provide clear explanations of what you find and actions you suggest.
"""
        
        # Set up template for LLM prompting
        self.prompt_template = """
{system_message}

# System Context:
Operating System: {os_info}
Working Directory: {working_dir}

# Conversation History:
{conversation_history}

# Current Request:
{current_message}

# Available System Operations:
- List files and directories
- Search for files
- Get system information
- Monitor resource usage
- Scan system health
- Read file content

Respond with a helpful, accurate, and security-conscious answer.
"""
        
        # Store system access manager
        self.system_access = system_access or SystemAccessManager()
        
        # System context cache to avoid repeated calls
        self._system_info_cache = None
        self._system_info_timestamp = 0
        self._cache_ttl = kwargs.get("cache_ttl", 300)  # 5 minutes default
        
        # Configure from kwargs
        self.max_history = kwargs.get("max_history", 10)
        self.cache_enabled = kwargs.get("cache_enabled", True)
        
        logger.info(f"System Agent {name} initialized")
    
    def initialize(self, model_loader: ModelLoader) -> bool:
        """
        Initialize the agent with the appropriate model
        
        Args:
            model_loader: ModelLoader instance to load the model
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if self.model_type.lower() == "openai":
                # For API-based models, we don't actually load them
                # but just verify configuration
                if not model_loader.clients.get(self.name):
                    # Register this agent's model in the loader
                    logger.info(f"Registered {self.name} with model {self.model_name}")
                return True
            
            elif self.model_type.lower() == "gguf":
                # Load local GGUF model
                self.model = model_loader.load_gguf_model(
                    model_path=self.model_name,
                    agent_name=self.name
                )
                logger.info(f"Loaded GGUF model for {self.name}")
                return True
                
            elif self.model_type.lower() == "hf":
                # Load Hugging Face model
                self.model, self.tokenizer = model_loader.load_hf_model(
                    model_name=self.model_name,
                    agent_name=self.name
                )
                logger.info(f"Loaded HF model for {self.name}")
                return True
                
            else:
                logger.error(f"Unsupported model type for {self.name}: {self.model_type}")
                return False
                
        except Exception as e:
            logger.error(f"Error initializing {self.name}: {str(e)}")
            return False
    
    def get_capabilities(self) -> List[str]:
        """
        Get agent capabilities for coordination
        
        Returns:
            List of capability strings
        """
        return [
            "system_info",
            "file_management",
            "resource_monitoring",
            "system_diagnostics",
            "file_search",
            "file_reading"
        ]
    
    def process_message(self, message: Message) -> Message:
        """
        Process a message and generate a response
        
        Args:
            message: Message to process
            
        Returns:
            Response message
        """
        # Update conversation history
        self.update_history(message)
        
        # Parse the message to determine the required action
        action, params = self._parse_action(message.content)
        
        try:
            # Handle different system actions
            if action == "list_files":
                response_text = self._handle_list_files(params)
            elif action == "search_files":
                response_text = self._handle_search_files(params)
            elif action == "system_info":
                response_text = self._handle_system_info()
            elif action == "monitor_resources":
                response_text = self._handle_monitor_resources()
            elif action == "scan_health":
                response_text = self._handle_scan_health()
            elif action == "read_file":
                response_text = self._handle_read_file(params)
            else:
                # Default to generating response with LLM
                response_text = self._generate_response(message)
            
            # Create response message
            response = Message(
                content=response_text,
                sender=self.name,
                receiver=message.sender,
                message_type="response"
            )
            
            # Update history with our response
            self.update_history(response)
            
            return response
            
        except Exception as e:
            logger.error(f"Error processing message in {self.name}: {str(e)}")
            
            # Return error message
            return Message(
                content=f"I encountered an error while processing your request: {str(e)}",
                sender=self.name,
                receiver=message.sender,
                message_type="error"
            )
    
    def _parse_action(self, message_content: str) -> Tuple[str, Dict[str, Any]]:
        """
        Parse message content to determine action and parameters
        
        Args:
            message_content: Message content string
            
        Returns:
            Tuple of (action, parameters)
        """
        content = message_content.lower()
        params = {}
        
        # File listing
        if re.search(r'(list|show|display).*files', content):
            action = "list_files"
            # Try to extract path
            path_match = re.search(r'in\s+(.+?)\s*$', content) or re.search(r'(?:directory|folder|path)[:\s]+([^\s,\.]+)', content)
            if path_match:
                params["path"] = path_match.group(1).strip('"\'')
            else:
                params["path"] = os.getcwd()
        
        # File search
        elif re.search(r'(search|find|locate).*files?', content):
            action = "search_files"
            # Try to extract query
            query_match = re.search(r'(?:for|named|containing)[:\s]+([^\s,\.]+)', content)
            if query_match:
                params["query"] = query_match.group(1).strip('"\'')
            else:
                params["query"] = ""
            
            # Try to extract path
            path_match = re.search(r'in\s+(.+?)\s*$', content)
            if path_match:
                params["path"] = path_match.group(1).strip('"\'')
        
        # System info
        elif re.search(r'(system|computer).*info', content) or "what system" in content:
            action = "system_info"
        
        # Resource monitoring
        elif re.search(r'(monitor|check|show).*(resource|cpu|memory|disk)', content):
            action = "monitor_resources"
        
        # System scan
        elif re.search(r'(scan|check|diagnose).*(system|health|issues|problems)', content):
            action = "scan_health"
        
        # Read file
        elif re.search(r'(read|open|show|display|cat).*(file|content)', content):
            action = "read_file"
            # Try to extract file path
            path_match = re.search(r'(?:file|path)[:\s]+([^\s,\.]+)', content) or re.search(r'(?:read|open|show|display|cat)\s+(.+?)\s*$', content)
            if path_match:
                params["path"] = path_match.group(1).strip('"\'')
            else:
                params["path"] = ""
        
        # Default LLM response
        else:
            action = "generate_response"
        
        return action, params
    
    def _handle_list_files(self, params: Dict[str, Any]) -> str:
        """
        Handle list files action
        
        Args:
            params: Action parameters
            
        Returns:
            Response text
        """
        path = params.get("path", os.getcwd())
        
        # List files using system access
        file_listing = self.system_access.list_files(path)
        
        # Check for errors
        if file_listing and "error" in file_listing[0]:
            return f"Error listing files: {file_listing[0]['error']}"
        
        # Format the response
        response_lines = [f"Contents of {path}:\n"]
        
        # Count files and directories
        dir_count = sum(1 for item in file_listing if item.get("is_dir", False))
        file_count = len(file_listing) - dir_count
        
        # Add summary
        response_lines.append(f"Found {len(file_listing)} items ({dir_count} directories, {file_count} files)\n")
        
        # Add directories first
        dirs = [item for item in file_listing if item.get("is_dir", False)]
        if dirs:
            response_lines.append("Directories:")
            for item in dirs:
                response_lines.append(f"📁 {item['name']}")
            response_lines.append("")
        
        # Add files
        files = [item for item in file_listing if not item.get("is_dir", False)]
        if files:
            response_lines.append("Files:")
            for item in files:
                size_str = f"({item['size'] / 1024:.1f} KB)" if "size" in item else ""
                response_lines.append(f"📄 {item['name']} {size_str}")
            response_lines.append("")
        
        return "\n".join(response_lines)
    
    def _handle_search_files(self, params: Dict[str, Any]) -> str:
        """
        Handle search files action
        
        Args:
            params: Action parameters
            
        Returns:
            Response text
        """
        query = params.get("query", "")
        path = params.get("path", os.path.expanduser("~"))
        
        if not query:
            return "Please provide a search query."
        
        # Search files using system access
        search_results = self.system_access.search_files(query, path)
        
        # Check for errors
        if search_results and "error" in search_results[0]:
            return f"Error searching files: {search_results[0]['error']}"
        
        # Format the response
        response_lines = [f"Search results for '{query}' in {path}:\n"]
        
        if not search_results:
            response_lines.append("No matching files found.")
        else:
            response_lines.append(f"Found {len(search_results)} matching files:\n")
            
            for item in search_results[:20]:  # Limit to 20 results
                path = item.get("path", "")
                modified = item.get("modified", "")
                size_str = f"({item.get('size', 0) / 1024:.1f} KB)" if "size" in item else ""
                
                response_lines.append(f"📄 {os.path.basename(path)}")
                response_lines.append(f"   Path: {path}")
                if modified:
                    response_lines.append(f"   Modified: {modified}")
                if size_str:
                    response_lines.append(f"   Size: {size_str}")
                response_lines.append("")
            
            if len(search_results) > 20:
                response_lines.append(f"...and {len(search_results) - 20} more files")
        
        return "\n".join(response_lines)
    
    def _handle_system_info(self) -> str:
        """
        Handle system info action
        
        Returns:
            Response text
        """
        # Check cache first
        current_time = time.time()
        if (self.cache_enabled and 
            self._system_info_cache and 
            current_time - self._system_info_timestamp < self._cache_ttl):
            
            return self._system_info_cache
        
        # Get system info using system access
        system_info = self.system_access.get_system_info()
        
        # Check for errors
        if "error" in system_info:
            return f"Error getting system information: {system_info['error']}"
        
        # Format the response
        response_lines = ["System Information:\n"]
        
        # Add system info
        for key, value in system_info.items():
            response_lines.append(f"{key.replace('_', ' ').title()}: {value}")
        
        response = "\n".join(response_lines)
        
        # Update cache
        if self.cache_enabled:
            self._system_info_cache = response
            self._system_info_timestamp = current_time
        
        return response
    
    def _handle_monitor_resources(self) -> str:
        """
        Handle resource monitoring action
        
        Returns:
            Response text
        """
        # Get resource usage using system access
        resource_usage = self.system_access.get_resource_usage()
        
        # Check for errors
        if "error" in resource_usage:
            return f"Error monitoring resources: {resource_usage['error']}"
        
        # Format the response
        response_lines = ["System Resource Usage:\n"]
        
        # Add CPU info
        response_lines.append(f"CPU Usage: {resource_usage.get('cpu_percent', 'N/A')}%")
        
        # Add memory info
        if "memory_total" in resource_usage and "memory_used" in resource_usage:
            response_lines.append(f"Memory: {resource_usage['memory_used']:.1f} GB / {resource_usage['memory_total']:.1f} GB ({resource_usage.get('memory_percent', 'N/A')}%)")
        
        # Add disk info
        if "disk_total" in resource_usage and "disk_used" in resource_usage:
            response_lines.append(f"Disk: {resource_usage['disk_used']:.1f} GB / {resource_usage['disk_total']:.1f} GB ({resource_usage.get('disk_percent', 'N/A')}%)")
        
        # Add network info
        if "network_up" in resource_usage and "network_down" in resource_usage:
            response_lines.append(f"Network: ↓ {resource_usage['network_down']:.1f} MB/s, ↑ {resource_usage['network_up']:.1f} MB/s")
        
        # Add top processes
        if "top_processes" in resource_usage and resource_usage["top_processes"]:
            response_lines.append("\nTop Processes:")
            for proc in resource_usage["top_processes"][:5]:  # Show top 5
                response_lines.append(f"- {proc.get('name', 'Unknown')}: CPU {proc.get('cpu', 'N/A')}%, Memory {proc.get('memory', 'N/A')} MB")
        
        return "\n".join(response_lines)
    
    def _handle_scan_health(self) -> str:
        """
        Handle system health scan action
        
        Returns:
            Response text
        """
        # Scan system health using system access
        issues = self.system_access.scan_system_health()
        
        # Check for errors
        if issues and "error" in issues[0]:
            return f"Error scanning system health: {issues[0]['error']}"
        
        # Format the response
        if not issues:
            return "System Health Scan: No issues detected. Your system appears to be running normally."
        
        response_lines = ["System Health Scan Results:\n"]
        
        # Count issues by severity
        high_count = sum(1 for issue in issues if issue.get("severity") == "high")
        medium_count = sum(1 for issue in issues if issue.get("severity") == "medium")
        low_count = sum(1 for issue in issues if issue.get("severity") == "low")
        
        # Add summary
        response_lines.append(f"Found {len(issues)} potential issues:")
        response_lines.append(f"- High Severity: {high_count}")
        response_lines.append(f"- Medium Severity: {medium_count}")
        response_lines.append(f"- Low Severity: {low_count}")
        response_lines.append("")
        
        # Add issues grouped by severity
        if high_count > 0:
            response_lines.append("High Severity Issues:")
            for issue in issues:
                if issue.get("severity") == "high":
                    response_lines.append(f"- {issue.get('description', 'Unknown issue')}")
                    if "recommendation" in issue:
                        response_lines.append(f"  Recommendation: {issue['recommendation']}")
            response_lines.append("")
        
        if medium_count > 0:
            response_lines.append("Medium Severity Issues:")
            for issue in issues:
                if issue.get("severity") == "medium":
                    response_lines.append(f"- {issue.get('description', 'Unknown issue')}")
                    if "recommendation" in issue:
                        response_lines.append(f"  Recommendation: {issue['recommendation']}")
            response_lines.append("")
            
        if low_count > 0:
            response_lines.append("Low Severity Issues:")
            for issue in issues:
                if issue.get("severity") == "low":
                    response_lines.append(f"- {issue.get('description', 'Unknown issue')}")
                    if "recommendation" in issue:
                        response_lines.append(f"  Recommendation: {issue['recommendation']}")
        
        return "\n".join(response_lines)
    
    def _handle_read_file(self, params: Dict[str, Any]) -> str:
        """
        Handle read file action
        
        Args:
            params: Action parameters
            
        Returns:
            Response text
        """
        path = params.get("path", "")
        
        if not path:
            return "Please provide a file path to read."
        
        # Read file using system access
        file_data = self.system_access.read_file_content(path)
        
        # Check for errors
        if "error" in file_data:
            return f"Error reading file: {file_data['error']}"
        
        # Format the response
        response_lines = [f"Contents of {path}:\n"]
        
        # Add file info
        if "size" in file_data:
            response_lines.append(f"Size: {file_data['size'] / 1024:.1f} KB")
        if "modified" in file_data:
            response_lines.append(f"Last Modified: {file_data['modified']}")
        if "encoding" in file_data:
            response_lines.append(f"Encoding: {file_data['encoding']}")
        
        response_lines.append("\n--- File Content ---\n")
        
        # Add file content, handling binary files
        if file_data.get("encoding") == "binary":
            response_lines.append("[Binary file content - showing hex representation of first 1024 bytes]")
            response_lines.append(file_data.get("content", ""))
        else:
            content = file_data.get("content", "")
            # Truncate very large files for readability
            if len(content) > 10000:
                response_lines.append(content[:10000])
                response_lines.append("\n[File content truncated due to size]")
            else:
                response_lines.append(content)
        
        return "\n".join(response_lines)
    
    def _generate_response(self, message: Message) -> str:
        """
        Generate a response using LLM
        
        Args:
            message: Message to respond to
            
        Returns:
            Generated response text
        """
        # For now, return a placeholder
        # In a full implementation, this would use the LLM to generate a response
        return "I understand you want to know about the system, but I'm not sure what specific information you're looking for. Would you like me to show you:\n\n1. System information\n2. Current resource usage\n3. List files in a directory\n4. Search for files\n5. Check system health\n\nPlease let me know which option you prefer or provide more details about what you're looking for."
        
    def get_prompt(self, message: Message) -> str:
        """
        Generate prompt from message and conversation history
        
        Args:
            message: Current message
            
        Returns:
            Complete prompt for the model
        """
        # Format conversation history
        history_text = ""
        for i, hist_msg in enumerate(self.conversation_history[-self.max_history:]):
            role = "User" if hist_msg["sender"] == "user" else "Assistant"
            history_text += f"{role}: {hist_msg['content']}\n\n"
        
        # Get basic OS info
        os_info = f"{os.name} {platform.system()} {platform.release()}"
        working_dir = os.getcwd()
        
        # Format prompt
        prompt = self.prompt_template.format(
            system_message=self.system_message,
            os_info=os_info,
            working_dir=working_dir,
            conversation_history=history_text,
            current_message=message.content
        )
        
        return prompt
