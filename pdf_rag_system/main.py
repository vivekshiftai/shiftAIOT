from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os
import sys

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.pdf_service import PDFService
from services.vector_service import VectorService
from services.rag_service import RAGService

app = FastAPI(title="PDF RAG System", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
pdf_service = PDFService()
vector_service = VectorService()
rag_service = RAGService()

class QueryRequest(BaseModel):
    query: str
    device_id: Optional[str] = None
    context: Optional[str] = None

class PDFUploadResponse(BaseModel):
    success: bool
    message: str
    document_id: Optional[str] = None
    extracted_text_length: Optional[int] = None

class QueryResponse(BaseModel):
    answer: str
    sources: List[str]
    confidence: float
    processing_time: float

@app.get("/")
async def root():
    return {"message": "PDF RAG System is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "services": {
        "pdf_service": "running",
        "vector_service": "running", 
        "rag_service": "running"
    }}

@app.post("/upload-pdf", response_model=PDFUploadResponse)
async def upload_pdf(file: UploadFile = File(...), device_id: Optional[str] = None):
    """
    Upload a PDF file and process it for RAG
    """
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Save uploaded file temporarily
        temp_path = f"temp/{file.filename}"
        os.makedirs("temp", exist_ok=True)
        
        with open(temp_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Extract text from PDF
        extracted_text = pdf_service.extract_text(temp_path)
        
        # Store in vector database
        document_id = vector_service.store_document(
            text=extracted_text,
            metadata={
                "filename": file.filename,
                "device_id": device_id,
                "file_size": len(content)
            }
        )
        
        # Clean up temp file
        os.remove(temp_path)
        
        return PDFUploadResponse(
            success=True,
            message="PDF processed successfully",
            document_id=document_id,
            extracted_text_length=len(extracted_text)
        )
        
    except Exception as e:
        return PDFUploadResponse(
            success=False,
            message=f"Error processing PDF: {str(e)}"
        )

@app.post("/query", response_model=QueryResponse)
async def query_rag(request: QueryRequest):
    """
    Query the RAG system with a question
    """
    try:
        # Get relevant documents from vector database
        relevant_docs = vector_service.search_documents(
            query=request.query,
            device_id=request.device_id,
            limit=5
        )
        
        # Generate answer using RAG
        answer, sources, confidence, processing_time = rag_service.generate_answer(
            query=request.query,
            context_docs=relevant_docs,
            device_context=request.context
        )
        
        return QueryResponse(
            answer=answer,
            sources=sources,
            confidence=confidence,
            processing_time=processing_time
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")

@app.get("/documents")
async def list_documents():
    """
    List all documents in the vector database
    """
    try:
        documents = vector_service.list_documents()
        return {"documents": documents}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing documents: {str(e)}")

@app.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """
    Delete a document from the vector database
    """
    try:
        success = vector_service.delete_document(document_id)
        if success:
            return {"message": f"Document {document_id} deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Document not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
