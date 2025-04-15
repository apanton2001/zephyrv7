"""
LLM Connector Module for Lisa

This module enables Lisa to connect to and leverage multiple LLM models,
facilitating communication between different AI systems, comparing responses,
and making consensus-based decisions.
"""

import os
import re
import json
import time
import logging
import requests
import hashlib
import asyncio
from typing import Dict, List, Any, Optional, Tuple, Union, Callable
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class LLMConnector:
    """
    Manages connections to various LLM models and services
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize LLM connector
        
        Args:
            config: Configuration dictionary with LLM connection settings
        """
        # Default configuration
        self.default_config = {
            "models": {},
            "cache_directory": "",
            "cache_enabled": True,
            "cache_ttl": 3600,  # 1 hour
            "default_timeout": 30,
            "max_retries": 2,
            "retry_delay": 1,
            "consensus_threshold": 0.7,
            "compare_method": "semantic"  # or "exact", "hybrid"
        }
        
        # Override defaults with provided config
        self.config = self.default_config.copy()
        if config:
            self.config.update(config)
            
            # Ensure models is a dictionary
            if "models" in config and not isinstance(config["models"], dict):
                self.config["models"] = {}
        
        # Set up cache directory
        if not self.config["cache_directory"]:
            self.config["cache_directory"] = os.path.join(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                "data",
                "llm_cache"
            )
        
        os.makedirs(self.config["cache_directory"], exist_ok=True)
        
        # Initialize client connections
        self.clients = {}
        self.connected_models = {}
        
        # Initialize cache
        self.response_cache = {}
        self.load_cache()
        
        # LLM session history
        self.session_history = {}
        
        logger.info("LLM Connector initialized")
    
    def load_cache(self) -> bool:
        """
        Load cached LLM responses from disk
        
        Returns:
            True if successful, False otherwise
        """
        if not self.config["cache_enabled"]:
            return False
            
        cache_path = os.path.join(self.config["cache_directory"], "response_cache.json")
        if not os.path.exists(cache_path):
            return False
            
        try:
            with open(cache_path, 'r') as f:
                cache_data = json.load(f)
            
            # Convert string timestamps back to float
            for key, entry in cache_data.items():
                entry["timestamp"] = float(entry["timestamp"])
            
            self.response_cache = cache_data
            
            # Clean expired cache entries
            self._clean_cache()
            
            logger.info(f"Loaded {len(self.response_cache)} cached LLM responses")
            return True
        except Exception as e:
            logger.error(f"Error loading LLM cache: {str(e)}")
            return False
    
    def save_cache(self) -> bool:
        """
        Save cached LLM responses to disk
        
        Returns:
            True if successful, False otherwise
        """
        if not self.config["cache_enabled"]:
            return False
            
        cache_path = os.path.join(self.config["cache_directory"], "response_cache.json")
        
        try:
            # Clean expired entries before saving
            self._clean_cache()
            
            with open(cache_path, 'w') as f:
                json.dump(self.response_cache, f)
                
            logger.info(f"Saved {len(self.response_cache)} cached LLM responses")
            return True
        except Exception as e:
            logger.error(f"Error saving LLM cache: {str(e)}")
            return False
    
    def _clean_cache(self) -> None:
        """
        Clean expired cache entries
        """
        current_time = time.time()
        ttl = self.config["cache_ttl"]
        
        # Find expired keys
        expired_keys = []
        for key, entry in self.response_cache.items():
            if current_time - entry["timestamp"] > ttl:
                expired_keys.append(key)
        
        # Remove expired entries
        for key in expired_keys:
            del self.response_cache[key]
            
        logger.debug(f"Cleaned {len(expired_keys)} expired cache entries")
    
    def _get_cache_key(self, model_name: str, query: str, context: Optional[str] = None) -> str:
        """
        Generate a cache key for a query
        
        Args:
            model_name: Name of the model
            query: Query string
            context: Optional context string
            
        Returns:
            Cache key string
        """
        # Combine all inputs
        combined = f"{model_name}:{query}"
        if context:
            combined += f":{context}"
            
        # Generate hash
        return hashlib.md5(combined.encode('utf-8')).hexdigest()
    
    def add_model(self, model_name: str, model_type: str, connection_params: Dict[str, Any]) -> bool:
        """
        Add a new LLM model to the configuration
        
        Args:
            model_name: Unique name for the model
            model_type: Type of model (openai, llama, huggingface, etc.)
            connection_params: Connection parameters specific to the model type
            
        Returns:
            True if successful, False otherwise
        """
        if model_name in self.config["models"]:
            logger.warning(f"Model {model_name} already exists. Use update_model to modify.")
            return False
        
        # Validate model type
        valid_types = ["openai", "anthropic", "llama", "huggingface", "ollama", "local", "palm", "cohere", "custom"]
        if model_type not in valid_types:
            logger.error(f"Invalid model type: {model_type}. Must be one of {valid_types}")
            return False
        
        # Add model to config
        self.config["models"][model_name] = {
            "type": model_type,
            "connection": connection_params,
            "enabled": True,
            "added_at": time.time()
        }
        
        logger.info(f"Added model {model_name} of type {model_type}")
        return True
    
    def update_model(self, model_name: str, model_type: Optional[str] = None, 
                    connection_params: Optional[Dict[str, Any]] = None, 
                    enabled: Optional[bool] = None) -> bool:
        """
        Update an existing LLM model's configuration
        
        Args:
            model_name: Name of model to update
            model_type: Optional new model type
            connection_params: Optional new connection parameters
            enabled: Optional flag to enable/disable the model
            
        Returns:
            True if successful, False otherwise
        """
        if model_name not in self.config["models"]:
            logger.error(f"Model {model_name} not found. Use add_model to add a new model.")
            return False
        
        model_config = self.config["models"][model_name]
        
        # Update type if provided and valid
        if model_type is not None:
            valid_types = ["openai", "anthropic", "llama", "huggingface", "ollama", "local", "palm", "cohere", "custom"]
            if model_type not in valid_types:
                logger.error(f"Invalid model type: {model_type}. Must be one of {valid_types}")
                return False
            model_config["type"] = model_type
        
        # Update connection params if provided
        if connection_params is not None:
            model_config["connection"].update(connection_params)
        
        # Update enabled flag if provided
        if enabled is not None:
            model_config["enabled"] = enabled
        
        # Ensure model is disconnected if it was previously connected
        if model_name in self.connected_models:
            self.disconnect_from_model(model_name)
        
        logger.info(f"Updated model {model_name}")
        return True
    
    def remove_model(self, model_name: str) -> bool:
        """
        Remove an LLM model from the configuration
        
        Args:
            model_name: Name of model to remove
            
        Returns:
            True if successful, False otherwise
        """
        if model_name not in self.config["models"]:
            logger.error(f"Model {model_name} not found")
            return False
        
        # Ensure model is disconnected if it was connected
        if model_name in self.connected_models:
            self.disconnect_from_model(model_name)
        
        # Remove from config
        del self.config["models"][model_name]
        
        logger.info(f"Removed model {model_name}")
        return True
    
    def list_available_models(self) -> List[Dict[str, Any]]:
        """
        List all available models
        
        Returns:
            List of model information dictionaries
        """
        model_list = []
        
        for name, config in self.config["models"].items():
            model_info = {
                "name": name,
                "type": config["type"],
                "enabled": config.get("enabled", True),
                "connected": name in self.connected_models
            }
            # Add any additional info from the model itself
            if name in self.connected_models:
                model_info.update(self.connected_models[name])
            
            model_list.append(model_info)
        
        # Sort by connection status (connected first), then name
        model_list.sort(key=lambda x: (not x["connected"], x["name"]))
        
        return model_list
    
    def connect_to_model(self, model_name: str) -> bool:
        """
        Connect to a specific LLM model
        
        Args:
            model_name: Name of the model to connect to
            
        Returns:
            True if successful, False otherwise
        """
        # Check if model exists and is enabled
        if model_name not in self.config["models"]:
            logger.error(f"Model {model_name} not found")
            return False
        
        model_config = self.config["models"][model_name]
        if not model_config.get("enabled", True):
            logger.error(f"Model {model_name} is disabled")
            return False
        
        # Check if already connected
        if model_name in self.connected_models:
            logger.info(f"Already connected to {model_name}")
            return True
        
        # Connect based on model type
        model_type = model_config["type"]
        connection_params = model_config["connection"]
        
        try:
            if model_type == "openai":
                success = self._connect_openai(model_name, connection_params)
            elif model_type == "anthropic":
                success = self._connect_anthropic(model_name, connection_params)
            elif model_type == "llama":
                success = self._connect_llama(model_name, connection_params)
            elif model_type == "huggingface":
                success = self._connect_huggingface(model_name, connection_params)
            elif model_type == "ollama":
                success = self._connect_ollama(model_name, connection_params)
            elif model_type == "local":
                success = self._connect_local(model_name, connection_params)
            elif model_type == "palm":
                success = self._connect_palm(model_name, connection_params)
            elif model_type == "cohere":
                success = self._connect_cohere(model_name, connection_params)
            elif model_type == "custom":
                success = self._connect_custom(model_name, connection_params)
            else:
                logger.error(f"Unsupported model type: {model_type}")
                return False
            
            if success:
                logger.info(f"Connected to {model_name}")
                # Initialize session history for this model
                self.session_history[model_name] = []
                return True
            else:
                logger.error(f"Failed to connect to {model_name}")
                return False
            
        except Exception as e:
            logger.error(f"Error connecting to {model_name}: {str(e)}")
            return False
    
    def disconnect_from_model(self, model_name: str) -> bool:
        """
        Disconnect from a specific LLM model
        
        Args:
            model_name: Name of the model to disconnect from
            
        Returns:
            True if successful, False otherwise
        """
        # Check if model is connected
        if model_name not in self.connected_models:
            logger.info(f"Model {model_name} is not connected")
            return True
        
        try:
            # Get model type
            model_type = self.config["models"][model_name]["type"]
            
            # Disconnect based on model type
            if model_type == "openai":
                success = self._disconnect_openai(model_name)
            elif model_type == "anthropic":
                success = self._disconnect_anthropic(model_name)
            elif model_type == "llama":
                success = self._disconnect_llama(model_name)
            elif model_type == "huggingface":
                success = self._disconnect_huggingface(model_name)
            elif model_type == "ollama":
                success = self._disconnect_ollama(model_name)
            elif model_type == "local":
                success = self._disconnect_local(model_name)
            elif model_type == "palm":
                success = self._disconnect_palm(model_name)
            elif model_type == "cohere":
                success = self._disconnect_cohere(model_name)
            elif model_type == "custom":
                success = self._disconnect_custom(model_name)
            else:
                logger.error(f"Unsupported model type: {model_type}")
                return False
            
            if success:
                # Remove from connected models list
                del self.connected_models[model_name]
                # Clear session history
                if model_name in self.session_history:
                    del self.session_history[model_name]
                logger.info(f"Disconnected from {model_name}")
                return True
            else:
                logger.error(f"Failed to disconnect from {model_name}")
                return False
            
        except Exception as e:
            logger.error(f"Error disconnecting from {model_name}: {str(e)}")
            # Force removal from connected models
            if model_name in self.connected_models:
                del self.connected_models[model_name]
            if model_name in self.session_history:
                del self.session_history[model_name]
            return False
    
    def query_models(self, query: str, models: Optional[List[str]] = None,
                    context: Optional[str] = None, use_cache: bool = True) -> Dict[str, str]:
        """
        Query multiple LLM models and get their responses
        
        Args:
            query: Query string to send to models
            models: List of model names to query (None for all connected models)
            context: Optional context to include with the query
            use_cache: Whether to use cached responses
            
        Returns:
            Dictionary mapping model names to their responses
        """
        results = {}
        
        # Determine which models to query
        if models is None:
            models = list(self.connected_models.keys())
        else:
            # Filter to only include connected models
            models = [model for model in models if model in self.connected_models]
        
        if not models:
            logger.warning("No connected models to query")
            return results
        
        # Query each model
        for model_name in models:
            try:
                # Check cache first if enabled
                if use_cache and self.config["cache_enabled"]:
                    cache_key = self._get_cache_key(model_name, query, context)
                    cached_response = self.response_cache.get(cache_key)
                    
                    if cached_response and (time.time() - cached_response["timestamp"] <= self.config["cache_ttl"]):
                        results[model_name] = cached_response["response"]
                        logger.debug(f"Using cached response for {model_name}")
                        continue
                
                # Get model type
                model_type = self.config["models"][model_name]["type"]
                
                # Query based on model type
                if model_type == "openai":
                    response = self._query_openai(model_name, query, context)
                elif model_type == "anthropic":
                    response = self._query_anthropic(model_name, query, context)
                elif model_type == "llama":
                    response = self._query_llama(model_name, query, context)
                elif model_type == "huggingface":
                    response = self._query_huggingface(model_name, query, context)
                elif model_type == "ollama":
                    response = self._query_ollama(model_name, query, context)
                elif model_type == "local":
                    response = self._query_local(model_name, query, context)
                elif model_type == "palm":
                    response = self._query_palm(model_name, query, context)
                elif model_type == "cohere":
                    response = self._query_cohere(model_name, query, context)
                elif model_type == "custom":
                    response = self._query_custom(model_name, query, context)
                else:
                    logger.error(f"Unsupported model type: {model_type}")
                    results[model_name] = "Error: Unsupported model type"
                    continue
                
                # Add to results
                results[model_name] = response
                
                # Add to session history
                if model_name in self.session_history:
                    self.session_history[model_name].append({
                        "role": "user",
                        "content": query,
                        "timestamp": time.time()
                    })
                    self.session_history[model_name].append({
                        "role": "assistant",
                        "content": response,
                        "timestamp": time.time()
                    })
                
                # Cache the response if enabled
                if self.config["cache_enabled"]:
                    cache_key = self._get_cache_key(model_name, query, context)
                    self.response_cache[cache_key] = {
                        "response": response,
                        "timestamp": time.time(),
                        "model": model_name
                    }
                
            except Exception as e:
                logger.error(f"Error querying {model_name}: {str(e)}")
                results[model_name] = f"Error: {str(e)}"
        
        # Save updated cache
        if self.config["cache_enabled"]:
            self.save_cache()
        
        return results
    
    def compare_responses(self, query: str, models: Optional[List[str]] = None,
                         context: Optional[str] = None) -> Dict[str, Any]:
        """
        Compare responses from multiple models and analyze consensus
        
        Args:
            query: Query string to send to models
            models: List of model names to query (None for all connected models)
            context: Optional context to include with the query
            
        Returns:
            Dictionary with comparison results and analysis
        """
        # Get responses from all models
        responses = self.query_models(query, models, context)
        
        if len(responses) <= 1:
            return {
                "query": query,
                "models": list(responses.keys()),
                "responses": responses,
                "consensus": None,
                "agreement_level": 0,
                "analysis": "Insufficient models to perform comparison"
            }
        
        # Different comparison methods
        comparison_method = self.config.get("compare_method", "semantic")
        
        if comparison_method == "exact":
            consensus, agreement = self._compare_exact(responses)
        elif comparison_method == "semantic":
            consensus, agreement = self._compare_semantic(responses)
        elif comparison_method == "hybrid":
            consensus, agreement = self._compare_hybrid(responses)
        else:
            consensus, agreement = self._compare_semantic(responses)  # Default to semantic
        
        # Generate analysis
        analysis = self._generate_comparison_analysis(responses, consensus, agreement)
        
        return {
            "query": query,
            "models": list(responses.keys()),
            "responses": responses,
            "consensus": consensus,
            "agreement_level": agreement,
            "analysis": analysis
        }
    
    def _compare_exact(self, responses: Dict[str, str]) -> Tuple[Optional[str], float]:
        """
        Compare responses using exact match
        
        Args:
            responses: Dictionary of model responses
            
        Returns:
            Tuple of (consensus response, agreement level)
        """
        if not responses:
            return None, 0.0
        
        # Count occurrences of each unique response
        response_counts = {}
        for model, response in responses.items():
            normalized = response.strip()
            response_counts[normalized] = response_counts.get(normalized, 0) + 1
        
        # Find the most common response
        max_count = 0
        consensus = None
        for response, count in response_counts.items():
            if count > max_count:
                max_count = count
                consensus = response
        
        # Calculate agreement level
        agreement = max_count / len(responses) if responses else 0
        
        return consensus, agreement
    
    def _compare_semantic(self, responses: Dict[str, str]) -> Tuple[Optional[str], float]:
        """
        Compare responses using semantic similarity
        
        Args:
            responses: Dictionary of model responses
            
        Returns:
            Tuple of (consensus response, agreement level)
        """
        # This is a simplified implementation
        # In a real system, you would use embeddings to measure semantic similarity
        
        # For now, fall back to exact match as a simple approximation
        return self._compare_exact(responses)
    
    def _compare_hybrid(self, responses: Dict[str, str]) -> Tuple[Optional[str], float]:
        """
        Compare responses using a hybrid of exact and semantic comparison
        
        Args:
            responses: Dictionary of model responses
            
        Returns:
            Tuple of (consensus response, agreement level)
        """
        # This is a simplified implementation
        # In a real system, you would use a more sophisticated approach
        
        # For now, fall back to exact match
        return self._compare_exact(responses)
    
    def _generate_comparison_analysis(self, responses: Dict[str, str], 
                                    consensus: Optional[str], 
                                    agreement: float) -> str:
        """
        Generate an analysis of the model comparison
        
        Args:
            responses: Dictionary of model responses
            consensus: Consensus response (if any)
            agreement: Agreement level
            
        Returns:
            Analysis text
        """
        # Format agreement as percentage
        agreement_pct = f"{agreement * 100:.1f}%"
        
        if not responses:
            return "No responses available for analysis."
        
        if len(responses) == 1:
            return "Only one model responded, so no comparison is possible."
        
        analysis = f"Comparison of {len(responses)} model responses:\n\n"
        
        if agreement >= self.config.get("consensus_threshold", 0.7):
            analysis += f"High agreement ({agreement_pct}) among models. "
            analysis += "The consensus response should be reliable.\n\n"
        elif agreement >= 0.5:
            analysis += f"Moderate agreement ({agreement_pct}) among models. "
            analysis += "The consensus response may be reliable, but verify important details.\n\n"
        else:
            analysis += f"Low agreement ({agreement_pct}) among models. "
            analysis += "There is significant disagreement, so consider multiple perspectives.\n\n"
        
        # Add specific observations about differences
        if len(responses) > 2:
            analysis += "Key differences between model responses:\n"
            
            # Simplified difference analysis
            # In a real system, you would use a more sophisticated approach
            lengths = {model: len(response) for model, response in responses.items()}
            min_model = min(lengths, key=lengths.get)
            max_model = max(lengths, key=lengths.get)
            
            if min_model != max_model:
                analysis += f"- {min_model} provided the shortest response ({lengths[min_model]} chars)\n"
                analysis += f"- {max_model} provided the longest response ({lengths[max_model]} chars)\n"
        
        return analysis
    
    # =====================
    # Model Connection Methods
    # =====================
    
    def _connect_openai(self, model_name: str, connection_params: Dict[str, Any]) -> bool:
        """
        Connect to OpenAI API
        """
        try:
            import openai
            
            # Set API parameters
            openai.api_key = connection_params.get("api_key", "")
            openai.organization = connection_params.get("organization", None)
            base_url = connection_params.get("base_url", None)
            if base_url:
                openai.base_url = base_url
            
            # Test connection
            model_id = connection_params.get("model_id", "gpt-3.5-turbo")
            completion = openai.chat.completions.create(
                model=model_id,
                messages=[{"role": "user", "content": "Hello, this is a connection test. Please respond with 'Connected'"}],
                max_tokens=10
            )
            
            # Store client
            self.clients[model_name] = {
                "client": openai,
                "model_id": model_id
            }
            
            # Add to connected models
            self.connected_models[model_name] = {
                "model_id": model_id,
                "capabilities": connection_params.get("capabilities", ["text"])
            }
            
            return True
            
        except Exception as e:
            logger.error(f"Error connecting to OpenAI: {str(e)}")
            return False
    
    def _disconnect_openai(self, model_name: str) -> bool:
        """
        Disconnect from OpenAI API
        """
        if model_name in self.clients:
            del self.clients[model_name]
        return True
    
    def _connect_anthropic(self, model_name: str, connection_params: Dict[str, Any]) -> bool:
        """
        Connect to Anthropic API
        """
        try:
            from anthropic import Anthropic
            
            # Set API parameters
            api_key = connection_params.get("api_key", "")
            client = Anthropic(api_key=api_key)
            
            # Test connection
            model_id = connection_params.get("model_id", "claude-2")
            response = client.messages.create(
                model=model_id,
                max_tokens=10,
                messages=[{"role": "user", "content": "Hello, this is a connection test. Please respond with 'Connected'"}]
            )
            
            # Store client
            self.clients[model_name] = {
                "client": client,
                "model_id": model_id
            }
            
            # Add to connected models
            self.connected_models[model_name] = {
                "model_id": model_id,
                "capabilities": connection_params.get("capabilities", ["text"])
            }
            
            return True
            
        except Exception as e:
            logger.error(f"Error connecting to Anthropic: {str(e)}")
            return False
    
    def _disconnect_anthropic(self, model_name: str) -> bool:
        """
        Disconnect from Anthropic API
        """
        if model_name in self.clients:
            del self.clients[model_name]
        return True
    
    def _connect_llama(self, model_name: str, connection_params: Dict[str, Any]) -> bool:
        """
        Connect to Llama model
        """
        try:
            from llama_cpp import Llama
            
            # Get model path
            model_path = connection_params.get("model_path", "")
            if not model_path:
                logger.error("Model path not provided for Llama model")
                return False
            
            # Load model
            n_ctx = connection_params.get("context_length", 2048)
            n_gpu_layers = connection_params.get("gpu_layers", -1)
            
            model = Llama(
                model_path=model_path,
                n_ctx=n_ctx,
                n_gpu_layers=n_gpu_layers,
                verbose=False
            )
            
            # Store client
            self.clients[model_name] = {
                "client": model,
                "model_path": model_path
            }
            
            # Add to connected models
            self.connected_models[model_name] = {
                "model_path": model_path,
                "context_length": n_ctx,
                "gpu_layers": n_gpu_layers,
                "capabilities": connection_params.get("capabilities", ["text"])
            }
            
            return True
            
        except Exception as e:
            logger.error(f"Error connecting to Llama: {str(e)}")
            return False
    
    def _disconnect_llama(self, model_name: str) -> bool:
        """
        Disconnect from Llama model
        """
        if model_name in self.clients:
            # Clean up GPU memory
            del self.clients[model_name]
            import gc
            import torch
            gc.collect()
            torch.cuda.empty_cache()
        return True
    
    def _connect_huggingface(self, model_name: str, connection_params: Dict[str, Any]) -> bool:
        """
        Connect to Hugging Face model
        """
        try:
            from transformers import AutoModelForCausalLM, AutoTokenizer
            
            # Get model ID
            model_id = connection_params.get("model_id", "")
            if not model_id:
                logger.error("Model ID not provided for Hugging Face model")
                return False
            
            # Load tokenizer and model
            tokenizer = AutoTokenizer.from_pretrained(model_id)
            model = AutoModelForCausalLM.from_pretrained(
                model_id,
                device_map="auto",
                torch_dtype="auto"
            )
            
            # Store client
            self.clients[model_name] = {
                "model": model,
                "tokenizer": tokenizer,
                "model_id": model_id
            }
            
            # Add to connected models
            self.connected_models[model_name] = {
                "model_id": model_id,
                "capabilities": connection_params.get("capabilities", ["text"])
            }
            
            return True
            
        except Exception as e:
            logger.error(f"Error connecting to Hugging Face model: {str(e)}")
            return False
    
    def _disconnect_huggingface(self, model_name: str) -> bool:
        """
        Disconnect from Hugging Face model
        """
        if model_name in self.clients:
            # Clean up GPU memory
            del self.clients[model_name]
            import gc
            import torch
            gc.collect()
            torch.cuda.empty_cache()
        return True
    
    def _connect_ollama(self, model_name: str, connection_params: Dict[str, Any]) -> bool:
        """
        Connect to Ollama instance
        """
        try:
            # Get connection details
            base_url = connection_params.get("base_url", "http://localhost:11434")
            model_id = connection_params.get("model_id", "")
            
            if not model_id:
                logger.error("Model ID not provided for Ollama model")
                return False
            
            # Test connection with a simple request
            import requests
            response = requests.post(
                f"{base_url}/api/generate",
                json={"model": model_id, "prompt": "Test connection", "stream": False}
            )
            response.raise_for_status()
            
            # Store client info
            self.clients[model_name] = {
                "base_url": base_url,
                "model_id": model_id
            }
            
            # Add to connected models
            self.connected_models[model_name] = {
                "model_id": model_id,
                "base_url": base_url,
                "capabilities": connection_params.get("capabilities", ["text"])
            }
            
            return True
            
        except Exception as e:
            logger.error(f"Error connecting to Ollama: {str(e)}")
            return False
    
    def _disconnect_ollama(self, model_name: str) -> bool:
        """
        Disconnect from Ollama instance
        """
        if model_name in self.clients:
            del self.clients[model_name]
        return True
    
    def _connect_local(self, model_name: str, connection_params: Dict[str, Any]) -> bool:
        """
        Connect to local model (implementation depends on your local setup)
        """
        try:
            # This would be customized for your specific local model setup
            model_path = connection_params.get("model_path", "")
            model_type = connection_params.get("local_type", "")
            
            if not model_path:
                logger.error("Model path not provided for local model")
                return False
            
            # Simplified placeholder - in a real implementation, you would
            # initialize your local model based on the specific type
            
            # Store connection info
            self.clients[model_name] = {
                "model_path": model_path,
                "model_type": model_type
            }
            
            # Add to connected models
            self.connected_models[model_name] = {
                "model_path": model_path,
                "model_type": model_type,
                "capabilities": connection_params.get("capabilities", ["text"])
            }
            
            return True
            
        except Exception as e:
            logger.error(f"Error connecting to local model: {str(e)}")
            return False
    
    def _disconnect_local(self, model_name: str) -> bool:
        """
        Disconnect from local model
        """
        if model_name in self.clients:
            del self.clients[model_name]
        return True
    
    def _connect_palm(self, model_name: str, connection_params: Dict[str, Any]) -> bool:
        """
        Connect to Google PaLM API
        """
        try:
            import google.generativeai as palm
            
            # Set API key
            api_key = connection_params.get("api_key", "")
            if not api_key:
                logger.error("API key not provided for PaLM model")
                return False
            
            palm.configure(api_key=api_key)
            
            # Test connection
            models = palm.list_models()
            
            # Store client
            self.clients[model_name] = {
                "client": palm,
                "model_id": connection_params.get("model_id", "models/text-bison-001")
            }
            
            # Add to connected models
            self.connected_models[model_name] = {
                "model_id": connection_params.get("model_id", "models/text-bison-001"),
                "capabilities": connection_params.get("capabilities", ["text"])
            }
            
            return True
            
        except Exception as e:
            logger.error(f"Error connecting to PaLM API: {str(e)}")
            return False
    
    def _disconnect_palm(self, model_name: str) -> bool:
        """
        Disconnect from PaLM API
        """
        if model_name in self.clients:
            del self.clients[model_name]
        return True
    
    def _connect_cohere(self, model_name: str, connection_params: Dict[str, Any]) -> bool:
        """
        Connect to Cohere API
        """
        try:
            import cohere
            
            # Set API key
            api_key = connection_params.get("api_key", "")
            if not api_key:
                logger.error("API key not provided for Cohere model")
                return False
            
            client = cohere.Client(api_key)
            
            # Test connection
            response = client.generate(prompt="Hello, test connection", max_tokens=5)
            
            # Store client
            self.clients[model_name] = {
                "client": client,
                "model_id": connection_params.get("model_id", "command")
            }
            
            # Add to connected models
            self.connected_models[model_name] = {
                "model_id": connection_params.get("model_id", "command"),
                "capabilities": connection_params.get("capabilities", ["text"])
            }
            
            return True
            
        except Exception as e:
            logger.error(f"Error connecting to Cohere API: {str(e)}")
            return False
    
    def _disconnect_cohere(self, model_name: str) -> bool:
        """
        Disconnect from Cohere API
        """
        if model_name in self.clients:
            del self.clients[model_name]
        return True
    
    def _connect_custom(self, model_name: str, connection_params: Dict[str, Any]) -> bool:
        """
        Connect to custom model or API
        """
        try:
            # This is a placeholder for connecting to custom models or APIs
            # that don't fit the predefined categories
            
            # Get connection handler if provided
            connect_func = connection_params.get("connect_function")
            if connect_func and callable(connect_func):
                client = connect_func(connection_params)
                if client:
                    # Store client
                    self.clients[model_name] = {
                        "client": client,
                        "custom_type": connection_params.get("custom_type", "unknown")
                    }
                    
                    # Add to connected models
                    self.connected_models[model_name] = {
                        "custom_type": connection_params.get("custom_type", "unknown"),
                        "capabilities": connection_params.get("capabilities", ["text"])
                    }
                    
                    return True
            
            # If no connect function, just store the connection parameters
            self.clients[model_name] = {
                "connection_params": connection_params
            }
            
            # Add to connected models
            self.connected_models[model_name] = {
                "custom_type": connection_params.get("custom_type", "unknown"),
                "capabilities": connection_params.get("capabilities", ["text"])
            }
            
            return True
            
        except Exception as e:
            logger.error(f"Error connecting to custom model: {str(e)}")
            return False
    
    def _disconnect_custom(self, model_name: str) -> bool:
        """
        Disconnect from custom model or API
        """
        try:
            if model_name in self.clients:
                # Get disconnect handler if provided
                client_info = self.clients[model_name]
                connection_params = client_info.get("connection_params", {})
                disconnect_func = connection_params.get("disconnect_function")
                
                if disconnect_func and callable(disconnect_func):
                    disconnect_func(client_info.get("client"))
                
                # Remove client
                del self.clients[model_name]
            
            return True
            
        except Exception as e:
            logger.error(f"Error disconnecting from custom model: {str(e)}")
            # Force removal from clients
            if model_name in self.clients:
                del self.clients[model_name]
            return False
    
    # =====================
    # Model Query Methods
    # =====================
    
    def _query_openai(self, model_name: str, query: str, context: Optional[str] = None) -> str:
        """
        Query OpenAI model
        """
        try:
            client_info = self.clients.get(model_name)
            if not client_info:
                return "Error: Model not connected"
            
            openai = client_info["client"]
            model_id = client_info.get("model_id", "gpt-3.5-turbo")
            
            # Prepare messages
            messages = []
            
            # Add context if provided
            if context:
                messages.append({"role": "system", "content": context})
            
            # Add conversation history if available
            if model_name in self.session_history:
                # Add up to 10 most recent messages from history
                history = self.session_history[model_name][-10:]
                for entry in history:
                    messages.append({"role": entry["role"], "content": entry["content"]})
            
            # Add current query
            messages.append({"role": "user", "content": query})
            
            # Make request
            completion = openai.chat.completions.create(
                model=model_id,
                messages=messages,
                max_tokens=1000,
                temperature=0.7
            )
            
            # Extract response
            response = completion.choices[0].message.content
            
            return response
            
        except Exception as e:
            logger.error(f"Error querying OpenAI: {str(e)}")
            return f"Error: {str(e)}"
    
    def _query_anthropic(self, model_name: str, query: str, context: Optional[str] = None) -> str:
        """
        Query Anthropic model
        """
        try:
            client_info = self.clients.get(model_name)
            if not client_info:
                return "Error: Model not connected"
            
            client = client_info["client"]
            model_id = client_info.get("model_id", "claude-2")
            
            # Prepare messages
            messages = []
            
            # Add conversation history if available
            if model_name in self.session_history:
                # Add up to 10 most recent messages from history
                history = self.session_history[model_name][-10:]
                for entry in history:
                    messages.append({"role": entry["role"], "content": entry["content"]})
            
            # Add current query
            messages.append({"role": "user", "content": query})
            
            # Make request
            response = client.messages.create(
                model=model_id,
                max_tokens=1000,
                temperature=0.7,
                system=context if context else None,
                messages=messages
            )
            
            # Extract response
            return response.content[0].text
            
        except Exception as e:
            logger.error(f"Error querying Anthropic: {str(e)}")
            return f"Error: {str(e)}"
    
    def _query_llama(self, model_name: str, query: str, context: Optional[str] = None) -> str:
        """
        Query Llama model
        """
        try:
            client_info = self.clients.get(model_name)
            if not client_info:
                return "Error: Model not connected"
            
            model = client_info["client"]
            
            # Prepare prompt
            prompt = ""
            
            # Add context if provided
            if context:
                prompt += f"{context}\n\n"
            
            # Add conversation history if available
            if model_name in self.session_history:
                # Add up to 5 most recent message pairs from history
                history = self.session_history[model_name][-10:]
                for i in range(0, len(history), 2):
                    if i+1 < len(history):
                        user_msg = history[i]["content"]
                        assistant_msg = history[i+1]["content"]
                        prompt += f"User: {user_msg}\nAssistant: {assistant_msg}\n\n"
            
            # Add current query
            prompt += f"User: {query}\nAssistant: "
            
            # Generate response
            output = model(
                prompt=prompt,
                max_tokens=1000,
                temperature=0.7,
                stop=["User:"]
            )
            
            # Extract response
            response = output["choices"][0]["text"].strip()
            
            return response
            
        except Exception as e:
            logger.error(f"Error querying Llama: {str(e)}")
            return f"Error: {str(e)}"
    
    def _query_huggingface(self, model_name: str, query: str, context: Optional[str] = None) -> str:
        """
        Query Hugging Face model
        """
        try:
            import torch
            
            client_info = self.clients.get(model_name)
            if not client_info:
                return "Error: Model not connected"
            
            model = client_info["model"]
            tokenizer = client_info["tokenizer"]
            
            # Prepare prompt
            prompt = ""
            
            # Add context if provided
            if context:
                prompt += f"{context}\n\n"
            
            # Add conversation history if available
            if model_name in self.session_history:
                # Add up to 5 most recent message pairs from history
                history = self.session_history[model_name][-10:]
                for i in range(0, len(history), 2):
                    if i+1 < len(history):
                        user_msg = history[i]["content"]
                        assistant_msg = history[i+1]["content"]
                        prompt += f"User: {user_msg}\nAssistant: {assistant_msg}\n\n"
            
            # Add current query
            prompt += f"User: {query}\nAssistant: "
            
            # Tokenize
            inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
            
            # Generate
            with torch.no_grad():
                outputs = model.generate(
                    inputs.input_ids,
                    max_new_tokens=500,
                    temperature=0.7,
                    do_sample=True,
                    top_p=0.9,
                    pad_token_id=tokenizer.eos_token_id
                )
            
            # Decode
            full_output = tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # Extract just the response (after the prompt)
            response = full_output[len(prompt):].strip()
            
            return response
            
        except Exception as e:
            logger.error(f"Error querying Hugging Face: {str(e)}")
            return f"Error: {str(e)}"
    
    def _query_ollama(self, model_name: str, query: str, context: Optional[str] = None) -> str:
        """
        Query Ollama model
        """
        try:
            import requests
            
            client_info = self.clients.get(model_name)
            if not client_info:
                return "Error: Model not connected"
            
            base_url = client_info["base_url"]
            model_id = client_info["model_id"]
            
            # Prepare prompt
            prompt = ""
            
            # Add context if provided
            if context:
                prompt += f"{context}\n\n"
            
            # Add conversation history if available
            if model_name in self.session_history:
                # Add up to 5 most recent message pairs from history
                history = self.session_history[model_name][-10:]
                for i in range(0, len(history), 2):
                    if i+1 < len(history):
                        user_msg = history[i]["content"]
                        assistant_msg = history[i+1]["content"]
                        prompt += f"User: {user_msg}\nAssistant: {assistant_msg}\n\n"
            
            # Add current query
            prompt += f"User: {query}\nAssistant: "
            
            # Make request
            response = requests.post(
                f"{base_url}/api/generate",
                json={
                    "model": model_id,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "top_p": 0.9,
                        "stop": ["User:"]
                    }
                }
            )
            response.raise_for_status()
            
            # Extract response
            result = response.json()
            return result.get("response", "").strip()
            
        except Exception as e:
            logger.error(f"Error querying Ollama: {str(e)}")
            return f"Error: {str(e)}"
    
    def _query_local(self, model_name: str, query: str, context: Optional[str] = None) -> str:
        """
        Query local model
        """
        try:
            # This is a placeholder for querying custom local models
            # The implementation would depend on the specific local model setup
            
            return "Local model query not implemented"
            
        except Exception as e:
            logger.error(f"Error querying local model: {str(e)}")
            return f"Error: {str(e)}"
    
    def _query_palm(self, model_name: str, query: str, context: Optional[str] = None) -> str:
        """
        Query PaLM model
        """
        try:
            client_info = self.clients.get(model_name)
            if not client_info:
                return "Error: Model not connected"
            
            palm = client_info["client"]
            model_id = client_info["model_id"]
            
            # Prepare prompt
            prompt = ""
            
            # Add context if provided
            if context:
                prompt += f"{context}\n\n"
            
            # Add conversation history if available
            if model_name in self.session_history:
                # Add up to 5 most recent message pairs from history
                history = self.session_history[model_name][-10:]
                for i in range(0, len(history), 2):
                    if i+1 < len(history):
                        user_msg = history[i]["content"]
                        assistant_msg = history[i+1]["content"]
                        prompt += f"User: {user_msg}\nAssistant: {assistant_msg}\n\n"
            
            # Add current query
            prompt += f"User: {query}\nAssistant: "
            
            # Generate response
            response = palm.generate_text(
                model=model_id,
                prompt=prompt,
                temperature=0.7,
                max_output_tokens=1000,
                stop_sequences=["User:"]
            )
            
            return response.result
            
        except Exception as e:
            logger.error(f"Error querying PaLM: {str(e)}")
            return f"Error: {str(e)}"
    
    def _query_cohere(self, model_name: str, query: str, context: Optional[str] = None) -> str:
        """
        Query Cohere model
        """
        try:
            client_info = self.clients.get(model_name)
            if not client_info:
                return "Error: Model not connected"
            
            client = client_info["client"]
            model_id = client_info["model_id"]
            
            # Prepare prompt
            prompt = ""
            
            # Add context if provided
            if context:
                prompt += f"{context}\n\n"
            
            # Add conversation history if available
            if model_name in self.session_history:
                # Add up to 5 most recent message pairs from history
                history = self.session_history[model_name][-10:]
                for i in range(0, len(history), 2):
                    if i+1 < len(history):
                        user_msg = history[i]["content"]
                        assistant_msg = history[i+1]["content"]
                        prompt += f"User: {user_msg}\nAssistant: {assistant_msg}\n\n"
            
            # Add current query
            prompt += f"User: {query}\nAssistant: "
            
            # Generate response
            response = client.generate(
                model=model_id,
                prompt=prompt,
                max_tokens=500,
                temperature=0.7,
                stop_sequences=["User:"]
            )
            
            return response.generations[0].text
            
        except Exception as e:
            logger.error(f"Error querying Cohere: {str(e)}")
            return f"Error: {str(e)}"
    
    def _query_custom(self, model_name: str, query: str, context: Optional[str] = None) -> str:
        """
        Query custom model or API
        """
        try:
            client_info = self.clients.get(model_name)
            if not client_info:
                return "Error: Model not connected"
            
            # Check if there's a custom query function
            connection_params = client_info.get("connection_params", {})
            query_func = connection_params.get("query_function")
            
            if query_func and callable(query_func):
                # Use custom query function
                history = self.session_history.get(model_name, [])
                return query_func(client_info.get("client"), query, context, history)
            
            return "Custom query implementation not provided"
            
        except Exception as e:
            logger.error(f"Error querying custom model: {str(e)}")
            return f"Error: {str(e)}"
