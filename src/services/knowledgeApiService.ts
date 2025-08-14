import api from './api';
import { KnowledgeDocument } from '../types';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: string[];
}

export interface ChatRequest {
  message: string;
  documentIds?: string[];
  context?: string;
}

export interface ChatResponse {
  message: string;
  sources?: Array<{
    documentId: string;
    documentName: string;
    excerpt: string;
    relevance: number;
  }>;
}

export interface UploadResponse {
  success: boolean;
  document: KnowledgeDocument;
  message?: string;
  error?: string;
}

export interface SearchResponse {
  results: Array<{
    documentId: string;
    documentName: string;
    excerpt: string;
    relevance: number;
    pageNumber?: number;
  }>;
  totalResults: number;
}

export class KnowledgeApiService {
  // Upload a document to the knowledge base
  async uploadDocument(file: File): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/knowledge/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data as UploadResponse;
    } catch (error) {
      console.error('Document upload error:', error);
      throw error;
    }
  }

  // Get all documents in the knowledge base
  async getDocuments(): Promise<KnowledgeDocument[]> {
    try {
      const response = await api.get('/knowledge/documents');
      return response.data.documents || [];
    } catch (error) {
      console.error('Get documents error:', error);
      throw error;
    }
  }

  // Delete a document from the knowledge base
  async deleteDocument(documentId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.delete(`/knowledge/documents/${documentId}`);
      return response.data;
    } catch (error) {
      console.error('Delete document error:', error);
      throw error;
    }
  }

  // Search documents in the knowledge base
  async searchDocuments(query: string, limit: number = 10): Promise<SearchResponse> {
    try {
      const response = await api.post('/knowledge/search', {
        query,
        limit,
      });
      return response.data as SearchResponse;
    } catch (error) {
      console.error('Search documents error:', error);
      throw error;
    }
  }

  // Send a chat message to the AI assistant
  async sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await api.post('/knowledge/chat', request);
      return response.data as ChatResponse;
    } catch (error) {
      console.error('Chat message error:', error);
      throw error;
    }
  }

  // Get chat history for a session
  async getChatHistory(sessionId?: string): Promise<ChatMessage[]> {
    try {
      const url = sessionId 
        ? `/knowledge/chat/history/${sessionId}`
        : '/knowledge/chat/history';

      const response = await api.get(url);
      return response.data.messages || [];
    } catch (error) {
      console.error('Get chat history error:', error);
      throw error;
    }
  }

  // Get document processing status
  async getDocumentStatus(documentId: string): Promise<{
    status: 'processing' | 'completed' | 'error';
    progress?: number;
    message?: string;
  }> {
    try {
      const response = await api.get(`/knowledge/documents/${documentId}/status`);
      return response.data;
    } catch (error) {
      console.error('Get document status error:', error);
      throw error;
    }
  }

  // Download a document
  async downloadDocument(documentId: string): Promise<Blob> {
    try {
      const response = await api.get(`/knowledge/documents/${documentId}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Download document error:', error);
      throw error;
    }
  }

  // Get knowledge base statistics
  async getStatistics(): Promise<{
    totalDocuments: number;
    processedDocuments: number;
    totalSize: number;
    lastUpdated: string;
  }> {
    try {
      const response = await api.get('/knowledge/statistics');
      return response.data;
    } catch (error) {
      console.error('Get statistics error:', error);
      throw error;
    }
  }
}

// Export a default instance
export const knowledgeApiService = new KnowledgeApiService();
