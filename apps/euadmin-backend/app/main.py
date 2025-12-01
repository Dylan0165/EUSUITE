"""
EUAdmin Backend - Admin Monitoring and Control Dashboard
Main FastAPI application entry point.
"""
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers import auth, users, system

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle events."""
    logger.info("Starting EUAdmin Backend...")
    logger.info(f"Admin email: {settings.ADMIN_EMAIL}")
    logger.info(f"Kubernetes namespace: {settings.KUBE_NAMESPACE}")
    yield
    logger.info("Shutting down EUAdmin Backend...")


app = FastAPI(
    title="EUAdmin API",
    description="Admin Monitoring and Control Dashboard for EUSuite",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS + [
        "http://localhost:5180",
        "http://192.168.124.50:30090",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(system.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "EUAdmin",
        "version": "1.0.0",
        "description": "Admin Monitoring and Control Dashboard for EUSuite",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for Kubernetes."""
    return {"status": "healthy", "service": "euadmin-backend"}


@app.get("/api/health")
async def api_health_check():
    """Health check endpoint (alternative path)."""
    return {"status": "healthy", "service": "euadmin-backend"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
