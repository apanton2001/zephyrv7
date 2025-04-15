import asyncio
import logging
import time
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable, Awaitable
import os
import signal
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("task-scheduler")

class Task:
    """Represents a scheduled task with metadata and execution details."""
    
    def __init__(
        self,
        task_id: str,
        task_type: str,
        params: Dict[str, Any],
        schedule_time: datetime,
        priority: int = 1,
        max_retries: int = 3,
        retry_delay: int = 300,  # 5 minutes
        timeout: int = 3600,  # 1 hour
        callback_url: Optional[str] = None
    ):
        self.task_id = task_id
        self.task_type = task_type
        self.params = params
        self.schedule_time = schedule_time
        self.priority = priority
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self.timeout = timeout
        self.callback_url = callback_url
        
        # Runtime attributes
        self.status = "scheduled"  # scheduled, running, completed, failed, cancelled
        self.retry_count = 0
        self.start_time: Optional[datetime] = None
        self.end_time: Optional[datetime] = None
        self.result: Optional[Any] = None
        self.error: Optional[str] = None
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert the task to a dictionary for serialization."""
        return {
            "task_id": self.task_id,
            "task_type": self.task_type,
            "params": self.params,
            "schedule_time": self.schedule_time.isoformat(),
            "priority": self.priority,
            "max_retries": self.max_retries,
            "retry_delay": self.retry_delay,
            "timeout": self.timeout,
            "callback_url": self.callback_url,
            "status": self.status,
            "retry_count": self.retry_count,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "result": self.result,
            "error": self.error
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Task':
        """Create a Task from a dictionary."""
        task = cls(
            task_id=data["task_id"],
            task_type=data["task_type"],
            params=data["params"],
            schedule_time=datetime.fromisoformat(data["schedule_time"]),
            priority=data.get("priority", 1),
            max_retries=data.get("max_retries", 3),
            retry_delay=data.get("retry_delay", 300),
            timeout=data.get("timeout", 3600),
            callback_url=data.get("callback_url")
        )
        
        task.status = data.get("status", "scheduled")
        task.retry_count = data.get("retry_count", 0)
        
        if data.get("start_time"):
            task.start_time = datetime.fromisoformat(data["start_time"])
        
        if data.get("end_time"):
            task.end_time = datetime.fromisoformat(data["end_time"])
            
        task.result = data.get("result")
        task.error = data.get("error")
        
        return task

class TaskScheduler:
    """A scheduler for managing and executing asynchronous tasks."""
    
    def __init__(self, max_concurrent_tasks: int = 5, storage_path: str = None):
        self.tasks: Dict[str, Task] = {}
        self.task_queue: asyncio.PriorityQueue = asyncio.PriorityQueue()
        self.max_concurrent_tasks = max_concurrent_tasks
        self.running_tasks: Dict[str, asyncio.Task] = {}
        self.storage_path = storage_path or "tasks.json"
        self.handlers: Dict[str, Callable[[Task], Awaitable[Any]]] = {}
        self.is_running = False
        self.load_tasks()
        
    def register_handler(self, task_type: str, handler: Callable[[Task], Awaitable[Any]]):
        """Register a handler function for a specific task type."""
        self.handlers[task_type] = handler
        logger.info(f"Registered handler for task type: {task_type}")
        
    def schedule_task(self, task: Task) -> str:
        """Schedule a new task for execution."""
        self.tasks[task.task_id] = task
        priority_item = (task.priority, task.schedule_time.timestamp(), task.task_id)
        self.task_queue.put_nowait((priority_item, task.task_id))
        self.save_tasks()
        logger.info(f"Scheduled task {task.task_id} of type {task.task_type} for {task.schedule_time}")
        return task.task_id
    
    def cancel_task(self, task_id: str) -> bool:
        """Cancel a scheduled task if it hasn't started yet."""
        if task_id not in self.tasks:
            return False
            
        task = self.tasks[task_id]
        if task.status in ["scheduled", "running"]:
            task.status = "cancelled"
            
            # If the task is currently running, cancel it
            if task_id in self.running_tasks:
                self.running_tasks[task_id].cancel()
                
            self.save_tasks()
            logger.info(f"Cancelled task {task_id}")
            return True
        return False
    
    def get_task(self, task_id: str) -> Optional[Task]:
        """Get a task by its ID."""
        return self.tasks.get(task_id)
    
    def get_all_tasks(self) -> List[Task]:
        """Get all tasks."""
        return list(self.tasks.values())
    
    def get_tasks_by_status(self, status: str) -> List[Task]:
        """Get tasks filtered by status."""
        return [task for task in self.tasks.values() if task.status == status]
    
    async def _execute_task(self, task: Task):
        """Execute a single task with its registered handler."""
        if task.task_type not in self.handlers:
            task.status = "failed"
            task.error = f"No handler registered for task type: {task.task_type}"
            logger.error(task.error)
            self.save_tasks()
            return
        
        # Update task status
        task.status = "running"
        task.start_time = datetime.now()
        self.save_tasks()
        
        try:
            handler = self.handlers[task.task_type]
            logger.info(f"Executing task {task.task_id} of type {task.task_type}")
            
            # Execute with timeout
            result = await asyncio.wait_for(handler(task), timeout=task.timeout)
            
            task.status = "completed"
            task.result = result
            logger.info(f"Task {task.task_id} completed successfully")
            
        except asyncio.TimeoutError:
            task.status = "failed"
            task.error = f"Task execution timed out after {task.timeout} seconds"
            logger.error(f"Task {task.task_id} timed out")
            
            # Handle retry logic
            if task.retry_count < task.max_retries:
                task.retry_count += 1
                task.status = "scheduled"
                task.schedule_time = datetime.now() + timedelta(seconds=task.retry_delay)
                priority_item = (task.priority, task.schedule_time.timestamp(), task.task_id)
                await self.task_queue.put((priority_item, task.task_id))
                logger.info(f"Task {task.task_id} rescheduled for retry #{task.retry_count}")
            
        except Exception as e:
            task.status = "failed"
            task.error = str(e)
            logger.error(f"Task {task.task_id} failed with error: {e}")
            
            # Handle retry logic
            if task.retry_count < task.max_retries:
                task.retry_count += 1
                task.status = "scheduled"
                task.schedule_time = datetime.now() + timedelta(seconds=task.retry_delay)
                priority_item = (task.priority, task.schedule_time.timestamp(), task.task_id)
                await self.task_queue.put((priority_item, task.task_id))
                logger.info(f"Task {task.task_id} rescheduled for retry #{task.retry_count}")
        
        finally:
            task.end_time = datetime.now()
            # Remove from running tasks
            if task.task_id in self.running_tasks:
                del self.running_tasks[task.task_id]
            self.save_tasks()
            
            # Handle callbacks
            if task.callback_url and task.status in ["completed", "failed"]:
                await self._send_callback(task)
    
    async def _send_callback(self, task: Task):
        """Send a callback notification for a completed or failed task."""
        try:
            import aiohttp
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    task.callback_url,
                    json=task.to_dict(),
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status >= 400:
                        logger.warning(f"Callback for task {task.task_id} failed with status {response.status}")
                    else:
                        logger.info(f"Callback for task {task.task_id} sent successfully")
        except Exception as e:
            logger.error(f"Failed to send callback for task {task.task_id}: {e}")
    
    async def _worker(self):
        """Task scheduler worker process that handles the execution queue."""
        logger.info("Task scheduler worker started")
        
        while self.is_running:
            try:
                # Check if we can take more tasks
                if len(self.running_tasks) >= self.max_concurrent_tasks:
                    await asyncio.sleep(1)
                    continue
                
                # Get the next task from the queue
                try:
                    (_, task_id) = await asyncio.wait_for(self.task_queue.get(), timeout=1)
                except asyncio.TimeoutError:
                    continue
                
                if task_id not in self.tasks:
                    logger.warning(f"Task {task_id} not found in tasks dictionary")
                    self.task_queue.task_done()
                    continue
                
                task = self.tasks[task_id]
                
                # Skip if task is cancelled
                if task.status == "cancelled":
                    self.task_queue.task_done()
                    continue
                
                # Check if it's time to execute the task
                now = datetime.now()
                if task.schedule_time > now:
                    # Re-queue with the same priority
                    priority_item = (task.priority, task.schedule_time.timestamp(), task.task_id)
                    await self.task_queue.put((priority_item, task_id))
                    self.task_queue.task_done()
                    await asyncio.sleep(1)
                    continue
                
                # Execute the task
                runner = asyncio.create_task(self._execute_task(task))
                self.running_tasks[task_id] = runner
                self.task_queue.task_done()
            
            except asyncio.CancelledError:
                logger.info("Worker task was cancelled")
                break
            except Exception as e:
                logger.error(f"Error in worker task: {e}")
                await asyncio.sleep(5)  # Avoid tight loop in case of persistent errors
    
    def save_tasks(self):
        """Save tasks to persistent storage."""
        try:
            with open(self.storage_path, 'w') as f:
                task_data = {task_id: task.to_dict() for task_id, task in self.tasks.items()}
                json.dump(task_data, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save tasks: {e}")
    
    def load_tasks(self):
        """Load tasks from persistent storage."""
        try:
            if os.path.exists(self.storage_path):
                with open(self.storage_path, 'r') as f:
                    task_data = json.load(f)
                    for task_id, data in task_data.items():
                        task = Task.from_dict(data)
                        self.tasks[task_id] = task
                        
                        # Only re-queue scheduled tasks
                        if task.status == "scheduled":
                            priority_item = (task.priority, task.schedule_time.timestamp(), task.task_id)
                            self.task_queue.put_nowait((priority_item, task_id))
                    
                    logger.info(f"Loaded {len(task_data)} tasks from storage")
        except Exception as e:
            logger.error(f"Failed to load tasks: {e}")
    
    async def start(self):
        """Start the task scheduler."""
        if self.is_running:
            return
            
        self.is_running = True
        self.worker_task = asyncio.create_task(self._worker())
        logger.info("Task scheduler started")
        
        # Setup signal handlers for graceful shutdown
        for sig in (signal.SIGINT, signal.SIGTERM):
            asyncio.get_event_loop().add_signal_handler(
                sig, lambda s=sig: asyncio.create_task(self.shutdown(sig))
            )
    
    async def shutdown(self, signal=None):
        """Shutdown the task scheduler gracefully."""
        if signal:
            logger.info(f"Received exit signal {signal.name}")
            
        logger.info("Shutting down task scheduler...")
        self.is_running = False
        
        # Cancel the worker task
        if hasattr(self, 'worker_task'):
            self.worker_task.cancel()
            try:
                await self.worker_task
            except asyncio.CancelledError:
                pass
        
        # Cancel all running tasks
        if self.running_tasks:
            logger.info(f"Cancelling {len(self.running_tasks)} running tasks")
            for task_id, task in list(self.running_tasks.items()):
                task.cancel()
                self.tasks[task_id].status = "cancelled"
                
            await asyncio.gather(*self.running_tasks.values(), return_exceptions=True)
        
        # Save final state
        self.save_tasks()
        logger.info("Task scheduler shutdown complete")


# Example usage
async def example_task_handler(task: Task) -> Dict[str, Any]:
    """Example handler for demonstration purposes."""
    task_type = task.task_type
    params = task.params
    
    logger.info(f"Processing task {task.task_id} of type {task_type} with params: {params}")
    
    # Simulate work
    await asyncio.sleep(2)
    
    return {"status": "success", "message": f"Task {task.task_id} processed successfully"}

async def main():
    # Create the scheduler
    scheduler = TaskScheduler(max_concurrent_tasks=5, storage_path="tasks.json")
    
    # Register handlers
    scheduler.register_handler("web_scraping", example_task_handler)
    scheduler.register_handler("data_processing", example_task_handler)
    
    # Start the scheduler
    await scheduler.start()
    
    # Schedule some tasks
    task1 = Task(
        task_id="task1",
        task_type="web_scraping",
        params={"url": "https://example.com", "selectors": [".product-title", ".product-price"]},
        schedule_time=datetime.now(),
        priority=1
    )
    
    task2 = Task(
        task_id="task2",
        task_type="data_processing",
        params={"dataset": "sales_data", "operation": "aggregate"},
        schedule_time=datetime.now() + timedelta(seconds=5),
        priority=2
    )
    
    scheduler.schedule_task(task1)
    scheduler.schedule_task(task2)
    
    try:
        # Run for a while
        await asyncio.sleep(30)
    finally:
        # Shutdown
        await scheduler.shutdown()

if __name__ == "__main__":
    asyncio.run(main())
