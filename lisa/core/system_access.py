"""
System Access Module for Lisa

This module provides controlled and secure access to system resources, including
file operations, system information, resource monitoring, and system health scanning.
"""

import os
import sys
import platform
import logging
import glob
import re
import json
import time
from typing import Dict, List, Any, Optional, Tuple, Union
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Optional imports with fallbacks
try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False
    logger.warning("psutil not available. Install with pip install psutil for full system monitoring")

try:
    import shutil
    SHUTIL_AVAILABLE = True
except ImportError:
    SHUTIL_AVAILABLE = False
    logger.warning("shutil not available. Some disk operations will be limited")


class SystemAccessManager:
    """
    Manages access to system resources with safety controls
    """
    
    def __init__(self, 
                 safety_level: str = "medium", 
                 allowed_paths: Optional[List[str]] = None,
                 blocked_paths: Optional[List[str]] = None,
                 log_dir: Optional[str] = None):
        """
        Initialize the system access manager
        
        Args:
            safety_level: Level of safety restrictions ("low", "medium", "high")
            allowed_paths: List of paths explicitly allowed for access
            blocked_paths: List of paths explicitly blocked from access
            log_dir: Directory for access logs
        """
        self.safety_level = safety_level
        
        # Setup default blocked paths for safety
        self._default_blocked = [
            "/etc", "/var", "/boot", "/dev", "/proc", "/sys",
            "/root", "/usr/local/bin", "/usr/bin", "/bin",
            "C:\\Windows\\System32", "C:\\Windows\\SysWOW64",
            "C:\\Program Files", "C:\\Program Files (x86)"
        ]
        
        # Use provided paths or defaults
        self.allowed_paths = allowed_paths or self._get_default_allowed_paths()
        self.blocked_paths = blocked_paths or self._default_blocked
        
        # Set up logging
        if log_dir:
            self.log_dir = log_dir
        else:
            self.log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "logs")
        
        os.makedirs(self.log_dir, exist_ok=True)
        self.access_log_path = os.path.join(self.log_dir, "system_access.log")
        
        # Initialize access log handler
        self._setup_access_logging()
        
        # Track last access timestamps by category
        self.last_access = {
            "files": 0,
            "system_info": 0,
            "resources": 0,
            "scan": 0
        }
        
        logger.info(f"System Access Manager initialized with safety level: {safety_level}")
    
    def _get_default_allowed_paths(self) -> List[str]:
        """
        Get default allowed paths based on the operating system
        
        Returns:
            List of default allowed paths
        """
        # Start with user's home directory
        allowed = [os.path.expanduser("~")]
        
        # Add common document directories based on OS
        if platform.system() == "Windows":
            allowed.extend([
                os.path.join(os.path.expanduser("~"), "Documents"),
                os.path.join(os.path.expanduser("~"), "Desktop"),
                os.path.join(os.path.expanduser("~"), "Downloads")
            ])
        elif platform.system() == "Darwin":  # macOS
            allowed.extend([
                os.path.join(os.path.expanduser("~"), "Documents"),
                os.path.join(os.path.expanduser("~"), "Desktop"),
                os.path.join(os.path.expanduser("~"), "Downloads")
            ])
        else:  # Linux and others
            allowed.extend([
                os.path.join(os.path.expanduser("~"), "Documents"),
                os.path.join(os.path.expanduser("~"), "Desktop"),
                os.path.join(os.path.expanduser("~"), "Downloads")
            ])
        
        return allowed
    
    def _setup_access_logging(self):
        """
        Set up system access logging
        """
        # Create file handler for access log
        access_handler = logging.FileHandler(self.access_log_path)
        access_handler.setLevel(logging.INFO)
        access_formatter = logging.Formatter('%(asctime)s - %(message)s')
        access_handler.setFormatter(access_formatter)
        
        # Create separate logger for access log
        self.access_logger = logging.getLogger("lisa.system.access")
        self.access_logger.setLevel(logging.INFO)
        self.access_logger.addHandler(access_handler)
        self.access_logger.propagate = False  # Don't send to root logger
    
    def _log_access(self, operation: str, path: Optional[str] = None, details: Optional[str] = None):
        """
        Log system access operation
        
        Args:
            operation: Type of operation performed
            path: Path accessed (if applicable)
            details: Additional operation details
        """
        message = f"OPERATION: {operation}"
        
        if path:
            message += f" | PATH: {path}"
        
        if details:
            message += f" | DETAILS: {details}"
        
        self.access_logger.info(message)
    
    def _is_path_allowed(self, path: str) -> bool:
        """
        Check if a path is allowed for access
        
        Args:
            path: Path to check
            
        Returns:
            True if access is allowed, False otherwise
        """
        # Convert to absolute path for consistency
        abs_path = os.path.abspath(path)
        
        # Check if path is explicitly blocked
        for blocked in self.blocked_paths:
            if self._is_subpath(abs_path, blocked):
                logger.warning(f"Access denied to blocked path: {abs_path}")
                return False
        
        # Check if path is allowed
        # Low safety: allow all paths unless explicitly blocked
        if self.safety_level == "low":
            return True
        
        # Medium/High safety: only allow explicitly permitted paths
        for allowed in self.allowed_paths:
            if self._is_subpath(abs_path, allowed):
                return True
        
        logger.warning(f"Access denied to non-allowed path: {abs_path}")
        return False
    
    def _is_subpath(self, path: str, base: str) -> bool:
        """
        Check if path is at or below the base path
        
        Args:
            path: Path to check
            base: Base path
            
        Returns:
            True if path is at or below base path, False otherwise
        """
        # Normalize both paths
        path = os.path.normpath(os.path.abspath(path))
        base = os.path.normpath(os.path.abspath(base))
        
        # Check if path starts with base path
        return path == base or path.startswith(base + os.sep)
    
    def _rate_limit_check(self, category: str, min_interval: float = 1.0) -> bool:
        """
        Check if an operation should be rate limited
        
        Args:
            category: Operation category
            min_interval: Minimum time between operations in seconds
            
        Returns:
            True if operation is allowed, False if rate limited
        """
        current_time = time.time()
        last_time = self.last_access.get(category, 0)
        
        # Allow if enough time has passed
        if current_time - last_time >= min_interval:
            self.last_access[category] = current_time
            return True
        
        return False
    
    def get_system_info(self) -> Dict[str, str]:
        """
        Get basic system information
        
        Returns:
            Dictionary with system information
        """
        # Rate limit check
        if not self._rate_limit_check("system_info", 5.0):
            logger.warning("Rate limit exceeded for system info access")
            return {"error": "Rate limit exceeded. Please try again later."}
        
        # Log access
        self._log_access("get_system_info")
        
        info = {
            "system": platform.system(),
            "node": platform.node(),
            "release": platform.release(),
            "version": platform.version(),
            "machine": platform.machine(),
            "processor": platform.processor(),
            "python_version": platform.python_version(),
            "timezone": time.strftime("%z", time.localtime())
        }
        
        # Add additional info if psutil is available
        if PSUTIL_AVAILABLE:
            boot_time = datetime.fromtimestamp(psutil.boot_time()).strftime("%Y-%m-%d %H:%M:%S")
            info["uptime"] = boot_time
            
            if hasattr(psutil, "cpu_freq") and psutil.cpu_freq():
                info["cpu_freq"] = f"{psutil.cpu_freq().current:.2f} MHz"
            
            info["cpu_cores"] = f"{psutil.cpu_count(logical=False)} physical, {psutil.cpu_count()} logical"
            
            memory = psutil.virtual_memory()
            info["memory_total"] = f"{memory.total / (1024**3):.2f} GB"
        
        return info
    
    def list_files(self, path: str) -> List[Dict[str, Any]]:
        """
        List files and directories in a specified path
        
        Args:
            path: Path to list contents of
            
        Returns:
            List of dictionaries with file/directory information
        """
        # Rate limit check
        if not self._rate_limit_check("files", 0.5):
            logger.warning("Rate limit exceeded for file listing")
            return [{"error": "Rate limit exceeded. Please try again later."}]
        
        # Check if path is allowed
        if not self._is_path_allowed(path):
            return [{"error": f"Access denied to path: {path}"}]
        
        # Log access
        self._log_access("list_files", path)
        
        try:
            result = []
            
            # Get all items in the directory
            with os.scandir(path) as entries:
                for entry in entries:
                    # Skip hidden files in medium/high safety mode
                    if self.safety_level != "low" and entry.name.startswith('.'):
                        continue
                    
                    try:
                        stats = entry.stat()
                        item = {
                            "name": entry.name,
                            "path": os.path.join(path, entry.name),
                            "is_dir": entry.is_dir(),
                            "size": stats.st_size if not entry.is_dir() else 0,
                            "modified": datetime.fromtimestamp(stats.st_mtime).strftime("%Y-%m-%d %H:%M:%S")
                        }
                        
                        # Add additional details for files
                        if not entry.is_dir():
                            # Get file extension
                            _, ext = os.path.splitext(entry.name)
                            item["extension"] = ext.lower() if ext else ""
                        
                        result.append(item)
                    except (PermissionError, OSError) as e:
                        # Skip files we can't access
                        logger.debug(f"Error accessing {entry.path}: {str(e)}")
            
            # Sort result: directories first, then files
            result.sort(key=lambda x: (not x["is_dir"], x["name"].lower()))
            
            return result
            
        except Exception as e:
            logger.error(f"Error listing files in {path}: {str(e)}")
            return [{"error": f"Error listing files: {str(e)}"}]
    
    def search_files(self, query: str, path: Optional[str] = None, 
                    recursive: bool = True, 
                    max_results: int = 100) -> List[Dict[str, Any]]:
        """
        Search for files matching a pattern
        
        Args:
            query: Search pattern
            path: Path to search in (defaults to user home)
            recursive: Whether to search recursively
            max_results: Maximum number of results to return
            
        Returns:
            List of matching files with metadata
        """
        # Rate limit check
        if not self._rate_limit_check("files", 3.0):
            logger.warning("Rate limit exceeded for file search")
            return [{"error": "Rate limit exceeded. Please try again later."}]
        
        # Use home directory if no path provided
        if not path:
            path = os.path.expanduser("~")
        
        # Check if path is allowed
        if not self._is_path_allowed(path):
            return [{"error": f"Access denied to path: {path}"}]
        
        # Log access
        self._log_access("search_files", path, f"query: {query}, recursive: {recursive}")
        
        try:
            results = []
            count = 0
            
            # Check if it's a regex pattern
            is_regex = False
            regex_pattern = None
            try:
                regex_pattern = re.compile(query, re.IGNORECASE)
                is_regex = True
            except re.error:
                # Not a valid regex, use glob pattern instead
                pass
            
            if is_regex:
                # Manual walk through directory for regex search
                for root, dirs, files in os.walk(path):
                    # Skip directories in blocked paths
                    if not self._is_path_allowed(root):
                        dirs.clear()  # Don't traverse further down this path
                        continue
                    
                    # Skip hidden directories in medium/high safety mode
                    if self.safety_level != "low":
                        dirs[:] = [d for d in dirs if not d.startswith('.')]
                        files = [f for f in files if not f.startswith('.')]
                    
                    # Search in current directory
                    for file in files:
                        if regex_pattern.search(file):
                            file_path = os.path.join(root, file)
                            try:
                                stats = os.stat(file_path)
                                results.append({
                                    "name": file,
                                    "path": file_path,
                                    "size": stats.st_size,
                                    "modified": datetime.fromtimestamp(stats.st_mtime).strftime("%Y-%m-%d %H:%M:%S")
                                })
                                count += 1
                                if count >= max_results:
                                    break
                            except (PermissionError, OSError):
                                # Skip files we can't access
                                pass
                    
                    # Stop if we've reached max results
                    if count >= max_results:
                        break
                    
                    # Don't recurse if recursive is False
                    if not recursive:
                        break
            else:
                # Use glob for simple wildcard patterns
                # Add wildcards if not present
                if '*' not in query and '?' not in query:
                    query = f"*{query}*"
                
                # Use recursive glob if needed
                if recursive and hasattr(glob, 'glob') and callable(getattr(glob, 'glob')):
                    pattern = os.path.join(path, '**', query)
                    file_paths = glob.glob(pattern, recursive=True)
                else:
                    pattern = os.path.join(path, query)
                    file_paths = glob.glob(pattern)
                
                # Process the files found
                for file_path in file_paths[:max_results]:
                    # Check if path is allowed
                    if not self._is_path_allowed(file_path):
                        continue
                    
                    try:
                        stats = os.stat(file_path)
                        results.append({
                            "name": os.path.basename(file_path),
                            "path": file_path,
                            "size": stats.st_size,
                            "is_dir": os.path.isdir(file_path),
                            "modified": datetime.fromtimestamp(stats.st_mtime).strftime("%Y-%m-%d %H:%M:%S")
                        })
                    except (PermissionError, OSError):
                        # Skip files we can't access
                        pass
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching for files: {str(e)}")
            return [{"error": f"Error searching for files: {str(e)}"}]
    
    def get_resource_usage(self) -> Dict[str, Any]:
        """
        Get system resource usage (CPU, memory, disk, network)
        
        Returns:
            Dictionary with resource usage information
        """
        # Rate limit check
        if not self._rate_limit_check("resources", 2.0):
            logger.warning("Rate limit exceeded for resource monitoring")
            return {"error": "Rate limit exceeded. Please try again later."}
        
        # Log access
        self._log_access("get_resource_usage")
        
        if not PSUTIL_AVAILABLE:
            return {"error": "psutil library not available. Install with pip install psutil"}
        
        try:
            result = {}
            
            # CPU info
            result["cpu_percent"] = psutil.cpu_percent(interval=0.5)
            result["cpu_count"] = psutil.cpu_count()
            result["cpu_freq"] = psutil.cpu_freq().current if psutil.cpu_freq() else "N/A"
            
            # Memory info
            memory = psutil.virtual_memory()
            result["memory_total"] = memory.total / (1024**3)  # GB
            result["memory_used"] = memory.used / (1024**3)  # GB
            result["memory_percent"] = memory.percent
            
            # Disk info
            disk = psutil.disk_usage('/')
            result["disk_total"] = disk.total / (1024**3)  # GB
            result["disk_used"] = disk.used / (1024**3)  # GB
            result["disk_percent"] = disk.percent
            
            # Network info
            if hasattr(psutil, "net_io_counters"):
                net_io = psutil.net_io_counters()
                result["network_bytes_sent"] = net_io.bytes_sent
                result["network_bytes_recv"] = net_io.bytes_recv
                
                # Calculate network speed if we have previous readings
                if hasattr(self, "_last_net_io"):
                    last_io, last_time = self._last_net_io
                    time_diff = time.time() - last_time
                    if time_diff > 0:
                        result["network_up"] = (net_io.bytes_sent - last_io.bytes_sent) / time_diff / (1024**2)  # MB/s
                        result["network_down"] = (net_io.bytes_recv - last_io.bytes_recv) / time_diff / (1024**2)  # MB/s
                
                # Store current readings for next time
                self._last_net_io = (net_io, time.time())
                
                # If we don't have network speed yet, estimate it as 0
                if "network_up" not in result:
                    result["network_up"] = 0
                    result["network_down"] = 0
            
            # Top processes by CPU and memory
            processes = []
            for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info']):
                try:
                    pinfo = proc.info
                    processes.append({
                        'pid': pinfo['pid'],
                        'name': pinfo['name'],
                        'cpu': pinfo['cpu_percent'],
                        'memory': pinfo['memory_info'].rss / (1024**2) if pinfo['memory_info'] else 0  # MB
                    })
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    pass
            
            # Sort by CPU usage (descending)
            processes.sort(key=lambda p: p['cpu'], reverse=True)
            result['top_processes'] = processes[:10]  # Top 10 processes
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting resource usage: {str(e)}")
            return {"error": f"Error getting resource usage: {str(e)}"}
    
    def scan_system_health(self) -> List[Dict[str, Any]]:
        """
        Scan system for potential issues
        
        Returns:
            List of detected issues
        """
        # Rate limit check
        if not self._rate_limit_check("scan", 60.0):  # Limit to once per minute
            logger.warning("Rate limit exceeded for system health scan")
            return [{"error": "Rate limit exceeded. Please try again later."}]
        
        # Log access
        self._log_access("scan_system_health")
        
        if not PSUTIL_AVAILABLE:
            return [{"error": "psutil library not available. Install with pip install psutil"}]
        
        try:
            issues = []
            
            # Check CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            if cpu_percent > 90:
                issues.append({
                    "severity": "high",
                    "component": "CPU",
                    "description": f"CPU usage is critically high at {cpu_percent}%",
                    "recommendation": "Check for resource-intensive processes and consider terminating them."
                })
            elif cpu_percent > 75:
                issues.append({
                    "severity": "medium",
                    "component": "CPU",
                    "description": f"CPU usage is high at {cpu_percent}%",
                    "recommendation": "Monitor system performance and check for unexpected resource usage."
                })
            
            # Check memory usage
            memory = psutil.virtual_memory()
            if memory.percent > 90:
                issues.append({
                    "severity": "high",
                    "component": "Memory",
                    "description": f"Memory usage is critically high at {memory.percent}%",
                    "recommendation": "Close unnecessary applications or add more RAM."
                })
            elif memory.percent > 80:
                issues.append({
                    "severity": "medium",
                    "component": "Memory",
                    "description": f"Memory usage is high at {memory.percent}%",
                    "recommendation": "Consider closing some applications to free up memory."
                })
            
            # Check disk space
            for partition in psutil.disk_partitions():
                try:
                    if not partition.mountpoint:
                        continue
                    
                    usage = psutil.disk_usage(partition.mountpoint)
                    if usage.percent > 90:
                        issues.append({
                            "severity": "high",
                            "component": "Disk",
                            "description": f"Disk usage is critically high at {usage.percent}% on {partition.mountpoint}",
                            "recommendation": "Free up disk space by removing unnecessary files or expanding storage."
                        })
                    elif usage.percent > 80:
                        issues.append({
                            "severity": "medium",
                            "component": "Disk",
                            "description": f"Disk usage is high at {usage.percent}% on {partition.mountpoint}",
                            "recommendation": "Consider cleaning up disk space soon."
                        })
                except (PermissionError, FileNotFoundError):
                    # Skip partitions we can't access
                    pass
            
            # Check for high-CPU processes
            for proc in psutil.process_iter(['pid', 'name', 'cpu_percent']):
                try:
                    pinfo = proc.info
                    if pinfo['cpu_percent'] > 50:
                        issues.append({
                            "severity": "medium",
                            "component": "Process",
                            "description": f"Process {pinfo['name']} (PID: {pinfo['pid']}) is using {pinfo['cpu_percent']}% CPU",
                            "recommendation": "Investigate why this process is using so much CPU."
                        })
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    pass
            
            # Battery check for laptops
            if hasattr(psutil, "sensors_battery"):
                battery = psutil.sensors_battery()
                if battery and not battery.power_plugged and battery.percent < 20:
                    issues.append({
                        "severity": "high" if battery.percent < 10 else "medium",
                        "component": "Battery",
                        "description": f"Battery is low at {battery.percent}% and not charging",
                        "recommendation": "Connect power adapter soon."
                    })
            
            # Temperature check if available
            if hasattr(psutil, "sensors_temperatures"):
                temps = psutil.sensors_temperatures()
                for name, entries in temps.items():
                    for entry in entries:
                        if entry.current > 90:  # Celsius
                            issues.append({
                                "severity": "high",
                                "component": "Temperature",
                                "description": f"{name} temperature is critically high at {entry.current}°C",
                                "recommendation": "Check cooling systems and ensure proper ventilation."
                            })
                        elif entry.current > 80:
                            issues.append({
                                "severity": "medium",
                                "component": "Temperature",
                                "description": f"{name} temperature is high at {entry.current}°C",
                                "recommendation": "Ensure proper cooling and ventilation."
                            })
            
            return issues
            
        except Exception as e:
            logger.error(f"Error scanning system health: {str(e)}")
            return [{"error": f"Error scanning system health: {str(e)}"}]
    
    def read_file_content(self, path: str, max_size: int = 1024 * 1024) -> Dict[str, Any]:
        """
        Read content of a file
        
        Args:
            path: Path to the file
            max_size: Maximum file size to read (bytes)
            
        Returns:
            Dictionary with file content and metadata
        """
        # Rate limit check
        if not self._rate_limit_check("files", 0.5):
            logger.warning("Rate limit exceeded for file reading")
            return {"error": "Rate limit exceeded. Please try again later."}
        
        # Check if path is allowed
        if not self._is_path_allowed(path):
            return {"error": f"Access denied to path: {path}"}
        
        # Log access
        self._log_access("read_file", path)
        
        try:
            # Check if file exists
            if not os.path.isfile(path):
                return {"error": f"File not found: {path}"}
            
            # Check file size
            file_size = os.path.getsize(path)
            if file_size > max_size:
                return {"error": f"File is too large: {file_size} bytes (max: {max_size} bytes)"}
            
            # Get file stats
            stats = os.stat(path)
            
            # Read file content
            encoding = 'utf-8'
            try:
                with open(path, 'r', encoding=encoding) as f:
                    content = f.read()
            except UnicodeDecodeError:
                # Try reading as binary
                with open(path, 'rb') as f:
                    binary_content = f.read()
                    # Return truncated hexdump for binary files
                    content = binary_content[:1024].hex()
                    encoding = 'binary'
            
            return {
                "path": path,
                "content": content,
                "encoding": encoding,
                "size": file_size,
                "modified": datetime.fromtimestamp(stats.st_mtime).strftime("%Y-%m-%d %H:%M:%S")
            }
            
        except Exception as e:
            logger.error(f"Error reading file {path}: {str(e)}")
            return {"error": f"Error reading file: {str(e)}"}
    
    def search_file_content(self, path: str, pattern: str, 
                           max_results: int = 100) -> Dict[str, Any]:
        """
        Search for pattern in a file
        
        Args:
            path: Path to the file
            pattern: Search pattern (string or regex)
            max_results: Maximum number of results to return
            
        Returns:
            Dictionary with search results and metadata
        """
        # Rate limit check
        if not self._rate_limit_check("files", 1.0):
            logger.warning("Rate limit exceeded for file content search")
            return {"error": "Rate limit exceeded. Please try again later."}
        
        # Check if path is allowed
        if not self._is_path_allowed(path):
            return {"error": f"Access denied to path: {path}"}
        
        # Log access
        self._log_access("search_file_content", path, f"pattern: {pattern}")
        
        try:
            # Read file content
            file_result = self.read_file_content(path)
            if "error" in file_result:
                return file_result
            
            content = file_result["content"]
            
            # Skip binary files
            if file_result["encoding"] == "binary":
                return {"error": "Cannot search binary files"}
            
            # Compile regex pattern
            try:
                regex = re.compile(pattern, re.IGNORECASE)
            except re.error:
                return {"error": f"Invalid regex pattern: {pattern}"}
            
            # Find all matches
            matches = []
            line_num = 0
            
            for line in content.splitlines():
                line_num += 1
                for match in regex.finditer(line):
                    start, end = match.span()
                    context_start = max(0, start - 20)
                    context_end = min(len(line), end + 20)
                    
                    matches.append({
                        "line": line_num,
                        "text": line[start:end],
                        "context": line[context_start:context_end],
                        "position": (start, end)
                    })
                    
                    if len(matches) >= max_results:
                        break
                
                if len(matches) >= max_results:
                    break
            
            return {
                "path": path,
                "pattern": pattern,
                "matches": matches,
                "match_count": len(matches),
                "file_size": file_result["size"]
            }
            
        except Exception as e:
            logger.error(f"Error searching in file {path}: {str(e)}")
            return {"error": f"Error searching file: {str(e)}"}


# For testing
if __name__ == "__main__":
    system_access = SystemAccessManager()
    print("System info:", json.dumps(system_access.get_system_info(), indent=2))
    print("\nFiles in home directory:", json.dumps(system_access.list_files(os.path.expanduser("~"))[:3], indent=2))
