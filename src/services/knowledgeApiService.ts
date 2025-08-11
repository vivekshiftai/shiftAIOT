import { getApiConfig } from '../config/api';
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
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || getApiConfig().baseURL;
  }

  // Upload a document to the knowledge base
  async uploadDocument(file: File): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseUrl}/api/knowledge/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result as UploadResponse;
    } catch (error) {
      console.error('Document upload error:', error);
      throw error;
    }
  }

  // Get all documents in the knowledge base
  async getDocuments(): Promise<KnowledgeDocument[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/knowledge/documents`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.statusText}`);
      }

      const result = await response.json();
      return result.documents || [];
    } catch (error) {
      console.error('Get documents error:', error);
      throw error;
    }
  }

  // Delete a document from the knowledge base
  async deleteDocument(documentId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/knowledge/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Delete document error:', error);
      throw error;
    }
  }

  // Search documents in the knowledge base
  async searchDocuments(query: string, limit: number = 10): Promise<SearchResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/knowledge/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          limit,
        }),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result as SearchResponse;
    } catch (error) {
      console.error('Search documents error:', error);
      throw error;
    }
  }

  // Send a chat message to the AI assistant
  async sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/knowledge/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Chat request failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result as ChatResponse;
    } catch (error) {
      console.error('Chat message error:', error);
      throw error;
    }
  }

  // Get chat history for a session
  async getChatHistory(sessionId?: string): Promise<ChatMessage[]> {
    try {
      const url = sessionId 
        ? `${this.baseUrl}/api/knowledge/chat/history/${sessionId}`
        : `${this.baseUrl}/api/knowledge/chat/history`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch chat history: ${response.statusText}`);
      }

      const result = await response.json();
      return result.messages || [];
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
      const response = await fetch(`${this.baseUrl}/api/knowledge/documents/${documentId}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get document status: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Get document status error:', error);
      throw error;
    }
  }

  // Download a document
  async downloadDocument(documentId: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/api/knowledge/documents/${documentId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      return await response.blob();
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
      const response = await fetch(`${this.baseUrl}/api/knowledge/statistics`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get statistics: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Get statistics error:', error);
      throw error;
    }
  }
}

// Export a default instance
export const knowledgeApiService = new KnowledgeApiService();
