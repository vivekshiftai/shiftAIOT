import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from config import settings
from utils.helpers import setup_logging
from endpoints import upload, query, pdfs, rules, maintenance, safety
from models.schemas import PDFUploadResponse

# Setup logging
logger = setup_logging(settings.log_level)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    logger.info("Starting PDF Intelligence Platform...")
    logger.info(f"Vector DB Type: {settings.vector_db_type}")
    logger.info(f"Models Directory: {settings.models_dir}")
    logger.info(f"Upload Directory: {settings.upload_dir}")
    logger.info(f"Output Directory: {settings.output_dir}")
    
    yield
    
    logger.info("Shutting down PDF Intelligence Platform...")

# Initialize FastAPI app
app = FastAPI(
    title="PDF Intelligence Platform",
    description="A comprehensive backend API system that processes PDF manuals, stores them in vector databases, and provides intelligent querying capabilities for IoT device documentation, rules generation, maintenance schedules, and safety information.",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upload.router)
app.include_router(query.router)
app.include_router(pdfs.router)
app.include_router(rules.router)
app.include_router(maintenance.router)
app.include_router(safety.router)

# Alias upload endpoint to support /upload-pdf and /upload-pdf/
app.add_api_route(
    "/upload-pdf",
    upload.upload_pdf,
    methods=["POST"],
    response_model=PDFUploadResponse,
    tags=["upload"],
)
app.add_api_route(
    "/upload-pdf/",
    upload.upload_pdf,
    methods=["POST"],
    response_model=PDFUploadResponse,
    tags=["upload"],
)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "PDF Intelligence Platform",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "upload": "/upload/pdf",
            "upload_alias": "/upload-pdf",
            "query": "/query",
            "list_pdfs": "/pdfs",
            "generate_rules": "/generate-rules/{pdf_name}",
            "generate_maintenance": "/generate-maintenance/{pdf_name}",
            "generate_safety": "/generate-safety/{pdf_name}",
            "health": "/health",
            "docs": "/docs"
        }
    }

@app.get("/health")
async def health_check():
    """Global health check endpoint"""
    return {
        "status": "healthy",
        "service": "PDF Intelligence Platform",
        "version": "1.0.0",
        "components": {
            "upload": "healthy",
            "query": "healthy",
            "pdfs": "healthy",
            "rules": "healthy",
            "maintenance": "healthy",
            "safety": "healthy"
        }
    }

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "detail": str(exc) if settings.log_level.upper() == "DEBUG" else "An unexpected error occurred"
        }
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level=settings.log_level.lower()
    )