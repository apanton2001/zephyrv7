"""
Outreach Agent Module

This module implements the Outreach Agent, which specializes in handling
client communications, outreach tracking, and relationship management.
"""

import os
import json
import logging
import time
from typing import Dict, List, Any, Optional, Tuple, Union
import re
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import local modules
try:
    from ..core.coordinator import Agent, Message
    from ..core.model_loader import ModelLoader
except ImportError:
    # Adjust import path if module is run directly
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from core.coordinator import Agent, Message
    from core.model_loader import ModelLoader


class OutreachAgent(Agent):
    """
    Agent specializing in client communications and outreach management
    """
    
    def __init__(self, name: str, model_name: str = "Nous-Hermes-2-SOLAR-10.7B-GGUF", 
                 model_type: str = "gguf", **kwargs):
        """
        Initialize the outreach agent

        Args:
            name: Agent name
            model_name: Name of model to use
            model_type: Type of model (gguf or hf)
            **kwargs: Additional configuration options
        """
        super().__init__(name, model_name, model_type)
        
        # Set up system message for outreach tasks
        self.system_message = """You are a professional outreach assistant specializing in client communications, 
relationship management, and business development. Your responsibilities include:

1. Drafting professional emails and messages for clients
2. Tracking client interactions and relationship status
3. Suggesting follow-up actions and communication strategies
4. Creating templates for various outreach scenarios
5. Analyzing communication patterns and client responses

You should maintain a professional, courteous tone while being clear and concise.
Ensure communications are well-structured, grammatically correct, and appropriate for the context.
Always respect privacy and confidentiality of client information.
"""
        
        # Set up template for LLM prompting
        self.prompt_template = """
{system_message}

# Conversation History:
{conversation_history}

# Current Request:
{current_message}

# Task:
{specific_task}

Respond with a professional, helpful solution that addresses the request.
"""
        
        # Setup client database path
        self.clients_db_path = os.path.join(os.getcwd(), "data", "clients.json")
        
        # Load client data if exists
        self.clients = self._load_clients()
        
        # Configure from kwargs
        self.max_history = kwargs.get("max_history", 10)
        self.context_length = kwargs.get("context_length", 2048)
        self.temperature = kwargs.get("temperature", 0.7)
        self.top_p = kwargs.get("top_p", 0.9)
    
    def initialize(self, model_loader: ModelLoader) -> bool:
        """
        Initialize the agent with the appropriate model

        Args:
            model_loader: ModelLoader instance to load the model

        Returns:
            True if successful, False otherwise
        """
        try:
            if self.model_type.lower() == "gguf":
                # Load GGUF model
                self.model = model_loader.load_gguf_model(
                    model_path=self.model_name,
                    agent_name=self.name,
                    n_ctx=self.context_length
                )
                logger.info(f"Loaded GGUF model for {self.name}")
                return True
            else:
                # Load Hugging Face model
                self.model, self.tokenizer = model_loader.load_hf_model(
                    model_name=self.model_name,
                    agent_name=self.name,
                    quantization="4bit"
                )
                logger.info(f"Loaded HF model for {self.name}")
                return True
                
        except Exception as e:
            logger.error(f"Error initializing {self.name}: {str(e)}")
            return False
    
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
        
        # Determine specific task based on message content
        specific_task = self._determine_task(message.content)
        
        # Generate prompt
        prompt = self.get_prompt(message, specific_task)
        
        try:
            # Generate response
            if self.model_type.lower() == "gguf":
                # Generate with GGUF model
                response_text = self._generate_gguf(prompt)
            else:
                # Generate with HF model
                response_text = self._generate_hf(prompt)
            
            # Process any action directives in the response
            response_text, actions_taken = self._process_actions(response_text, message)
            
            # Create response message
            response = Message(
                content=response_text,
                sender=self.name,
                receiver=message.sender,
                message_type="response",
                metadata={"actions": actions_taken} if actions_taken else {}
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
    
    def get_prompt(self, message: Message, specific_task: str = "") -> str:
        """
        Generate prompt from message and conversation history

        Args:
            message: Current message
            specific_task: Specific task description

        Returns:
            Complete prompt for the model
        """
        # Format conversation history
        history_text = ""
        for i, hist_msg in enumerate(self.conversation_history[-self.max_history:-1]):
            role = "User" if hist_msg["sender"] == "user" else "Assistant"
            history_text += f"{role}: {hist_msg['content']}\n\n"
        
        # Format prompt
        prompt = self.prompt_template.format(
            system_message=self.system_message,
            conversation_history=history_text,
            current_message=message.content,
            specific_task=specific_task
        )
        
        return prompt
    
    def _determine_task(self, message_content: str) -> str:
        """
        Determine the specific task based on message content

        Args:
            message_content: Message content

        Returns:
            Task description string
        """
        content = message_content.lower()
        
        if "draft" in content and any(word in content for word in ["email", "message"]):
            return "Draft a professional email or message based on the provided information."
        
        elif any(word in content for word in ["template", "create template"]):
            return "Create a reusable communication template for the specified scenario."
        
        elif any(word in content for word in ["follow-up", "follow up", "followup"]):
            return "Suggest an appropriate follow-up action or message."
        
        elif any(word in content for word in ["schedule", "meeting", "appointment"]):
            return "Help with scheduling or creating a meeting invitation."
        
        elif any(word in content for word in ["track", "interaction", "status"]):
            return "Track or report on client interactions and status."
        
        elif any(word in content for word in ["analyze", "pattern", "response"]):
            return "Analyze communication patterns or client responses."
        
        else:
            return "Provide assistance with client communication or outreach tasks."
    
    def _generate_gguf(self, prompt: str) -> str:
        """
        Generate text using a GGUF model

        Args:
            prompt: Prompt text

        Returns:
            Generated text
        """
        # Define generation parameters
        params = {
            "max_tokens": 1024,
            "temperature": self.temperature,
            "top_p": self.top_p,
            "stop": ["User:", "\n\nUser:"]
        }
        
        # Generate
        result = self.model(prompt, **params)
        
        # Extract and clean response
        response = result["choices"][0]["text"].strip()
        
        # Remove any leading "Assistant:" if present
        response = re.sub(r"^Assistant:\s*", "", response)
        
        return response
    
    def _generate_hf(self, prompt: str) -> str:
        """
        Generate text using a Hugging Face model

        Args:
            prompt: Prompt text

        Returns:
            Generated text
        """
        import torch
        
        # Tokenize
        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)
        
        # Generate
        with torch.no_grad():
            outputs = self.model.generate(
                inputs.input_ids,
                max_new_tokens=1024,
                temperature=self.temperature,
                top_p=self.top_p,
                do_sample=True,
                pad_token_id=self.tokenizer.eos_token_id,
            )
        
        # Decode
        full_response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Extract only the new content (after the prompt)
        response = full_response[len(prompt):].strip()
        
        # Remove any leading "Assistant:" if present
        response = re.sub(r"^Assistant:\s*", "", response)
        
        return response
    
    def _process_actions(self, response_text: str, message: Message) -> Tuple[str, List[Dict]]:
        """
        Process any action directives in the response

        Args:
            response_text: Model-generated response
            message: Original message

        Returns:
            Tuple of (processed_text, list_of_actions_taken)
        """
        actions_taken = []
        processed_text = response_text
        
        # Look for action directives
        action_matches = re.findall(r"\[ACTION:([^\]]+)\]", response_text)
        
        for action in action_matches:
            action = action.strip()
            
            # Process based on action type
            if action.startswith("SAVE_CLIENT"):
                # Format: SAVE_CLIENT:name:email:status
                parts = action.split(":")
                if len(parts) >= 4:
                    client_name = parts[1].strip()
                    client_email = parts[2].strip()
                    client_status = parts[3].strip()
                    
                    # Save client info
                    self._save_client(client_name, client_email, client_status)
                    
                    actions_taken.append({
                        "type": "save_client",
                        "client": client_name,
                        "email": client_email,
                        "status": client_status
                    })
            
            elif action.startswith("SCHEDULE_FOLLOWUP"):
                # Format: SCHEDULE_FOLLOWUP:client:days:type
                parts = action.split(":")
                if len(parts) >= 4:
                    client_name = parts[1].strip()
                    days = int(parts[2].strip())
                    followup_type = parts[3].strip()
                    
                    # Schedule follow-up
                    self._schedule_followup(client_name, days, followup_type)
                    
                    actions_taken.append({
                        "type": "schedule_followup",
                        "client": client_name,
                        "days": days,
                        "followup_type": followup_type
                    })
            
            elif action.startswith("LOG_INTERACTION"):
                # Format: LOG_INTERACTION:client:type:summary
                parts = action.split(":")
                if len(parts) >= 4:
                    client_name = parts[1].strip()
                    interaction_type = parts[2].strip()
                    summary = ":".join(parts[3:]).strip()  # Join back in case summary contains ":"
                    
                    # Log interaction
                    self._log_interaction(client_name, interaction_type, summary)
                    
                    actions_taken.append({
                        "type": "log_interaction",
                        "client": client_name,
                        "interaction_type": interaction_type,
                        "summary": summary
                    })
        
        # Remove action directives from response
        processed_text = re.sub(r"\[ACTION:[^\]]+\]", "", processed_text).strip()
        
        return processed_text, actions_taken
    
    def _load_clients(self) -> Dict[str, Dict[str, Any]]:
        """
        Load client data from file

        Returns:
            Dictionary of client data
        """
        if os.path.exists(self.clients_db_path):
            try:
                with open(self.clients_db_path, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error loading client data: {str(e)}")
        
        # Return empty dict if no data or error
        return {}
    
    def _save_clients(self) -> bool:
        """
        Save client data to file

        Returns:
            True if successful, False otherwise
        """
        try:
            # Ensure directory exists
            os.makedirs(os.path.dirname(self.clients_db_path), exist_ok=True)
            
            with open(self.clients_db_path, 'w') as f:
                json.dump(self.clients, f, indent=2)
            
            return True
        except Exception as e:
            logger.error(f"Error saving client data: {str(e)}")
            return False
    
    def _save_client(self, name: str, email: str, status: str) -> bool:
        """
        Save or update client information

        Args:
            name: Client name
            email: Client email
            status: Client status

        Returns:
            True if successful, False otherwise
        """
        # Create client entry if it doesn't exist
        if name not in self.clients:
            self.clients[name] = {
                "email": email,
                "status": status,
                "created_date": datetime.now().isoformat(),
                "last_updated": datetime.now().isoformat(),
                "interactions": [],
                "followups": []
            }
        else:
            # Update existing client
            self.clients[name]["email"] = email
            self.clients[name]["status"] = status
            self.clients[name]["last_updated"] = datetime.now().isoformat()
        
        # Save to file
        return self._save_clients()
    
    def _schedule_followup(self, client_name: str, days: int, followup_type: str) -> bool:
        """
        Schedule a follow-up for a client

        Args:
            client_name: Client name
            days: Days from now for follow-up
            followup_type: Type of follow-up

        Returns:
            True if successful, False otherwise
        """
        # Check if client exists
        if client_name not in self.clients:
            logger.warning(f"Cannot schedule follow-up - client not found: {client_name}")
            return False
        
        # Calculate follow-up date
        followup_date = (datetime.now() + timedelta(days=days)).isoformat()
        
        # Add follow-up
        followup = {
            "date": followup_date,
            "type": followup_type,
            "status": "pending",
            "created": datetime.now().isoformat()
        }
        
        self.clients[client_name]["followups"].append(followup)
        self.clients[client_name]["last_updated"] = datetime.now().isoformat()
        
        # Save to file
        return self._save_clients()
    
    def _log_interaction(self, client_name: str, interaction_type: str, summary: str) -> bool:
        """
        Log a client interaction

        Args:
            client_name: Client name
            interaction_type: Type of interaction
            summary: Interaction summary

        Returns:
            True if successful, False otherwise
        """
        # Check if client exists
        if client_name not in self.clients:
            logger.warning(f"Cannot log interaction - client not found: {client_name}")
            return False
        
        # Create interaction entry
        interaction = {
            "date": datetime.now().isoformat(),
            "type": interaction_type,
            "summary": summary
        }
        
        # Add to client's interactions
        self.clients[client_name]["interactions"].append(interaction)
        self.clients[client_name]["last_updated"] = datetime.now().isoformat()
        
        # Save to file
        return self._save_clients()
    
    def get_client_info(self, client_name: str) -> Optional[Dict[str, Any]]:
        """
        Get information about a specific client

        Args:
            client_name: Client name

        Returns:
            Client information dictionary or None if not found
        """
        return self.clients.get(client_name)
    
    def get_pending_followups(self, days: int = 7) -> List[Dict[str, Any]]:
        """
        Get list of pending follow-ups within the specified days

        Args:
            days: Number of days to look ahead

        Returns:
            List of follow-up dictionaries
        """
        cutoff = datetime.now() + timedelta(days=days)
        pending = []
        
        for client_name, client_data in self.clients.items():
            for followup in client_data.get("followups", []):
                if followup.get("status") == "pending":
                    followup_date = datetime.fromisoformat(followup["date"])
                    if followup_date <= cutoff:
                        # Add client info to followup
                        followup_with_client = followup.copy()
                        followup_with_client["client_name"] = client_name
                        followup_with_client["client_email"] = client_data.get("email")
                        pending.append(followup_with_client)
        
        # Sort by date
        pending.sort(key=lambda x: x["date"])
        
        return pending
    
    def search_clients(self, query: str) -> List[Dict[str, Any]]:
        """
        Search for clients matching the query

        Args:
            query: Search query

        Returns:
            List of matching client dictionaries
        """
        results = []
        query = query.lower()
        
        for client_name, client_data in self.clients.items():
            # Search in name, email, status, and interactions
            if (query in client_name.lower() or
                query in client_data.get("email", "").lower() or
                query in client_data.get("status", "").lower() or
                any(query in interaction.get("summary", "").lower() 
                    for interaction in client_data.get("interactions", []))):
                
                # Add client to results
                client_with_name = client_data.copy()
                client_with_name["name"] = client_name
                results.append(client_with_name)
        
        return results
