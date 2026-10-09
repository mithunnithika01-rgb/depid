"""
Defence in Depth — FastAPI Main Application
Entry point for the backend server.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Import routes
from routes.brand import router as brand_router
from routes.scan import router as scan_router
from routes.threats import router as threats_router
from routes.public import router as public_router
from routes.auth import router as auth_router

# Import database init
from database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    await init_db()
    yield


app = FastAPI(
    title="Defence in Depth API",
    description="Multi-Layered AI-Powered Brand Impersonation Defence",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend to connect
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files (logos)
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Register API routes
app.include_router(brand_router, prefix="/api/brand", tags=["Brand Profile"])
app.include_router(scan_router, prefix="/api/scan", tags=["Scanning"])
app.include_router(threats_router, prefix="/api/threats", tags=["Threats"])
app.include_router(public_router, prefix="/api/public", tags=["Public Portal"])
app.include_router(auth_router, prefix="/api/auth", tags=["Auth & Users"])


@app.get("/")
async def root():
    return {
        "name": "Defence in Depth API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "did-backend"}
