import os
import json
import uuid
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class VectorService:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.documents = {}  # In-memory storage for demo
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2)
        )
        self.vectors = None
        self.document_ids = []
        
    def store_document(self, text: str, metadata: Dict[str, Any]) -> str:
        """
        Store document text and metadata in vector database
        """
        try:
            document_id = str(uuid.uuid4())
            
            # Create document entry
            document = {
                "id": document_id,
                "text": text,
                "metadata": metadata,
                "created_at": datetime.now().isoformat(),
                "vector": None  # Will be computed when needed
            }
            
            # Store in memory
            self.documents[document_id] = document
            self.document_ids.append(document_id)
            
            # Update vectors
            self._update_vectors()
            
            self.logger.info(f"Document stored with ID: {document_id}")
            return document_id
            
        except Exception as e:
            self.logger.error(f"Error storing document: {e}")
            raise
    
    def search_documents(self, query: str, device_id: Optional[str] = None, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Search for relevant documents using vector similarity
        """
        try:
            if not self.documents:
                return []
            
            # Vectorize query
            query_vector = self.vectorizer.transform([query])
            
            # Calculate similarities
            similarities = cosine_similarity(query_vector, self.vectors).flatten()
            
            # Create results with scores
            results = []
            for i, doc_id in enumerate(self.document_ids):
                if doc_id in self.documents:
                    doc = self.documents[doc_id]
                    
                    # Filter by device_id if provided
                    if device_id and doc["metadata"].get("device_id") != device_id:
                        continue
                    
                    results.append({
                        "id": doc_id,
                        "text": doc["text"],
                        "metadata": doc["metadata"],
                        "similarity_score": float(similarities[i])
                    })
            
            # Sort by similarity and limit results
            results.sort(key=lambda x: x["similarity_score"], reverse=True)
            return results[:limit]
            
        except Exception as e:
            self.logger.error(f"Error searching documents: {e}")
            return []
    
    def get_document(self, document_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a specific document by ID
        """
        return self.documents.get(document_id)
    
    def list_documents(self) -> List[Dict[str, Any]]:
        """
        List all documents in the database
        """
        return [
            {
                "id": doc_id,
                "metadata": doc["metadata"],
                "created_at": doc["created_at"],
                "text_length": len(doc["text"])
            }
            for doc_id, doc in self.documents.items()
        ]
    
    def delete_document(self, document_id: str) -> bool:
        """
        Delete a document from the database
        """
        try:
            if document_id in self.documents:
                del self.documents[document_id]
                if document_id in self.document_ids:
                    self.document_ids.remove(document_id)
                self._update_vectors()
                return True
            return False
        except Exception as e:
            self.logger.error(f"Error deleting document: {e}")
            return False
    
    def _update_vectors(self):
        """
        Update the TF-IDF vectors for all documents
        """
        try:
            if not self.documents:
                self.vectors = None
                return
            
            # Extract texts
            texts = [self.documents[doc_id]["text"] for doc_id in self.document_ids]
            
            # Fit and transform
            self.vectors = self.vectorizer.fit_transform(texts)
            
        except Exception as e:
            self.logger.error(f"Error updating vectors: {e}")
    
    def get_statistics(self) -> Dict[str, Any]:
        """
        Get statistics about the vector database
        """
        return {
            "total_documents": len(self.documents),
            "total_text_length": sum(len(doc["text"]) for doc in self.documents.values()),
            "average_text_length": sum(len(doc["text"]) for doc in self.documents.values()) / len(self.documents) if self.documents else 0,
            "device_ids": list(set(doc["metadata"].get("device_id") for doc in self.documents.values() if doc["metadata"].get("device_id")))
        }
    
    def clear_all(self):
        """
        Clear all documents from the database
        """
        self.documents.clear()
        self.document_ids.clear()
        self.vectors = None
        self.logger.info("All documents cleared from database")
    
    def export_data(self, filepath: str):
        """
        Export all documents to a JSON file
        """
        try:
            data = {
                "documents": self.documents,
                "document_ids": self.document_ids,
                "exported_at": datetime.now().isoformat()
            }
            
            with open(filepath, 'w') as f:
                json.dump(data, f, indent=2)
            
            self.logger.info(f"Data exported to {filepath}")
            
        except Exception as e:
            self.logger.error(f"Error exporting data: {e}")
    
    def import_data(self, filepath: str):
        """
        Import documents from a JSON file
        """
        try:
            with open(filepath, 'r') as f:
                data = json.load(f)
            
            self.documents = data["documents"]
            self.document_ids = data["document_ids"]
            self._update_vectors()
            
            self.logger.info(f"Data imported from {filepath}")
            
        except Exception as e:
            self.logger.error(f"Error importing data: {e}")
