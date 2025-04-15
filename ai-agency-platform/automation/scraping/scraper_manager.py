import asyncio
import logging
import os
import json
import time
import uuid
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
import importlib.util
import sys
import random
import traceback

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("scraper-manager")

class ScraperConfig:
    """Configuration for a web scraper."""
    
    def __init__(
        self,
        name: str,
        scraper_type: str = "scrapy",  # scrapy, selenium, beautifulsoup
        target_urls: List[str] = None,
        selectors: Dict[str, str] = None,
        pagination: Dict[str, Any] = None,
        proxy_settings: Dict[str, Any] = None,
        user_agents: List[str] = None,
        rate_limit: float = 1.0,  # requests per second
        max_pages: int = 10,
        timeout: int = 30,
        retry_count: int = 3,
        headers: Dict[str, str] = None,
        cookies: Dict[str, str] = None,
        javascript_enabled: bool = False,
        wait_for_selectors: List[str] = None,
        custom_script_path: Optional[str] = None,
        output_format: str = "json",  # json, csv, xml
        extra_settings: Dict[str, Any] = None
    ):
        self.name = name
        self.scraper_type = scraper_type
        self.target_urls = target_urls or []
        self.selectors = selectors or {}
        self.pagination = pagination or {}
        self.proxy_settings = proxy_settings or {}
        self.user_agents = user_agents or []
        self.rate_limit = rate_limit
        self.max_pages = max_pages
        self.timeout = timeout
        self.retry_count = retry_count
        self.headers = headers or {}
        self.cookies = cookies or {}
        self.javascript_enabled = javascript_enabled
        self.wait_for_selectors = wait_for_selectors or []
        self.custom_script_path = custom_script_path
        self.output_format = output_format
        self.extra_settings = extra_settings or {}
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert the config to a dictionary."""
        return {
            "name": self.name,
            "scraper_type": self.scraper_type,
            "target_urls": self.target_urls,
            "selectors": self.selectors,
            "pagination": self.pagination,
            "proxy_settings": self.proxy_settings,
            "user_agents": self.user_agents,
            "rate_limit": self.rate_limit,
            "max_pages": self.max_pages,
            "timeout": self.timeout,
            "retry_count": self.retry_count,
            "headers": self.headers,
            "cookies": self.cookies,
            "javascript_enabled": self.javascript_enabled,
            "wait_for_selectors": self.wait_for_selectors,
            "custom_script_path": self.custom_script_path,
            "output_format": self.output_format,
            "extra_settings": self.extra_settings
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ScraperConfig':
        """Create a ScraperConfig from a dictionary."""
        return cls(**data)

class ScrapingTask:
    """A task for scraping data from websites."""
    
    def __init__(
        self,
        task_id: str,
        config: ScraperConfig,
        created_at: datetime = None,
        status: str = "pending",  # pending, running, completed, failed
        result_path: Optional[str] = None,
        error: Optional[str] = None,
        stats: Dict[str, Any] = None
    ):
        self.task_id = task_id
        self.config = config
        self.created_at = created_at or datetime.now()
        self.status = status
        self.start_time: Optional[datetime] = None
        self.end_time: Optional[datetime] = None
        self.result_path = result_path
        self.error = error
        self.stats = stats or {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the task to a dictionary."""
        return {
            "task_id": self.task_id,
            "config": self.config.to_dict(),
            "created_at": self.created_at.isoformat(),
            "status": self.status,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "result_path": self.result_path,
            "error": self.error,
            "stats": self.stats
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ScrapingTask':
        """Create a ScrapingTask from a dictionary."""
        config = ScraperConfig.from_dict(data["config"])
        task = cls(
            task_id=data["task_id"],
            config=config,
            created_at=datetime.fromisoformat(data["created_at"]),
            status=data["status"],
            result_path=data["result_path"],
            error=data["error"],
            stats=data["stats"]
        )
        
        if data.get("start_time"):
            task.start_time = datetime.fromisoformat(data["start_time"])
        
        if data.get("end_time"):
            task.end_time = datetime.fromisoformat(data["end_time"])
            
        return task

class ScraperManager:
    """Manager for web scraping operations."""
    
    def __init__(
        self,
        base_dir: str = None,
        output_dir: str = "scraping_results",
        max_concurrent_tasks: int = 5,
        proxy_rotation_enabled: bool = True,
        default_user_agents: List[str] = None
    ):
        self.base_dir = base_dir or os.path.dirname(os.path.abspath(__file__))
        self.output_dir = os.path.join(self.base_dir, output_dir)
        self.max_concurrent_tasks = max_concurrent_tasks
        self.proxy_rotation_enabled = proxy_rotation_enabled
        self.default_user_agents = default_user_agents or [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36"
        ]
        
        self.running_tasks: Dict[str, asyncio.Task] = {}
        self.task_history: Dict[str, ScrapingTask] = {}
        
        # Ensure output directory exists
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Initialize available proxies (just placeholders - in production, use actual proxies)
        self.available_proxies = [
            {"http": "http://proxy1.example.com:8080", "https": "https://proxy1.example.com:8080"},
            {"http": "http://proxy2.example.com:8080", "https": "https://proxy2.example.com:8080"}
        ]

    def _get_random_proxy(self) -> Dict[str, str]:
        """Get a random proxy from the pool."""
        if not self.available_proxies:
            return {}
        return random.choice(self.available_proxies)
    
    def _get_random_user_agent(self, config: ScraperConfig) -> str:
        """Get a random user agent."""
        user_agents = config.user_agents or self.default_user_agents
        if not user_agents:
            return "AI-Agency-Platform-Scraper/1.0"
        return random.choice(user_agents)
    
    async def create_task(self, config: ScraperConfig) -> str:
        """Create a new scraping task."""
        task_id = str(uuid.uuid4())
        scraping_task = ScrapingTask(task_id=task_id, config=config)
        self.task_history[task_id] = scraping_task
        
        # Save task state
        self._save_task_state(scraping_task)
        
        logger.info(f"Created scraping task {task_id} for {config.name}")
        return task_id
    
    async def start_task(self, task_id: str) -> bool:
        """Start a scraping task."""
        if task_id not in self.task_history:
            logger.error(f"Task {task_id} not found")
            return False
        
        if len(self.running_tasks) >= self.max_concurrent_tasks:
            logger.warning(f"Can't start task {task_id}. Max concurrent tasks reached.")
            return False
        
        task = self.task_history[task_id]
        if task.status != "pending":
            logger.warning(f"Task {task_id} is not in pending state (current: {task.status})")
            return False
        
        # Update task status
        task.status = "running"
        task.start_time = datetime.now()
        self._save_task_state(task)
        
        # Start task
        runner = asyncio.create_task(self._run_scraper(task))
        self.running_tasks[task_id] = runner
        
        logger.info(f"Started scraping task {task_id}")
        return True
    
    async def stop_task(self, task_id: str) -> bool:
        """Stop a running scraping task."""
        if task_id not in self.running_tasks:
            logger.warning(f"Task {task_id} is not running")
            return False
        
        # Cancel the task
        self.running_tasks[task_id].cancel()
        try:
            await self.running_tasks[task_id]
        except asyncio.CancelledError:
            pass
        
        # Update task status
        task = self.task_history[task_id]
        task.status = "cancelled"
        task.end_time = datetime.now()
        self._save_task_state(task)
        
        # Remove from running tasks
        del self.running_tasks[task_id]
        
        logger.info(f"Stopped scraping task {task_id}")
        return True
    
    def get_task(self, task_id: str) -> Optional[ScrapingTask]:
        """Get a task by its ID."""
        return self.task_history.get(task_id)
    
    def get_all_tasks(self) -> List[ScrapingTask]:
        """Get all tasks."""
        return list(self.task_history.values())
    
    def get_tasks_by_status(self, status: str) -> List[ScrapingTask]:
        """Get tasks filtered by status."""
        return [task for task in self.task_history.values() if task.status == status]
    
    def _save_task_state(self, task: ScrapingTask):
        """Save task state to disk."""
        state_dir = os.path.join(self.base_dir, "task_states")
        os.makedirs(state_dir, exist_ok=True)
        
        state_path = os.path.join(state_dir, f"{task.task_id}.json")
        with open(state_path, 'w') as f:
            json.dump(task.to_dict(), f, indent=2)
    
    def _load_task_states(self):
        """Load task states from disk."""
        state_dir = os.path.join(self.base_dir, "task_states")
        if not os.path.exists(state_dir):
            return
        
        for filename in os.listdir(state_dir):
            if filename.endswith(".json"):
                state_path = os.path.join(state_dir, filename)
                try:
                    with open(state_path, 'r') as f:
                        task_data = json.load(f)
                        task = ScrapingTask.from_dict(task_data)
                        self.task_history[task.task_id] = task
                except Exception as e:
                    logger.error(f"Failed to load task state from {filename}: {e}")
    
    async def _run_scrapy_scraper(self, task: ScrapingTask) -> Dict[str, Any]:
        """Run a Scrapy scraper."""
        try:
            from scrapy.crawler import CrawlerProcess
            from scrapy import Spider, Request
            from scrapy.selector import Selector
            import scrapy.settings
            from twisted.internet import reactor
            
            config = task.config
            results = []
            
            class DynamicSpider(Spider):
                name = config.name
                start_urls = config.target_urls
                
                custom_settings = {
                    'USER_AGENT': self._get_random_user_agent(config),
                    'DOWNLOAD_DELAY': 1.0 / config.rate_limit,
                    'CONCURRENT_REQUESTS_PER_DOMAIN': 1,
                    'RETRY_TIMES': config.retry_count,
                    'ROBOTSTXT_OBEY': False,
                    'DOWNLOAD_TIMEOUT': config.timeout,
                    'ITEM_PIPELINES': {'scrapy.pipelines.images.ImagesPipeline': 1},
                    'FEED_FORMAT': config.output_format,
                    'FEED_URI': f"{self.output_dir}/{task.task_id}.{config.output_format}"
                }
                
                if self.proxy_rotation_enabled and config.proxy_settings.get('enabled', False):
                    custom_settings['DOWNLOADER_MIDDLEWARES'] = {
                        'scrapy.downloadermiddlewares.httpproxy.HttpProxyMiddleware': 110,
                    }
                    custom_settings['PROXY_MODE'] = 'random'
                    custom_settings['PROXY_LIST'] = config.proxy_settings.get('proxy_list', [])
                
                def parse(self, response):
                    selectors = config.selectors
                    items = {}
                    
                    # Extract data based on selectors
                    for key, selector in selectors.items():
                        if selector.startswith('//'):  # XPath
                            items[key] = response.xpath(selector).getall()
                        else:  # CSS
                            items[key] = response.css(selector).getall()
                    
                    # Clean up extracted data (strip whitespace, etc.)
                    for key in items:
                        if isinstance(items[key], list):
                            items[key] = [i.strip() for i in items[key] if i.strip()]
                        elif isinstance(items[key], str):
                            items[key] = items[key].strip()
                    
                    results.append(items)
                    
                    # Handle pagination if configured
                    if 'next_page' in config.pagination and len(results) < config.max_pages:
                        next_page = None
                        selector = config.pagination['next_page']
                        
                        if selector.startswith('//'):  # XPath
                            next_pages = response.xpath(selector).getall()
                            if next_pages:
                                next_page = next_pages[0]
                        else:  # CSS
                            next_pages = response.css(selector).getall()
                            if next_pages:
                                next_page = next_pages[0]
                        
                        if next_page:
                            yield response.follow(next_page, self.parse)
            
            # Initialize CrawlerProcess
            settings = scrapy.settings.Settings()
            settings.setdict(DynamicSpider.custom_settings)
            
            process = CrawlerProcess(settings)
            process.crawl(DynamicSpider)
            
            # Run the spider
            process.start()
            
            # Results are saved to the file specified in FEED_URI
            result_path = f"{self.output_dir}/{task.task_id}.{config.output_format}"
            
            return {
                "result_path": result_path,
                "item_count": len(results),
                "stats": {
                    "pages_scraped": len(results),
                    "items_scraped": sum(len(items) for items in results)
                }
            }
            
        except Exception as e:
            logger.error(f"Scrapy scraper error: {e}")
            logger.error(traceback.format_exc())
            raise
    
    async def _run_selenium_scraper(self, task: ScrapingTask) -> Dict[str, Any]:
        """Run a Selenium scraper."""
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        from selenium.common.exceptions import TimeoutException, WebDriverException
        
        config = task.config
        results = []
        
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        
        # Set user agent
        chrome_options.add_argument(f"user-agent={self._get_random_user_agent(config)}")
        
        # Configure proxy if enabled
        if self.proxy_rotation_enabled and config.proxy_settings.get('enabled', False):
            proxy = self._get_random_proxy()
            if proxy:
                chrome_options.add_argument(f"--proxy-server={proxy['http']}")
        
        # Add headers and cookies in JavaScript
        custom_headers = json.dumps(config.headers)
        custom_cookies = json.dumps(config.cookies)
        
        try:
            driver = webdriver.Chrome(options=chrome_options)
            driver.set_page_load_timeout(config.timeout)
            
            for url in config.target_urls:
                try:
                    driver.get(url)
                    
                    # Set cookies
                    if config.cookies:
                        driver.execute_script(f"""
                            const cookies = {custom_cookies};
                            for (const [name, value] of Object.entries(cookies)) {{
                                document.cookie = `${{name}}=${{value}}`;
                            }}
                        """)
                    
                    # Wait for selectors if specified
                    if config.wait_for_selectors:
                        for selector in config.wait_for_selectors:
                            try:
                                WebDriverWait(driver, config.timeout).until(
                                    EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                                )
                            except TimeoutException:
                                logger.warning(f"Timeout waiting for selector: {selector}")
                    
                    # Extract data based on selectors
                    page_results = {}
                    
                    for key, selector in config.selectors.items():
                        try:
                            if selector.startswith('//'):  # XPath
                                elements = driver.find_elements(By.XPATH, selector)
                                page_results[key] = [el.text for el in elements]
                            else:  # CSS
                                elements = driver.find_elements(By.CSS_SELECTOR, selector)
                                page_results[key] = [el.text for el in elements]
                        except Exception as e:
                            logger.warning(f"Error extracting {key} with selector {selector}: {e}")
                            page_results[key] = []
                    
                    results.append(page_results)
                    
                    # Handle pagination if configured
                    page_count = 1
                    while page_count < config.max_pages and 'next_page' in config.pagination:
                        try:
                            selector = config.pagination['next_page']
                            if selector.startswith('//'):  # XPath
                                next_buttons = driver.find_elements(By.XPATH, selector)
                            else:  # CSS
                                next_buttons = driver.find_elements(By.CSS_SELECTOR, selector)
                            
                            if not next_buttons or not next_buttons[0].is_displayed() or not next_buttons[0].is_enabled():
                                break
                            
                            next_buttons[0].click()
                            
                            # Wait for page to load
                            await asyncio.sleep(1.0 / config.rate_limit)
                            
                            # Wait for selectors again
                            if config.wait_for_selectors:
                                for selector in config.wait_for_selectors:
                                    try:
                                        WebDriverWait(driver, config.timeout).until(
                                            EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                                        )
                                    except TimeoutException:
                                        logger.warning(f"Timeout waiting for selector: {selector}")
                            
                            # Extract data from new page
                            page_results = {}
                            
                            for key, selector in config.selectors.items():
                                try:
                                    if selector.startswith('//'):  # XPath
                                        elements = driver.find_elements(By.XPATH, selector)
                                        page_results[key] = [el.text for el in elements]
                                    else:  # CSS
                                        elements = driver.find_elements(By.CSS_SELECTOR, selector)
                                        page_results[key] = [el.text for el in elements]
                                except Exception as e:
                                    logger.warning(f"Error extracting {key} with selector {selector}: {e}")
                                    page_results[key] = []
                            
                            results.append(page_results)
                            page_count += 1
                            
                        except Exception as e:
                            logger.warning(f"Pagination error: {e}")
                            break
                            
                except WebDriverException as e:
                    logger.error(f"WebDriver error for URL {url}: {e}")
                except Exception as e:
                    logger.error(f"Error scraping URL {url}: {e}")
            
            # Save results
            output_file = f"{self.output_dir}/{task.task_id}.{config.output_format}"
            
            if config.output_format == 'json':
                with open(output_file, 'w') as f:
                    json.dump(results, f, indent=2)
            elif config.output_format == 'csv':
                import csv
                with open(output_file, 'w', newline='') as f:
                    if results and results[0]:
                        writer = csv.DictWriter(f, fieldnames=results[0].keys())
                        writer.writeheader()
                        for result in results:
                            writer.writerow(result)
            
            return {
                "result_path": output_file,
                "item_count": len(results),
                "stats": {
                    "pages_scraped": len(results),
                    "items_scraped": sum(len(page) for page in results)
                }
            }
            
        finally:
            driver.quit()
    
    async def _run_beautifulsoup_scraper(self, task: ScrapingTask) -> Dict[str, Any]:
        """Run a BeautifulSoup scraper."""
        import requests
        from bs4 import BeautifulSoup
        import time
        
        config = task.config
        results = []
        
        for url in config.target_urls:
            try:
                # Configure session
                session = requests.Session()
                
                # Set user agent
                headers = config.headers.copy() if config.headers else {}
                headers['User-Agent'] = self._get_random_user_agent(config)
                
                # Set cookies
                if config.cookies:
                    for name, value in config.cookies.items():
                        session.cookies.set(name, value)
                
                # Configure proxy if enabled
                if self.proxy_rotation_enabled and config.proxy_settings.get('enabled', False):
                    proxy = self._get_random_proxy()
                    if proxy:
                        session.proxies.update(proxy)
                
                # Scrape initial page
                response = session.get(url, headers=headers, timeout=config.timeout)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, 'html.parser')
                
                page_count = 0
                while page_count < config.max_pages:
                    page_results = {}
                    
                    # Extract data based on selectors
                    for key, selector in config.selectors.items():
                        if selector.startswith('//'):  # XPath
                            # BeautifulSoup doesn't support XPath, so we'll use a simple conversion
                            # This is just a basic example - in practice, use a proper XPath library
                            if '//' in selector and '@' in selector:
                                tag, attr = selector.split('@')
                                tag = tag.split('/')[-1]
                                page_results[key] = [elem.get(attr) for elem in soup.find_all(tag)]
                            else:
                                tag = selector.split('/')[-1]
                                page_results[key] = [elem.text.strip() for elem in soup.find_all(tag)]
                        else:  # CSS
                            elements = soup.select(selector)
                            page_results[key] = [elem.text.strip() for elem in elements]
                    
                    results.append(page_results)
                    page_count += 1
                    
                    # Handle pagination if configured
                    if 'next_page' in config.pagination:
                        next_page = None
                        selector = config.pagination['next_page']
                        
                        # Find next page link
                        next_elements = soup.select(selector)
                        if next_elements:
                            if next_elements[0].name == 'a':
                                next_page = next_elements[0]['href']
                            else:
                                next_links = next_elements[0].select('a')
                                if next_links:
                                    next_page = next_links[0]['href']
                        
                        if not next_page:
                            break
                        
                        # Make absolute URL if needed
                        if next_page.startswith('/'):
                            from urllib.parse import urlparse
                            parsed_url = urlparse(url)
                            next_page = f"{parsed_url.scheme}://{parsed_url.netloc}{next_page}"
                        
                        # Respect rate limiting
                        time.sleep(1.0 / config.rate_limit)
                        
                        # Fetch next page
                        response = session.get(next_page, headers=headers, timeout=config.timeout)
                        response.raise_for_status()
                        soup = BeautifulSoup(response.text, 'html.parser')
                    else:
                        break
                        
            except requests.RequestException as e:
                logger.error(f"Request error for URL {url}: {e}")
            except Exception as e:
                logger.error(f"Error scraping URL {url}: {e}")
        
        # Save results
        output_file = f"{self.output_dir}/{task.task_id}.{config.output_format}"
        
        if config.output_format == 'json':
            with open(output_file, 'w') as f:
                json.dump(results, f, indent=2)
        elif config.output_format == 'csv':
            import csv
            with open(output_file, 'w', newline='') as f:
                if results and results[0]:
                    writer = csv.DictWriter(f, fieldnames=results[0].keys())
                    writer.writeheader()
                    for result in results:
                        writer.writerow(result)
        
        return {
            "result_path": output_file,
            "item_count": len(results),
            "stats": {
                "pages_scraped": len(results),
                "items_scraped": sum(len(page) for page in results)
            }
        }
    
    async def _run_custom_scraper(self, task: ScrapingTask) -> Dict[str, Any]:
        """Run a custom scraper script."""
        if not task.config.custom_script_path or not os.path.exists(task.config.custom_script_path):
            raise ValueError(f"Custom script path not found: {task.config.custom_script_path}")
        
        # Load module from path
        spec = importlib.util.spec_from_file_location("custom_scraper", task.config.custom_script_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        
        # Check if it has the required functions
        if not hasattr(module, 'run_scraper'):
            raise ValueError("Custom scraper module must define a 'run_scraper' function")
        
        # Run the scraper
        result = await module.run_scraper(task.config.to_dict(), self.output_dir, task.task_id)
        
        if not isinstance(result, dict) or 'result_path' not in result:
            raise ValueError("Custom scraper must return a dict with 'result_path' key")
        
        return result
    
    async def _run_scraper(self, task: ScrapingTask):
        """Run a scraper based on the task configuration."""
        try:
            scraper_type = task.config.scraper_type.lower()
            
            if scraper_type == 'scrapy':
                result = await self._run_scrapy_scraper(task)
            elif scraper_type == 'selenium':
                result = await self._run_selenium_scraper(task)
            elif scraper_type == 'beautifulsoup':
                result = await self._run_beautifulsoup_scraper(task)
            elif scraper_type == 'custom':
                result = await self._run_custom_scraper(task)
            else:
                raise ValueError(f"Unsupported scraper type: {scraper_type}")
            
            # Update task with result
            task.status = "completed"
            task.result_path = result.get("result_path")
            task.stats = result.get("stats", {})
            task.end_time = datetime.now()
            
        except asyncio.CancelledError:
            # Task was cancelled
            task.status = "cancelled"
            task.end_time = datetime.now()
            raise
            
        except Exception as e:
            # Task failed
            logger.error(f"Scraper error for task {task.task_id}: {e}")
            logger.error(traceback.format_exc())
            
            task.status = "failed"
            task.error = str(e)
            task.end_time = datetime.now()
            
        finally:
            # Save task state
            self._save_task_state(task)
            
            # Remove from running tasks
            if task.task_id in self.running_tasks:
                del self.running_tasks[task.task_id]

# Example usage
async def main():
    # Create the scraper manager
    manager = ScraperManager()
    
    # Create a scraper config
    config = ScraperConfig(
        name="example-scraper",
        scraper_type="beautifulsoup",
        target_urls=["https://example.com"],
        selectors={
            "title": "h1",
            "paragraphs": "p"
        }
    )
    
    # Create and start a task
    task_id = await manager.create_task(config)
    success = await manager.start_task(task_id)
    
    if success:
        # Wait for task to complete
        task = manager.get_task(task_id)
        while task.status == "running":
            await asyncio.sleep(1)
            task = manager.get_task(task_id)
        
        print(f"Task completed with status: {task.status}")
        if task.result_path:
            print(f"Results saved to: {task.result_path}")
    else:
        print("Failed to start task")

if __name__ == "__main__":
    asyncio.run(main())
