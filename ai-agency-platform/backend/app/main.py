from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import asyncio
import json
import logging
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("ai-agency-platform")

# Initialize FastAPI app
app = FastAPI(
    title="AI Agency Platform API",
    description="Backend API for the AI Agency Platform",
    version="0.1.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OAuth2 token URL
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- Data Models ---

class User(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None
    disabled: Optional[bool] = None

class UserInDB(User):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    template_id: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime
    status: str

class ScrapingTask(BaseModel):
    id: str
    project_id: str
    target_url: str
    config: Dict[str, Any]
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    result_id: Optional[str] = None

class Template(BaseModel):
    id: str
    name: str
    description: str
    category: str
    config: Dict[str, Any]
    preview_image: Optional[str] = None

# --- WebSocket Connection Manager ---

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        if client_id not in self.active_connections:
            self.active_connections[client_id] = []
        self.active_connections[client_id].append(websocket)
        logger.info(f"Client {client_id} connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket, client_id: str):
        if client_id in self.active_connections:
            self.active_connections[client_id].remove(websocket)
            if not self.active_connections[client_id]:
                del self.active_connections[client_id]
            logger.info(f"Client {client_id} disconnected. Remaining connections: {len(self.active_connections)}")

    async def send_message(self, message: str, client_id: str):
        if client_id in self.active_connections:
            for connection in self.active_connections[client_id]:
                await connection.send_text(message)

    async def broadcast(self, message: str):
        for client_id in self.active_connections:
            await self.send_message(message, client_id)

# Initialize connection manager
manager = ConnectionManager()

# --- API Routes ---

@app.get("/")
async def root():
    return {"message": "Welcome to the AI Agency Platform API"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# --- Authentication Endpoints ---

@app.post("/api/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    # This is a placeholder - in a real app, validate against a database
    # For demo purposes, accept any username/password
    if form_data.username and form_data.password:
        # In a real app, this would be a JWT with proper expiration, etc.
        return {
            "access_token": f"demo_token_{form_data.username}",
            "token_type": "bearer"
        }
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect username or password",
        headers={"WWW-Authenticate": "Bearer"},
    )

async def get_current_user(token: str = Depends(oauth2_scheme)):
    # This is a placeholder - in a real app, validate the token
    # For demo purposes, extract username from token
    try:
        username = token.replace("demo_token_", "")
        return User(username=username, email=f"{username}@example.com")
    except:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# --- Project Endpoints ---

@app.get("/api/projects", response_model=List[Project])
async def get_projects(current_user: User = Depends(get_current_user)):
    # Placeholder - in a real app, fetch from database
    return [
        {
            "id": "project1",
            "name": "E-commerce Scraper",
            "description": "Scrape product data from major e-commerce sites",
            "template_id": "template1",
            "owner_id": current_user.username,
            "created_at": datetime.now() - timedelta(days=5),
            "updated_at": datetime.now() - timedelta(days=1),
            "status": "active"
        },
        {
            "id": "project2",
            "name": "Social Media Monitor",
            "description": "Monitor mentions across social platforms",
            "template_id": "template2",
            "owner_id": current_user.username,
            "created_at": datetime.now() - timedelta(days=10),
            "updated_at": datetime.now() - timedelta(days=2),
            "status": "active"
        }
    ]

@app.post("/api/projects", response_model=Project)
async def create_project(project: ProjectCreate, current_user: User = Depends(get_current_user)):
    # Placeholder - in a real app, save to database
    return {
        "id": f"new_project_{datetime.now().timestamp()}",
        "name": project.name,
        "description": project.description,
        "template_id": project.template_id,
        "owner_id": current_user.username,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "status": "created"
    }

# --- Template Endpoints ---

@app.get("/api/templates", response_model=List[Template])
async def get_templates():
    # Placeholder - in a real app, fetch from database
    return [
        {
            "id": "template1",
            "name": "E-commerce Scraper",
            "description": "Extract product data from major e-commerce platforms",
            "category": "Scraping",
            "config": {
                "selectors": {
                    "product_title": ".product-title",
                    "product_price": ".product-price",
                    "product_description": ".product-description"
                },
                "proxy_rotation": True,
                "captcha_handling": True
            },
            "preview_image": "/images/templates/ecommerce.png"
        },
        {
            "id": "template2",
            "name": "Social Media Monitor",
            "description": "Track mentions and sentiment across social platforms",
            "category": "Monitoring",
            "config": {
                "platforms": ["twitter", "instagram", "facebook"],
                "keywords": ["example", "keywords"],
                "sentiment_analysis": True
            },
            "preview_image": "/images/templates/social-media.png"
        }
    ]

# --- WebSocket Endpoints ---

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Process the received data (in a real app)
            await manager.send_message(f"Message processed: {data}", client_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, client_id)
        await manager.broadcast(f"Client #{client_id} left the chat")

# --- Scraping Task Endpoints ---

@app.post("/api/scraping-tasks", response_model=ScrapingTask)
async def create_scraping_task(
    target_url: str,
    project_id: str,
    config: Dict[str, Any] = {},
    current_user: User = Depends(get_current_user)
):
    # Placeholder - in a real app, create a task in the database and queue
    task_id = f"task_{datetime.now().timestamp()}"
    return {
        "id": task_id,
        "project_id": project_id,
        "target_url": target_url,
        "config": config,
        "status": "pending",
        "created_at": datetime.now()
    }

@app.get("/api/scraping-tasks/{task_id}", response_model=ScrapingTask)
async def get_scraping_task(task_id: str, current_user: User = Depends(get_current_user)):
    # Placeholder - in a real app, fetch from database
    return {
        "id": task_id,
        "project_id": "project1",
        "target_url": "https://example.com",
        "config": {"selector": ".product"},
        "status": "completed",
        "created_at": datetime.now() - timedelta(hours=1),
        "updated_at": datetime.now(),
        "result_id": f"result_{task_id}"
    }

# Run app with: uvicorn app.main:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
