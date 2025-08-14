import time
import logging
from fastapi import APIRouter, HTTPException, Path
from services.vector_db import VectorDatabase
from services.llm_service import LLMService
from utils.helpers import sanitize_filename, calculate_processing_time
from models.schemas import SafetyResponse
from config import settings

router = APIRouter(prefix="/generate-safety", tags=["safety"])
logger = logging.getLogger(__name__)

@router.post("/{pdf_name}", response_model=SafetyResponse)
async def generate_safety_information(pdf_name: str = Path(..., description="Name of the PDF file")):
    """Generate safety information from PDF content"""
    start_time = time.time()
    
    logger.info(f"Generating safety information for PDF: {pdf_name}")
    
    try:
        # Initialize services
        vector_db = VectorDatabase()
        llm_service = LLMService()
        
        # Generate collection name
        collection_name = sanitize_filename(pdf_name)
        
        # Check if collection exists
        if not vector_db.collection_exists(collection_name):
            raise HTTPException(
                status_code=404,
                detail=f"PDF '{pdf_name}' not found. Please upload the PDF first."
            )
        
        # Get chunks from vector database
        logger.info("Retrieving chunks from vector database...")
        all_chunks = await vector_db.get_all_chunks(
            collection_name=collection_name,
            limit=settings.max_chunks_per_batch
        )
        
        if not all_chunks:
            raise HTTPException(
                status_code=404,
                detail="No content found in PDF"
            )
        
        logger.info(f"Processing {len(all_chunks)} chunks for safety information generation")
        
        # Generate safety information using LLM
        logger.info("Generating safety information with LLM...")
        safety_information = await llm_service.generate_safety_information(all_chunks)
        
        processing_time = calculate_processing_time(start_time)
        
        logger.info(f"Generated {len(safety_information)} safety items in {processing_time}")
        
        return SafetyResponse(
            success=True,
            pdf_name=pdf_name,
            safety_information=safety_information,
            processing_time=processing_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating safety information: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Safety information generation failed: {str(e)}")

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Safety Generation"}