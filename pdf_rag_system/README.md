# PDF RAG System

A standalone Python service for processing PDF documents and providing RAG (Retrieval-Augmented Generation) capabilities.

## Features

- **PDF Text Extraction**: Extract text from PDF files using PyMuPDF and PyPDF2
- **Vector Database**: Store document embeddings using TF-IDF vectorization
- **Semantic Search**: Find relevant documents using cosine similarity
- **RAG Generation**: Generate answers based on retrieved context
- **REST API**: FastAPI-based REST endpoints for integration

## Installation

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

### Starting the Service

```bash
python main.py
```

The service will start on `http://localhost:8000`

### API Endpoints

#### Health Check
```bash
GET /health
```

#### Upload PDF
```bash
POST /upload-pdf
Content-Type: multipart/form-data

Parameters:
- file: PDF file
- device_id: Optional device identifier
```

#### Query RAG System
```bash
POST /query
Content-Type: application/json

{
  "query": "What are the maintenance requirements?",
  "device_id": "device-123",
  "context": "Optional device context"
}
```

#### List Documents
```bash
GET /documents
```

#### Delete Document
```bash
DELETE /documents/{document_id}
```

## Integration with Backend

The PDF RAG system can be integrated with the Java backend by:

1. **HTTP Client**: Use RestTemplate or WebClient to call the Python service
2. **Async Processing**: Process PDFs asynchronously during device onboarding
3. **Caching**: Cache RAG responses for better performance

## Architecture

```
PDF RAG System
├── main.py              # FastAPI application
├── services/
│   ├── pdf_service.py   # PDF text extraction
│   ├── vector_service.py # Vector database operations
│   └── rag_service.py   # RAG answer generation
└── requirements.txt     # Python dependencies
```

## Configuration

The system uses in-memory storage for demonstration. For production:

1. **Vector Database**: Replace with Chroma, Pinecone, or Weaviate
2. **LLM Integration**: Add OpenAI, Anthropic, or local LLM support
3. **Persistence**: Add database storage for documents and metadata
4. **Authentication**: Add API key or JWT authentication

## Development

### Adding New Features

1. **LLM Integration**: Modify `rag_service.py` to use actual LLMs
2. **Vector Database**: Replace in-memory storage with proper vector DB
3. **Document Processing**: Add support for other file types (DOCX, TXT)
4. **Advanced Search**: Implement semantic search with embeddings

### Testing

```bash
# Test health endpoint
curl http://localhost:8000/health

# Test PDF upload
curl -X POST -F "file=@sample.pdf" http://localhost:8000/upload-pdf

# Test query
curl -X POST -H "Content-Type: application/json" \
  -d '{"query": "What are the maintenance requirements?"}' \
  http://localhost:8000/query
```
