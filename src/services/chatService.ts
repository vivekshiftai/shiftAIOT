import { getApiConfig } from '../config/api';
import { tokenService } from './tokenService';
import { logInfo, logError } from '../utils/logger';
import { chatFeedbackService, ChatMessage as FeedbackChatMessage } from './chatFeedbackService';

/**
 * PDF Image interface
 */
export interface PDFImage {
  filename: string;
  data: string; // Base64 encoded image data
  mime_type: string;
  size: number;
}

/**
 * Chat message interface for frontend display
 */
export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  pdfName?: string;
  deviceId?: string;
  processingTime?: string;
  chunksUsed?: string[];
  status?: string;
  error?: string;
  images?: PDFImage[];
  tables?: string[];
}

/**
 * PDF query request interface
 */
export interface PDFQueryRequest {
  pdf_name: string;
  query: string;
  top_k?: number;
}

/**
 * PDF query response interface
 */
export interface PDFQueryResponse {
  success: boolean;
  message: string;
  response: string;
  chunks_used: string[];
  processing_time: string;
  images?: PDFImage[];
  tables?: string[];
}

/**
 * Chat history response interface
 */
export interface ChatHistoryResponse {
  messages: ChatMessage[];
  total: number;
  deviceId?: string;
  pdfName?: string;
}

/**
 * Clean chat service that only triggers backend operations
 * No PDF result storage in frontend - all data flows through backend
 */
export class ChatService {
  private baseUrl: string;

  constructor() {
    const config = getApiConfig();
    this.baseUrl = config.BACKEND_BASE_URL;
  }

  /**
   * Query PDF document through backend API
   * Stores conversation history automatically in backend
   */
  async queryPDF(request: PDFQueryRequest, deviceId?: string): Promise<PDFQueryResponse> {
    try {
      logInfo('ChatService', 'Querying PDF through backend', { 
        pdfName: request.pdf_name, 
        deviceId,
        queryLength: request.query.length 
      });

      const endpoint = deviceId 
        ? `/api/chat/query?deviceId=${encodeURIComponent(deviceId)}`
        : '/api/chat/query';

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenService.getToken()}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logError('ChatService', `PDF query failed: ${response.status} - ${errorText}`);
        
        // Check if this is an Azure OpenAI content filter error
        if (errorText.includes('content_filter') || 
            errorText.includes('ResponsibleAIPolicyViolation') ||
            errorText.includes('content management policy') ||
            errorText.includes('jailbreak') ||
            errorText.includes('content_filter_result')) {
          
          throw new Error('An error occurred, please try again.');
        }
        
        throw new Error(`PDF query failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      logInfo('ChatService', 'PDF query completed successfully', {
        pdfName: request.pdf_name,
        deviceId,
        responseLength: result.response?.length || 0,
        processingTime: result.processing_time
      });

      return result;

    } catch (error) {
      logError('ChatService', 'PDF query failed', error instanceof Error ? error : new Error('Unknown error'));
      
      // Check if this is an Azure OpenAI content filter error
      if (error instanceof Error) {
        const errorMessage = error.message;
        
        if (errorMessage.includes('content_filter') || 
            errorMessage.includes('ResponsibleAIPolicyViolation') ||
            errorMessage.includes('content management policy') ||
            errorMessage.includes('An error occurred, please try again')) {
          
          throw new Error('An error occurred, please try again.');
        }
      }
      
      throw error;
    }
  }

  /**
   * Get chat history for current user
   */
  async getChatHistory(limit: number = 50): Promise<ChatHistoryResponse> {
    try {
      logInfo('ChatService', 'Fetching user chat history', { limit });

      const response = await fetch(`${this.baseUrl}/api/chat/history?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenService.getToken()}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logError('ChatService', `Failed to fetch chat history: ${response.status} - ${errorText}`);
        throw new Error(`Failed to fetch chat history: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Convert timestamps to Date objects
      const messages = result.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));

      logInfo('ChatService', 'Chat history fetched successfully', {
        messageCount: messages.length,
        total: result.total
      });

      return {
        messages,
        total: result.total
      };

    } catch (error) {
      logError('ChatService', 'Failed to fetch chat history', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * Get chat history for a specific device
   */
  async getDeviceChatHistory(deviceId: string, limit: number = 50): Promise<ChatHistoryResponse> {
    try {
      logInfo('ChatService', 'Fetching device chat history', { deviceId, limit });

      const response = await fetch(`${this.baseUrl}/api/chat-history/device/${encodeURIComponent(deviceId)}/recent?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenService.getToken()}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logError('ChatService', `Failed to fetch device chat history: ${response.status} - ${errorText}`);
        throw new Error(`Failed to fetch device chat history: ${response.status} ${response.statusText}`);
      }

      const messages = await response.json();
      
      // Convert timestamps to Date objects and ensure proper message format
      const formattedMessages = messages.map((msg: any) => ({
        id: msg.id,
        type: msg.messageType.toLowerCase(), // Convert USER/ASSISTANT to user/assistant for UI
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        pdfName: msg.pdfName,
        deviceId: msg.deviceId,
        queryType: msg.queryType,
        chunks_used: msg.chunksUsed ? JSON.parse(msg.chunksUsed) : undefined,
        processing_time: msg.processingTime,
        userFeedback: msg.userFeedback,
        feedbackTimestamp: msg.feedbackTimestamp ? new Date(msg.feedbackTimestamp) : undefined
      }));

      logInfo('ChatService', 'Device chat history fetched successfully', {
        deviceId,
        messageCount: formattedMessages.length
      });

      return {
        messages: formattedMessages,
        total: formattedMessages.length,
        deviceId: deviceId
      };

    } catch (error) {
      logError('ChatService', 'Failed to fetch device chat history', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * Get chat history for a specific PDF document
   */
  async getPDFChatHistory(pdfName: string, limit: number = 50): Promise<ChatHistoryResponse> {
    try {
      logInfo('ChatService', 'Fetching PDF chat history', { pdfName, limit });

      const response = await fetch(`${this.baseUrl}/api/chat/history/pdf/${encodeURIComponent(pdfName)}?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenService.getToken()}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logError('ChatService', `Failed to fetch PDF chat history: ${response.status} - ${errorText}`);
        throw new Error(`Failed to fetch PDF chat history: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Convert timestamps to Date objects
      const messages = result.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));

      logInfo('ChatService', 'PDF chat history fetched successfully', {
        pdfName,
        messageCount: messages.length,
        total: result.total
      });

      return {
        messages,
        total: result.total,
        pdfName: result.pdfName
      };

    } catch (error) {
      logError('ChatService', 'Failed to fetch PDF chat history', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * Check if backend is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat/history?limit=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenService.getToken()}`,
        },
      });

      return response.ok;
    } catch (error) {
      logError('ChatService', 'Backend health check failed', error instanceof Error ? error : new Error('Unknown error'));
      return false;
    }
  }

  /**
   * Save user message to chat history database
   */
  async saveUserMessage(userId: string, deviceId: string | undefined, organizationId: string, content: string, sessionId: string): Promise<{ id: string }> {
    try {
      logInfo('ChatService', 'Saving user message to database', { 
        userId, 
        deviceId, 
        organizationId,
        contentLength: content.length,
        sessionId 
      });

      const message: FeedbackChatMessage = {
        id: Date.now().toString(),
        userId,
        deviceId,
        organizationId,
        content,
        sessionId,
        messageType: 'USER'
      };

      const savedMessage = await chatFeedbackService.saveMessage(message);
      
      logInfo('ChatService', 'User message saved to database successfully', { 
        userId, 
        deviceId,
        sessionId,
        savedMessageId: savedMessage.id
      });

      return { id: savedMessage.id };

    } catch (error) {
      logError('ChatService', 'Failed to save user message to database', error instanceof Error ? error : new Error('Unknown error'));
      // Return a fallback ID to prevent breaking the chat flow
      return { id: `fallback_user_${Date.now()}` };
    }
  }

  /**
   * Save assistant message to chat history database
   */
  async saveAssistantMessage(
    userId: string, 
    deviceId: string | undefined, 
    organizationId: string, 
    content: string, 
    sessionId: string,
    queryType?: 'DATABASE' | 'PDF' | 'MIXED' | 'LLM_ANSWER' | 'UNKNOWN',
    pdfName?: string,
    chunksUsed?: string,
    processingTime?: string,
    sqlQuery?: string,
    databaseResults?: string,
    rowCount?: number
  ): Promise<{ id: string }> {
    try {
      logInfo('ChatService', 'Saving assistant message to database', { 
        userId, 
        deviceId, 
        organizationId,
        contentLength: content.length,
        sessionId,
        queryType,
        pdfName
      });

      const message: FeedbackChatMessage = {
        id: (Date.now() + 1).toString(),
        userId,
        deviceId,
        organizationId,
        content,
        sessionId,
        messageType: 'ASSISTANT',
        queryType,
        pdfName,
        chunksUsed,
        processingTime,
        sqlQuery,
        databaseResults,
        rowCount
      };

      const savedMessage = await chatFeedbackService.saveMessage(message);
      
      logInfo('ChatService', 'Assistant message saved to database successfully', { 
        userId, 
        deviceId,
        sessionId,
        queryType,
        savedMessageId: savedMessage.id
      });

      return { id: savedMessage.id };

    } catch (error) {
      logError('ChatService', 'Failed to save assistant message to database', error instanceof Error ? error : new Error('Unknown error'));
      // Return a fallback ID to prevent breaking the chat flow
      return { id: `fallback_assistant_${Date.now()}` };
    }
  }
}

// Export singleton instance
export const chatService = new ChatService();
