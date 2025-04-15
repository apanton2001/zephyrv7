"""
Email Manager Module for Lisa

This module provides functionality to access, read, and analyze emails.
It supports connecting to email servers, reading messages, searching, and
generating insights from email communications.
"""

import os
import imaplib
import poplib
import smtplib
import email
import email.header
import email.utils
import email.message
import logging
import json
import re
import time
import base64
import getpass
import ssl
from typing import Dict, List, Any, Optional, Tuple, Union
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class EmailManager:
    """
    Manages email access, reading, and analysis
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize email manager
        
        Args:
            config: Configuration dictionary with email settings
        """
        # Default configuration
        self.default_config = {
            "imap_server": "",
            "imap_port": 993,
            "pop3_server": "",
            "pop3_port": 995,
            "smtp_server": "",
            "smtp_port": 587,
            "username": "",
            "password": "",
            "use_ssl": True,
            "preferred_protocol": "imap",  # or "pop3"
            "max_emails_to_fetch": 100,
            "cache_duration": 15,  # minutes
            "last_email_check": 0,
            "email_cache_path": ""
        }
        
        # Override defaults with provided config
        self.config = self.default_config.copy()
        if config:
            self.config.update(config)
        
        # Set up email cache
        if not self.config["email_cache_path"]:
            self.config["email_cache_path"] = os.path.join(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                "data",
                "email_cache.json"
            )
        
        # Initialize connections
        self.imap_connection = None
        self.pop3_connection = None
        self.smtp_connection = None
        
        # Initialize email cache
        self.email_cache = []
        self.load_email_cache()
        
        # Track connection status
        self.is_connected = False
        
        logger.info("Email Manager initialized")
    
    def setup_email_config(self, interactive: bool = True) -> bool:
        """
        Set up email configuration
        
        Args:
            interactive: Whether to interactively prompt for settings
            
        Returns:
            True if configuration is successful, False otherwise
        """
        if interactive:
            print("\nEmail Configuration Setup")
            print("------------------------")
            
            # Preferred protocol
            pref_protocol = input("Preferred protocol (imap/pop3) [imap]: ").strip().lower() or "imap"
            self.config["preferred_protocol"] = pref_protocol
            
            # IMAP settings
            if pref_protocol == "imap" or not pref_protocol:
                self.config["imap_server"] = input("IMAP server [example: imap.gmail.com]: ").strip()
                port_input = input(f"IMAP port [993]: ").strip()
                self.config["imap_port"] = int(port_input) if port_input else 993
            
            # POP3 settings
            if pref_protocol == "pop3":
                self.config["pop3_server"] = input("POP3 server [example: pop.gmail.com]: ").strip()
                port_input = input(f"POP3 port [995]: ").strip()
                self.config["pop3_port"] = int(port_input) if port_input else 995
            
            # SMTP settings
            self.config["smtp_server"] = input("SMTP server [example: smtp.gmail.com]: ").strip()
            port_input = input(f"SMTP port [587]: ").strip()
            self.config["smtp_port"] = int(port_input) if port_input else 587
            
            # Authentication
            self.config["username"] = input("Email address: ").strip()
            # Using getpass for secure password entry
            try:
                self.config["password"] = getpass.getpass("Password: ")
            except Exception:
                # Fall back to regular input if getpass is not available
                self.config["password"] = input("Password: ")
            
            # SSL
            ssl_input = input("Use SSL/TLS? (y/n) [y]: ").strip().lower() or "y"
            self.config["use_ssl"] = ssl_input == "y"
            
            # Validate by testing connection
            if self._test_connection():
                print("Connection successful! Configuration saved.")
                self._save_config()
                return True
            else:
                print("Connection failed. Please check your settings and try again.")
                return False
        else:
            # Check if we have the minimum required settings
            if not self.config["username"] or not self.config["password"]:
                logger.error("Email configuration is incomplete")
                return False
            
            if self.config["preferred_protocol"] == "imap" and not self.config["imap_server"]:
                logger.error("IMAP server not configured")
                return False
            
            if self.config["preferred_protocol"] == "pop3" and not self.config["pop3_server"]:
                logger.error("POP3 server not configured")
                return False
            
            # Test connection
            return self._test_connection()
    
    def _test_connection(self) -> bool:
        """
        Test email server connection with current settings
        
        Returns:
            True if connection is successful, False otherwise
        """
        try:
            if self.config["preferred_protocol"] == "imap":
                # Test IMAP connection
                if not self.config["imap_server"]:
                    logger.error("IMAP server not configured")
                    return False
                    
                imap = self._connect_imap()
                if imap:
                    imap.logout()
                    logger.info("IMAP connection test successful")
                    return True
                else:
                    logger.error("IMAP connection test failed")
                    return False
            else:
                # Test POP3 connection
                if not self.config["pop3_server"]:
                    logger.error("POP3 server not configured")
                    return False
                    
                pop3 = self._connect_pop3()
                if pop3:
                    pop3.quit()
                    logger.info("POP3 connection test successful")
                    return True
                else:
                    logger.error("POP3 connection test failed")
                    return False
        except Exception as e:
            logger.error(f"Error testing connection: {str(e)}")
            return False
    
    def _save_config(self) -> bool:
        """
        Save current configuration (without password) to file
        
        Returns:
            True if successful, False otherwise
        """
        try:
            # Create a copy without the password
            save_config = self.config.copy()
            save_config["password"] = ""  # Don't save password to disk
            
            config_path = os.path.join(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                "data",
                "email_config.json"
            )
            
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(config_path), exist_ok=True)
            
            with open(config_path, 'w') as f:
                json.dump(save_config, f, indent=4)
            
            logger.info(f"Email configuration saved to {config_path}")
            return True
        except Exception as e:
            logger.error(f"Error saving email configuration: {str(e)}")
            return False
    
    def _connect_imap(self) -> Optional[imaplib.IMAP4_SSL]:
        """
        Connect to IMAP server
        
        Returns:
            IMAP connection or None if connection fails
        """
        try:
            if self.config["use_ssl"]:
                imap = imaplib.IMAP4_SSL(self.config["imap_server"], self.config["imap_port"])
            else:
                imap = imaplib.IMAP4(self.config["imap_server"], self.config["imap_port"])
            
            imap.login(self.config["username"], self.config["password"])
            logger.info(f"Connected to IMAP server: {self.config['imap_server']}")
            self.is_connected = True
            return imap
        except Exception as e:
            logger.error(f"Error connecting to IMAP server: {str(e)}")
            self.is_connected = False
            return None
    
    def _connect_pop3(self) -> Optional[Union[poplib.POP3, poplib.POP3_SSL]]:
        """
        Connect to POP3 server
        
        Returns:
            POP3 connection or None if connection fails
        """
        try:
            if self.config["use_ssl"]:
                pop3 = poplib.POP3_SSL(self.config["pop3_server"], self.config["pop3_port"])
            else:
                pop3 = poplib.POP3(self.config["pop3_server"], self.config["pop3_port"])
            
            pop3.user(self.config["username"])
            pop3.pass_(self.config["password"])
            logger.info(f"Connected to POP3 server: {self.config['pop3_server']}")
            self.is_connected = True
            return pop3
        except Exception as e:
            logger.error(f"Error connecting to POP3 server: {str(e)}")
            self.is_connected = False
            return None
    
    def _connect_smtp(self) -> Optional[Union[smtplib.SMTP, smtplib.SMTP_SSL]]:
        """
        Connect to SMTP server
        
        Returns:
            SMTP connection or None if connection fails
        """
        try:
            if self.config["use_ssl"]:
                smtp = smtplib.SMTP_SSL(self.config["smtp_server"], self.config["smtp_port"])
            else:
                smtp = smtplib.SMTP(self.config["smtp_server"], self.config["smtp_port"])
                smtp.starttls()
            
            smtp.login(self.config["username"], self.config["password"])
            logger.info(f"Connected to SMTP server: {self.config['smtp_server']}")
            return smtp
        except Exception as e:
            logger.error(f"Error connecting to SMTP server: {str(e)}")
            return None
    
    def _parse_email_message(self, raw_message: Union[bytes, List[bytes], email.message.Message]) -> Dict[str, Any]:
        """
        Parse email message into a structured format
        
        Args:
            raw_message: Raw email message
            
        Returns:
            Dictionary with parsed email data
        """
        try:
            # Convert raw message to email.message.Message if needed
            if isinstance(raw_message, list):
                # POP3 format, join and parse
                raw_content = b'\n'.join(raw_message)
                msg = email.message_from_bytes(raw_content)
            elif isinstance(raw_message, bytes):
                # IMAP format, parse directly
                msg = email.message_from_bytes(raw_message)
            else:
                # Already parsed
                msg = raw_message
            
            # Extract basic headers
            subject = self._decode_header(msg.get("Subject", ""))
            from_addr = self._decode_header(msg.get("From", ""))
            to_addr = self._decode_header(msg.get("To", ""))
            date_str = msg.get("Date", "")
            
            # Parse date
            try:
                date = email.utils.parsedate_to_datetime(date_str)
                date_formatted = date.strftime("%Y-%m-%d %H:%M:%S")
            except (TypeError, ValueError):
                date_formatted = date_str
            
            # Extract message ID
            message_id = msg.get("Message-ID", "")
            
            # Extract body content
            body_text = ""
            body_html = ""
            attachments = []
            
            # Process body parts
            if msg.is_multipart():
                for part in msg.walk():
                    content_type = part.get_content_type()
                    content_disposition = str(part.get("Content-Disposition", ""))
                    
                    # Skip attachments
                    if "attachment" in content_disposition:
                        # Get attachment info
                        filename = part.get_filename()
                        if filename:
                            attachments.append({
                                "filename": filename,
                                "content_type": content_type,
                                "size": len(part.get_payload(decode=True) or b"")
                            })
                        continue
                    
                    # Get text content
                    if content_type == "text/plain" and not body_text:
                        body_text = self._decode_content(part)
                    elif content_type == "text/html" and not body_html:
                        body_html = self._decode_content(part)
            else:
                # Single part message
                content_type = msg.get_content_type()
                if content_type == "text/plain":
                    body_text = self._decode_content(msg)
                elif content_type == "text/html":
                    body_html = self._decode_content(msg)
            
            # Use HTML content if plain text is empty
            if not body_text and body_html:
                # Very simple HTML to text conversion
                body_text = re.sub('<[^<]+?>', ' ', body_html)
                body_text = re.sub('\\s+', ' ', body_text).strip()
            
            # Trim body if needed (for cache)
            body_preview = body_text[:500] + "..." if len(body_text) > 500 else body_text
            
            return {
                "message_id": message_id,
                "subject": subject,
                "from": from_addr,
                "to": to_addr,
                "date": date_formatted,
                "body": body_text,
                "body_html": body_html,
                "body_preview": body_preview,
                "has_attachments": len(attachments) > 0,
                "attachments": attachments
            }
        except Exception as e:
            logger.error(f"Error parsing email: {str(e)}")
            return {
                "error": f"Failed to parse email: {str(e)}",
                "subject": "Error parsing email",
                "from": "",
                "to": "",
                "date": "",
                "body": "",
                "body_preview": ""
            }
    
    def _decode_header(self, header: str) -> str:
        """
        Decode email header
        
        Args:
            header: Header string to decode
            
        Returns:
            Decoded header
        """
        if not header:
            return ""
            
        try:
            decoded_parts = []
            for part, encoding in email.header.decode_header(header):
                if isinstance(part, bytes):
                    if encoding:
                        try:
                            decoded_parts.append(part.decode(encoding))
                        except (UnicodeDecodeError, LookupError):
                            # Fallback to utf-8 if specified encoding fails
                            try:
                                decoded_parts.append(part.decode('utf-8', errors='replace'))
                            except:
                                decoded_parts.append(part.decode('ascii', errors='replace'))
                    else:
                        # No encoding specified, try utf-8
                        try:
                            decoded_parts.append(part.decode('utf-8', errors='replace'))
                        except:
                            decoded_parts.append(part.decode('ascii', errors='replace'))
                else:
                    # Already a string
                    decoded_parts.append(part)
                    
            return " ".join(decoded_parts)
        except Exception as e:
            logger.error(f"Error decoding header: {str(e)}")
            # Return original if decoding fails
            return header
    
    def _decode_content(self, part: email.message.Message) -> str:
        """
        Decode content from an email part
        
        Args:
            part: Email message part
            
        Returns:
            Decoded content as string
        """
        content = part.get_payload(decode=True)
        if content is None:
            return ""
            
        charset = part.get_content_charset()
        
        if charset:
            try:
                return content.decode(charset)
            except (UnicodeDecodeError, LookupError):
                # Fallback encodings
                for fallback in ['utf-8', 'latin-1', 'ascii']:
                    try:
                        return content.decode(fallback, errors='replace')
                    except:
                        continue
        
        # If all else fails, try utf-8 with replace errors
        try:
            return content.decode('utf-8', errors='replace')
        except:
            return content.decode('ascii', errors='replace')
    
    def load_email_cache(self) -> bool:
        """
        Load cached emails from disk
        
        Returns:
            True if successful, False otherwise
        """
        cache_path = self.config["email_cache_path"]
        if not os.path.exists(cache_path):
            return False
            
        try:
            with open(cache_path, 'r') as f:
                cache_data = json.load(f)
                
            if isinstance(cache_data, dict):
                # New format with metadata
                self.email_cache = cache_data.get("emails", [])
                self.config["last_email_check"] = cache_data.get("last_check", 0)
            elif isinstance(cache_data, list):
                # Old format, just emails
                self.email_cache = cache_data
            
            logger.info(f"Loaded {len(self.email_cache)} emails from cache")
            return True
        except Exception as e:
            logger.error(f"Error loading email cache: {str(e)}")
            return False
    
    def save_email_cache(self) -> bool:
        """
        Save cached emails to disk
        
        Returns:
            True if successful, False otherwise
        """
        cache_path = self.config["email_cache_path"]
        
        try:
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(cache_path), exist_ok=True)
            
            # Save emails and metadata
            cache_data = {
                "emails": self.email_cache,
                "last_check": self.config["last_email_check"],
                "count": len(self.email_cache),
                "timestamp": time.time()
            }
            
            with open(cache_path, 'w') as f:
                json.dump(cache_data, f)
                
            logger.info(f"Saved {len(self.email_cache)} emails to cache")
            return True
        except Exception as e:
            logger.error(f"Error saving email cache: {str(e)}")
            return False
    
    def check_new_emails(self, force_refresh: bool = False) -> int:
        """
        Check for new emails and update cache
        
        Args:
            force_refresh: Force refresh even if cache is recent
            
        Returns:
            Number of new emails found
        """
        # Check if we need to refresh
        current_time = time.time()
        cache_age = current_time - self.config["last_email_check"]
        
        if not force_refresh and cache_age < (self.config["cache_duration"] * 60):
            logger.info(f"Using cached emails (age: {cache_age:.1f} seconds)")
            return 0
        
        # Connect to email server
        if self.config["preferred_protocol"] == "imap":
            return self._check_new_emails_imap()
        else:
            return self._check_new_emails_pop3()
    
    def _check_new_emails_imap(self) -> int:
        """
        Check for new emails using IMAP
        
        Returns:
            Number of new emails found
        """
        try:
            imap = self._connect_imap()
            if not imap:
                logger.error("Failed to connect to IMAP server")
                return 0
            
            try:
                # Select inbox
                status, messages = imap.select("INBOX")
                if status != "OK":
                    logger.error(f"Failed to select inbox: {messages}")
                    imap.logout()
                    return 0
                
                # Get current email count
                num_messages = int(messages[0])
                logger.info(f"Found {num_messages} messages in inbox")
                
                # Fetch a limited number of recent messages
                fetch_count = min(num_messages, self.config["max_emails_to_fetch"])
                if fetch_count == 0:
                    imap.logout()
                    return 0
                
                # Create a search criteria to get recent messages
                # Search for all messages if we have no existing cache
                if not self.email_cache:
                    status, search_result = imap.search(None, "ALL")
                else:
                    # Get messages from the last week
                    date = (datetime.now() - timedelta(days=7)).strftime("%d-%b-%Y")
                    status, search_result = imap.search(None, f'SINCE "{date}"')
                
                if status != "OK":
                    logger.error(f"Failed to search for messages: {search_result}")
                    imap.logout()
                    return 0
                
                # Get message IDs
                message_ids = search_result[0].split()
                
                # Reverse for newest first, and limit to max fetch count
                message_ids = message_ids[-fetch_count:]
                
                # Track new messages
                new_messages = []
                new_count = 0
                
                # Get existing message IDs
                existing_ids = {email_data.get("message_id", "") for email_data in self.email_cache}
                
                # Fetch each message
                for msg_id in message_ids:
                    try:
                        status, msg_data = imap.fetch(msg_id, "(RFC822)")
                        if status != "OK":
                            logger.warning(f"Failed to fetch message {msg_id}")
                            continue
                        
                        # Parse email
                        email_data = self._parse_email_message(msg_data[0][1])
                        
                        # Check if it's new
                        if email_data.get("message_id") and email_data["message_id"] not in existing_ids:
                            new_messages.append(email_data)
                            new_count += 1
                    except Exception as e:
                        logger.error(f"Error processing message {msg_id}: {str(e)}")
                
                # Update cache
                if new_count > 0:
                    # Add to beginning of cache (newest first)
                    self.email_cache = new_messages + self.email_cache
                    
                    # Trim cache if needed
                    max_cache = self.config.get("max_cache_size", 1000)
                    if len(self.email_cache) > max_cache:
                        self.email_cache = self.email_cache[:max_cache]
                    
                    # Save cache
                    self.save_email_cache()
                
                # Update last check time
                self.config["last_email_check"] = time.time()
                
                # Clean up
                imap.logout()
                
                logger.info(f"Found {new_count} new messages")
                return new_count
                
            except Exception as e:
                logger.error(f"Error checking emails: {str(e)}")
                try:
                    imap.logout()
                except:
                    pass
                return 0
                
        except Exception as e:
            logger.error(f"Error connecting to IMAP server: {str(e)}")
            return 0
    
    def _check_new_emails_pop3(self) -> int:
        """
        Check for new emails using POP3
        
        Returns:
            Number of new emails found
        """
        try:
            pop3 = self._connect_pop3()
            if not pop3:
                logger.error("Failed to connect to POP3 server")
                return 0
            
            try:
                # Get message count
                num_messages = len(pop3.list()[1])
                logger.info(f"Found {num_messages} messages")
                
                # Fetch a limited number of recent messages
                fetch_count = min(num_messages, self.config["max_emails_to_fetch"])
                if fetch_count == 0:
                    pop3.quit()
                    return 0
                
                # Start from newest messages
                start_index = max(1, num_messages - fetch_count + 1)
                
                # Track new messages
                new_messages = []
                new_count = 0
                
                # Fetch each message
                for i in range(start_index, num_messages + 1):
                    try:
                        # Get message
                        response, lines, octets = pop3.retr(i)
                        
                        # Parse email
                        email_data = self._parse_email_message(lines)
                        
                        # For POP3, we can't easily check duplicates
                        # We'll just take the requested number of messages
                        new_messages.append(email_data)
                        new_count += 1
                    except Exception as e:
                        logger.error(f"Error processing message {i}: {str(e)}")
                
                # Update cache
                if new_count > 0:
                    # Add to beginning of cache (newest first)
                    self.email_cache = new_messages + self.email_cache
                    
                    # Trim cache if needed
                    max_cache = self.config.get("max_cache_size", 1000)
                    if len(self.email_cache) > max_cache:
                        self.email_cache = self.email_cache[:max_cache]
                    
                    # Save cache
                    self.save_email_cache()
                
                # Update last check time
                self.config["last_email_check"] = time.time()
                
                # Clean up
                pop3.quit()
                
                logger.info(f"Found {new_count} new messages")
                return new_count
                
            except Exception as e:
                logger.error(f"Error checking emails: {str(e)}")
                try:
                    pop3.quit()
                except:
                    pass
                return 0
                
        except Exception as e:
            logger.error(f"Error connecting to POP3 server: {str(e)}")
            return 0
    
    def get_recent_emails(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get recent emails from cache
        
        Args:
            limit: Maximum number of emails to return
            
        Returns:
            List of email dictionaries
        """
        # Check cache first
        if not self.email_cache:
            # Try to refresh
            self.check_new_emails()
        
        # Return cached emails (limited)
        return self.email_cache[:limit]
    
    def search_emails(self, query: str, max_results: int = 20) -> List[Dict[str, Any]]:
        """
        Search emails for a query string
        
        Args:
            query: Search query
            max_results: Maximum number of results to return
            
        Returns:
            List of matching email dictionaries
        """
        # Check cache first
        if not self.email_cache:
            # Try to refresh
            self.check_new_emails()
        
        if not self.email_cache:
            return []
        
        # Search in cache
        results = []
        query = query.lower()
        
        for email_data in self.email_cache:
            # Check fields
            if (query in email_data.get("subject", "").lower() or
                query in email_data.get("from", "").lower() or
                query in email_data.get("body_preview", "").lower()):
                
                results.append(email_data)
                if len(results) >= max_results:
                    break
        
        return results
    
    def get_email_by_id(self, message_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific email by message ID
        
        Args:
            message_id: Email message ID
            
        Returns:
            Email dictionary or None if not found
        """
        for email_data in self.email_cache:
            if email_data.get("message_id") == message_id:
                return email_data
        
        return None
    
    def analyze_communications(self) -> Dict[str, Any]:
        """
        Analyze email communications for patterns and insights
        
        Returns:
            Dictionary with analysis results
        """
        # Ensure we have emails to analyze
        if not self.email_cache:
            self.check_new_emails()
        
        if not self.email_cache:
            return {"error": "No emails available for analysis"}
        
        # Analysis results
        analysis = {
            "total_emails": len(self.email_cache),
            "date_range": {
                "start": None,
                "end": None
            },
            "top_senders": {},
            "topics": {},
            "response_times": {},
            "email_volume": {
                "by_day": {},
                "by_hour": {}
            },
            "summary": ""
        }
        
        # Process each email
        for email_data in self.email_cache:
            # Count senders
            sender = email_data.get("from", "")
            if sender:
                # Extract just the email address if possible
                match = re.search(r'<([^>]+)>', sender)
                if match:
                    sender_email = match.group(1).lower()
                else:
                    sender_email = sender.lower()
                
                analysis["top_senders"][sender_email] = analysis["top_senders"].get(sender_email, 0) + 1
            
            # Track date range
            date_str = email_data.get("date", "")
            try:
                date = datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S")
                
                # Update date range
                if analysis["date_range"]["start"] is None or date < analysis["date_range"]["start"]:
                    analysis["date_range"]["start"] = date
                
                if analysis["date_range"]["end"] is None or date > analysis["date_range"]["end"]:
                    analysis["date_range"]["end"] = date
                
                # Track volume by day and hour
                day_key = date.strftime("%Y-%m-%d")
                hour_key = date.strftime("%H")
                
                analysis["email_volume"]["by_day"][day_key] = analysis["email_volume"]["by_day"].get(day_key, 0) + 1
                analysis["email_volume"]["by_hour"][hour_key] = analysis["email_volume"]["by_hour"].get(hour_key, 0) + 1
            except (ValueError, TypeError):
                # Skip date analysis for emails with invalid dates
                pass
