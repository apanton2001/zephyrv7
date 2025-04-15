# AI Agency Platform

A full-stack AI agency platform with automated IDE workflows, web scraping infrastructure, and client management capabilities.

## Project Structure

```
ai-agency-platform/
├── frontend/                # Next.js frontend
│   ├── src/                 # Source code
│   │   └── app/             # Next.js 13 app directory
│   ├── components/          # Reusable UI components
│   ├── public/              # Static assets
├── backend/                 # FastAPI backend
│   ├── app/                 # Application code
│   │   └── main.py          # Main FastAPI application
├── automation/              # Automation systems
│   ├── scheduler/           # Task scheduling system
│   ├── scraping/            # Web scraping infrastructure
├── database/                # Database utilities
│   └── schema.js            # MongoDB schema definitions
└── docker/                  # Docker configuration (optional)
    └── docker-compose.yml   # Multi-container orchestration
```

## Local Development Setup

### Prerequisites

- Node.js (v18 or later)
- Python 3.11+
- MongoDB (local or Atlas)
- (Optional) Docker and Docker Compose

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ai-agency-platform/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Access the frontend at http://localhost:3000

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd ai-agency-platform/backend
   ```

2. Create a virtual environment:
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # macOS/Linux
   python -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the backend server:
   ```bash
   uvicorn app.main:app --reload
   ```

5. Access the API at http://localhost:8000 and API docs at http://localhost:8000/docs

### Automation Services

The automation services are Python-based and handle task scheduling and web scraping. They can be run independently:

1. Navigate to the automation directory:
   ```bash
   cd ai-agency-platform/automation
   ```

2. Create a virtual environment (if not already created):
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # macOS/Linux
   python -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install asyncio aiohttp beautifulsoup4 pymongo pydantic selenium scrapy websockets
   ```

4. Run the scheduler (in a separate terminal):
   ```bash
   python -m automation.scheduler.task_scheduler
   ```

5. Run the scraper manager (in a separate terminal):
   ```bash
   python -m automation.scraping.scraper_manager
   ```

### Database Setup

1. Install and run MongoDB locally, or use MongoDB Atlas for cloud hosting.

2. Initialize the database using the schema in `database/schema.js`:
   ```bash
   # Using mongosh (MongoDB Shell)
   mongosh --eval "load('database/schema.js'); initializeDatabase(db);"
   ```

## Using Docker (Optional)

If you prefer using Docker, you can run the entire stack with:

```bash
cd ai-agency-platform
docker-compose -f docker/docker-compose.yml up -d
```

## Core Features

- **Landing Page**: Interactive showcase of the platform's capabilities
- **IDE Integration**: Real-time code execution with visualization
- **Template Marketplace**: Pre-built solutions for common tasks
- **Client Dashboard**: Project tracking and management
- **Scraping Infrastructure**: Multi-platform web scraping
- **Automation Systems**: Task scheduling and workflow management

## API Documentation

Detailed API documentation is available at http://localhost:8000/docs when the backend server is running.
