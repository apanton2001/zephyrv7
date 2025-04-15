# Use Python as base image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies for Selenium and other tools
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        gcc \
        wget \
        unzip \
        gnupg \
        curl \
        libgconf-2-4 \
        libnss3 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Chrome for Selenium
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends google-chrome-stable \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install ChromeDriver for Selenium
RUN CHROME_VERSION=$(google-chrome --version | sed 's/Google Chrome //g' | sed 's/\..*//' | sed 's/ //g') \
    && CHROMEDRIVER_VERSION=$(curl -s "https://chromedriver.storage.googleapis.com/LATEST_RELEASE_$CHROME_VERSION") \
    && wget -q "https://chromedriver.storage.googleapis.com/${CHROMEDRIVER_VERSION}/chromedriver_linux64.zip" \
    && unzip chromedriver_linux64.zip -d /usr/local/bin \
    && chmod +x /usr/local/bin/chromedriver \
    && rm chromedriver_linux64.zip

# Create requirements.txt with dependencies
RUN echo "asyncio==3.4.3 \
          aiohttp==3.8.6 \
          beautifulsoup4==4.12.2 \
          motor==3.3.1 \
          pymongo==4.5.0 \
          pydantic==2.4.2 \
          pydantic-settings==2.0.3 \
          python-jose==3.3.0 \
          python-multipart==0.0.6 \
          requests==2.31.0 \
          scrapy==2.10.0 \
          selenium==4.15.2 \
          websockets==11.0.3" > requirements.txt

# Install Python dependencies
RUN pip install --upgrade pip \
    && pip install -r requirements.txt

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p /app/scheduler/tasks_storage
RUN mkdir -p /app/scraping/scraping_results
RUN mkdir -p /app/scraping/task_states

# Expose ports if needed
EXPOSE 5000

# Run script to start both services
RUN echo '#!/bin/bash \n\
          python -m automation.scheduler.task_scheduler & \n\
          python -m automation.scraping.scraper_manager & \n\
          wait' > start_services.sh \
    && chmod +x start_services.sh

# Command to run the services
CMD ["./start_services.sh"]
