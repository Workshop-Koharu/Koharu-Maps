"""
Koharu Maps - Main Server Application
Zero-Dependency Standalone GIS & Cartographic API Server.
"""

from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from server.config import APP_NAME, APP_VERSION, DEBUG
from server.database import init_db
from server.routes.auth_routes import router as auth_router
from server.routes.api_key_routes import router as api_key_router
from server.routes.favorite_routes import router as favorite_router
from server.routes.map_routes import router as map_router
from server.routes.search_routes import router as search_router
from server.routes.nav_routes import router as nav_router

# Initialize SQLite database
init_db()

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="Zero-Dependency Standalone GIS & Offline Cartographic Engine API",
    docs_url="/docs",
    redoc_url=None
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router)
app.include_router(api_key_router)
app.include_router(favorite_router)
app.include_router(map_router)
app.include_router(search_router)
app.include_router(nav_router)

# Health Check & Offline Status
@app.get("/api/health", tags=["System"])
def health_check():
    return {
        "status": "online",
        "mode": "standalone_offline",
        "engine": "Koharu Maps Cartographic Core",
        "network_independent": True
    }

# Web static paths
WEB_DIR = Path(__file__).resolve().parent.parent / "web"

if WEB_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(WEB_DIR)), name="static")

    @app.get("/", response_class=FileResponse)
    def index():
        return FileResponse(str(WEB_DIR / "index.html"))

    @app.get("/api-docs", response_class=FileResponse)
    def api_docs_page():
        return FileResponse(str(WEB_DIR / "api-docs.html"))

    @app.get("/developer", response_class=FileResponse)
    def developer_page():
        return FileResponse(str(WEB_DIR / "developer.html"))
