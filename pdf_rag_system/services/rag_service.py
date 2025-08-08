import logging
import time
from typing import List, Dict, Any, Tuple, Optional
import re

class RAGService:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
    def generate_answer(self, query: str, context_docs: List[Dict[str, Any]], device_context: Optional[str] = None) -> Tuple[str, List[str], float, float]:
        """
        Generate an answer using RAG approach
        """
        start_time = time.time()
        
        try:
            if not context_docs:
                return self._generate_no_context_answer(query), [], 0.0, time.time() - start_time
            
            # Extract relevant text from documents
            context_text = self._extract_context_text(context_docs)
            
            # Generate answer using context
            answer = self._generate_contextual_answer(query, context_text, device_context)
            
            # Extract sources
            sources = [doc["metadata"].get("filename", f"Document {doc['id']}") for doc in context_docs]
            
            # Calculate confidence based on similarity scores
            confidence = self._calculate_confidence(context_docs)
            
            processing_time = time.time() - start_time
            
            return answer, sources, confidence, processing_time
            
        except Exception as e:
            self.logger.error(f"Error generating answer: {e}")
            return f"Error generating answer: {str(e)}", [], 0.0, time.time() - start_time
    
    def _extract_context_text(self, context_docs: List[Dict[str, Any]]) -> str:
        """
        Extract and combine relevant text from context documents
        """
        texts = []
        for doc in context_docs:
            text = doc["text"]
            # Truncate very long texts
            if len(text) > 2000:
                text = text[:2000] + "..."
            texts.append(text)
        
        return "\n\n".join(texts)
    
    def _generate_contextual_answer(self, query: str, context_text: str, device_context: Optional[str] = None) -> str:
        """
        Generate answer using context (dummy implementation)
        """
        # This would integrate with an LLM like OpenAI, Anthropic, or local models
        # For now, use a simple template-based approach
        
        # Extract key information based on query type
        if "maintenance" in query.lower() or "schedule" in query.lower():
            return self._extract_maintenance_info(context_text, query)
        elif "specification" in query.lower() or "spec" in query.lower():
            return self._extract_specifications(context_text, query)
        elif "troubleshoot" in query.lower() or "error" in query.lower():
            return self._extract_troubleshooting_info(context_text, query)
        elif "installation" in query.lower() or "setup" in query.lower():
            return self._extract_installation_info(context_text, query)
        else:
            return self._generate_general_answer(query, context_text)
    
    def _extract_maintenance_info(self, context_text: str, query: str) -> str:
        """
        Extract maintenance information from context
        """
        # Look for maintenance-related keywords
        maintenance_keywords = ["maintenance", "schedule", "service", "inspection", "cleaning", "replacement"]
        
        sentences = context_text.split('.')
        relevant_sentences = []
        
        for sentence in sentences:
            if any(keyword in sentence.lower() for keyword in maintenance_keywords):
                relevant_sentences.append(sentence.strip())
        
        if relevant_sentences:
            return f"Based on the documentation, here are the maintenance requirements:\n\n" + \
                   "\n".join(f"• {sentence}" for sentence in relevant_sentences[:5])
        else:
            return "No specific maintenance information found in the documentation. Please refer to the manufacturer's guidelines."
    
    def _extract_specifications(self, context_text: str, query: str) -> str:
        """
        Extract technical specifications from context
        """
        # Look for specification-related keywords
        spec_keywords = ["specification", "spec", "parameter", "dimension", "capacity", "voltage", "current", "temperature"]
        
        sentences = context_text.split('.')
        relevant_sentences = []
        
        for sentence in sentences:
            if any(keyword in sentence.lower() for keyword in spec_keywords):
                relevant_sentences.append(sentence.strip())
        
        if relevant_sentences:
            return f"Technical specifications from the documentation:\n\n" + \
                   "\n".join(f"• {sentence}" for sentence in relevant_sentences[:5])
        else:
            return "No specific technical specifications found in the documentation."
    
    def _extract_troubleshooting_info(self, context_text: str, query: str) -> str:
        """
        Extract troubleshooting information from context
        """
        # Look for troubleshooting-related keywords
        troubleshoot_keywords = ["troubleshoot", "error", "problem", "issue", "fault", "diagnostic", "solution"]
        
        sentences = context_text.split('.')
        relevant_sentences = []
        
        for sentence in sentences:
            if any(keyword in sentence.lower() for keyword in troubleshoot_keywords):
                relevant_sentences.append(sentence.strip())
        
        if relevant_sentences:
            return f"Troubleshooting information from the documentation:\n\n" + \
                   "\n".join(f"• {sentence}" for sentence in relevant_sentences[:5])
        else:
            return "No specific troubleshooting information found in the documentation."
    
    def _extract_installation_info(self, context_text: str, query: str) -> str:
        """
        Extract installation information from context
        """
        # Look for installation-related keywords
        install_keywords = ["installation", "setup", "mount", "connect", "wire", "install", "assembly"]
        
        sentences = context_text.split('.')
        relevant_sentences = []
        
        for sentence in sentences:
            if any(keyword in sentence.lower() for keyword in install_keywords):
                relevant_sentences.append(sentence.strip())
        
        if relevant_sentences:
            return f"Installation instructions from the documentation:\n\n" + \
                   "\n".join(f"• {sentence}" for sentence in relevant_sentences[:5])
        else:
            return "No specific installation information found in the documentation."
    
    def _generate_general_answer(self, query: str, context_text: str) -> str:
        """
        Generate a general answer based on context
        """
        # Simple keyword matching approach
        query_lower = query.lower()
        sentences = context_text.split('.')
        
        relevant_sentences = []
        for sentence in sentences:
            # Check if sentence contains words from the query
            query_words = query_lower.split()
            sentence_lower = sentence.lower()
            
            if any(word in sentence_lower for word in query_words if len(word) > 3):
                relevant_sentences.append(sentence.strip())
        
        if relevant_sentences:
            return f"Based on the documentation, here's what I found:\n\n" + \
                   "\n".join(f"• {sentence}" for sentence in relevant_sentences[:3])
        else:
            return "I couldn't find specific information related to your query in the documentation. Please try rephrasing your question or check if the relevant documentation has been uploaded."
    
    def _generate_no_context_answer(self, query: str) -> str:
        """
        Generate answer when no context is available
        """
        return "I don't have any relevant documentation to answer your question. Please upload the device documentation first."
    
    def _calculate_confidence(self, context_docs: List[Dict[str, Any]]) -> float:
        """
        Calculate confidence score based on similarity scores
        """
        if not context_docs:
            return 0.0
        
        # Calculate average similarity score
        scores = [doc.get("similarity_score", 0.0) for doc in context_docs]
        avg_score = sum(scores) / len(scores)
        
        # Normalize to 0-1 range
        confidence = min(avg_score * 2, 1.0)  # Scale up the score
        
        return confidence
    
    def analyze_query_intent(self, query: str) -> Dict[str, Any]:
        """
        Analyze the intent of the user query
        """
        query_lower = query.lower()
        
        intent = {
            "type": "general",
            "confidence": 0.5,
            "keywords": []
        }
        
        # Check for specific intent types
        if any(word in query_lower for word in ["maintenance", "schedule", "service"]):
            intent["type"] = "maintenance"
            intent["confidence"] = 0.8
            intent["keywords"] = ["maintenance", "schedule", "service"]
        
        elif any(word in query_lower for word in ["specification", "spec", "parameter"]):
            intent["type"] = "specification"
            intent["confidence"] = 0.8
            intent["keywords"] = ["specification", "spec", "parameter"]
        
        elif any(word in query_lower for word in ["troubleshoot", "error", "problem"]):
            intent["type"] = "troubleshooting"
            intent["confidence"] = 0.8
            intent["keywords"] = ["troubleshoot", "error", "problem"]
        
        elif any(word in query_lower for word in ["installation", "setup", "install"]):
            intent["type"] = "installation"
            intent["confidence"] = 0.8
            intent["keywords"] = ["installation", "setup", "install"]
        
        return intent
