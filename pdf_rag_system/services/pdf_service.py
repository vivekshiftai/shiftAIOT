import PyPDF2
import fitz  # PyMuPDF
import os
import logging
from typing import List, Dict, Any
import re

class PDFService:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
    def extract_text(self, pdf_path: str) -> str:
        """
        Extract text from PDF file using multiple methods
        """
        try:
            # Try PyMuPDF first (better for complex PDFs)
            text = self._extract_with_pymupdf(pdf_path)
            if text.strip():
                return text
            
            # Fallback to PyPDF2
            text = self._extract_with_pypdf2(pdf_path)
            return text
            
        except Exception as e:
            self.logger.error(f"Error extracting text from PDF: {e}")
            return f"Error extracting text: {str(e)}"
    
    def _extract_with_pymupdf(self, pdf_path: str) -> str:
        """
        Extract text using PyMuPDF (fitz)
        """
        try:
            doc = fitz.open(pdf_path)
            text = ""
            
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                text += page.get_text()
            
            doc.close()
            return self._clean_text(text)
            
        except Exception as e:
            self.logger.warning(f"PyMuPDF extraction failed: {e}")
            return ""
    
    def _extract_with_pypdf2(self, pdf_path: str) -> str:
        """
        Extract text using PyPDF2
        """
        try:
            with open(pdf_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                text = ""
                
                for page in reader.pages:
                    text += page.extract_text()
                
                return self._clean_text(text)
                
        except Exception as e:
            self.logger.warning(f"PyPDF2 extraction failed: {e}")
            return ""
    
    def _clean_text(self, text: str) -> str:
        """
        Clean and normalize extracted text
        """
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove page numbers and headers/footers
        text = re.sub(r'Page \d+ of \d+', '', text)
        text = re.sub(r'\d+/\d+', '', text)
        
        # Remove special characters but keep important ones
        text = re.sub(r'[^\w\s\.\,\;\:\!\?\-\(\)\[\]\{\}]', '', text)
        
        return text.strip()
    
    def extract_metadata(self, pdf_path: str) -> Dict[str, Any]:
        """
        Extract metadata from PDF
        """
        try:
            doc = fitz.open(pdf_path)
            metadata = doc.metadata
            doc.close()
            
            return {
                "title": metadata.get("title", ""),
                "author": metadata.get("author", ""),
                "subject": metadata.get("subject", ""),
                "creator": metadata.get("creator", ""),
                "producer": metadata.get("producer", ""),
                "creation_date": metadata.get("creationDate", ""),
                "modification_date": metadata.get("modDate", ""),
                "page_count": len(doc)
            }
            
        except Exception as e:
            self.logger.error(f"Error extracting metadata: {e}")
            return {}
    
    def extract_tables(self, pdf_path: str) -> List[List[List[str]]]:
        """
        Extract tables from PDF (dummy implementation)
        """
        # This would use libraries like tabula-py or camelot-py
        # For now, return empty list
        return []
    
    def extract_images(self, pdf_path: str) -> List[Dict[str, Any]]:
        """
        Extract images from PDF (dummy implementation)
        """
        # This would extract images and save them
        # For now, return empty list
        return []
    
    def analyze_document_structure(self, pdf_path: str) -> Dict[str, Any]:
        """
        Analyze the structure of the PDF document
        """
        try:
            doc = fitz.open(pdf_path)
            
            structure = {
                "total_pages": len(doc),
                "has_text": False,
                "has_images": False,
                "has_tables": False,
                "estimated_text_length": 0
            }
            
            # Analyze first few pages
            for page_num in range(min(3, len(doc))):
                page = doc.load_page(page_num)
                text = page.get_text()
                
                if text.strip():
                    structure["has_text"] = True
                    structure["estimated_text_length"] += len(text)
            
            doc.close()
            return structure
            
        except Exception as e:
            self.logger.error(f"Error analyzing document structure: {e}")
            return {}
