import { logInfo, logError } from '../utils/logger';
import { tokenService } from './tokenService';
import { getApiConfig } from '../config/api';

export interface ChatMessage {
  id: string;
  userId: string;
  deviceId?: string;
  organizationId: string;
  content: string;
  sessionId: string;
  messageType?: 'USER' | 'ASSISTANT';
  queryType?: 'DATABASE' | 'PDF' | 'MIXED' | 'LLM_ANSWER' | 'UNKNOWN';
  pdfName?: string;
  chunksUsed?: string;
  processingTime?: string;
  sqlQuery?: string;
  databaseResults?: string;
  rowCount?: number;
}

export interface ChatFeedbackRequest {
  messageId: string;
  feedback: 'LIKE' | 'DISLIKE' | 'REGENERATE';
  newContent?: string;
  newChunksUsed?: string;
  newProcessingTime?: string;
}

export interface ChatHistoryResponse {
  id: string;
  userId: string;
  deviceId?: string;
  organizationId: string;
  messageType: 'user' | 'assistant';
  content: string;
  timestamp: string;
  queryType?: 'DATABASE' | 'PDF' | 'MIXED' | 'LLM_ANSWER' | 'UNKNOWN';
  pdfName?: string;
  chunksUsed?: string;
  processingTime?: string;
  sqlQuery?: string;
  databaseResults?: string;
  rowCount?: number;
  userFeedback?: 'like' | 'dislike' | 'regenerate';
  feedbackTimestamp?: string;
  sessionId: string;
  parentMessageId?: string;
  isRegenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackStats {
  totalMessages: number;
  likes: number;
  dislikes: number;
  regenerates: number;
}

/**
 * Service for managing chat history and user feedback
 * Handles saving chat messages, submitting feedback, and retrieving chat history
 */
export class ChatFeedbackService {
  private baseUrl: string;

  constructor() {
    const config = getApiConfig();
    this.baseUrl = config.BACKEND_BASE_URL;
  }

  /**
   * Save a chat message to history
   */
  async saveMessage(message: ChatMessage): Promise<ChatHistoryResponse> {
    try {
      logInfo('ChatFeedbackService', 'Saving chat message', { 
        messageId: message.id,
        userId: message.userId,
        messageType: message.messageType,
        deviceId: message.deviceId
      });

      // Remove the id field as the backend generates its own UUID
      const { id, ...messageWithoutId } = message;
      
      const response = await fetch(`${this.baseUrl}/api/chat-history/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenService.getToken()}`,
        },
        body: JSON.stringify(messageWithoutId),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logError('ChatFeedbackService', `Failed to save message: ${response.status} - ${errorText}`);
        throw new Error(`Failed to save message: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      logInfo('ChatFeedbackService', 'Message saved successfully', {
        messageId: message.id,
        savedId: result.id
      });

      return result;

    } catch (error) {
      logError('ChatFeedbackService', 'Failed to save message', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * Add user feedback to a message
   */
  async addFeedback(feedbackRequest: ChatFeedbackRequest): Promise<void> {
    try {
      logInfo('ChatFeedbackService', 'Adding user feedback', { 
        messageId: feedbackRequest.messageId,
        feedback: feedbackRequest.feedback
      });

      const response = await fetch(`${this.baseUrl}/api/chat-history/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenService.getToken()}`,
        },
        body: JSON.stringify(feedbackRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logError('ChatFeedbackService', `Failed to add feedback: ${response.status} - ${errorText}`);
        throw new Error(`Failed to add feedback: ${response.status} ${response.statusText}`);
      }

      logInfo('ChatFeedbackService', 'Feedback added successfully', {
        messageId: feedbackRequest.messageId,
        feedback: feedbackRequest.feedback
      });

    } catch (error) {
      logError('ChatFeedbackService', 'Failed to add feedback', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * Get chat history for a user
   */
  async getUserChatHistory(userId: string, page: number = 0, size: number = 20): Promise<{
    content: ChatHistoryResponse[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  }> {
    try {
      logInfo('ChatFeedbackService', 'Getting user chat history', { 
        userId,
        page,
        size
      });

      const response = await fetch(`${this.baseUrl}/api/chat-history/user/${userId}?page=${page}&size=${size}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenService.getToken()}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logError('ChatFeedbackService', `Failed to get user chat history: ${response.status} - ${errorText}`);
        throw new Error(`Failed to get user chat history: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      logInfo('ChatFeedbackService', 'User chat history retrieved', {
        userId,
        totalElements: result.totalElements,
        totalPages: result.totalPages
      });

      return result;

    } catch (error) {
      logError('ChatFeedbackService', 'Failed to get user chat history', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * Get chat history for a device
   */
  async getDeviceChatHistory(deviceId: string, page: number = 0, size: number = 20): Promise<{
    content: ChatHistoryResponse[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  }> {
    try {
      logInfo('ChatFeedbackService', 'Getting device chat history', { 
        deviceId,
        page,
        size
      });

      const response = await fetch(`${this.baseUrl}/api/chat-history/device/${deviceId}?page=${page}&size=${size}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenService.getToken()}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logError('ChatFeedbackService', `Failed to get device chat history: ${response.status} - ${errorText}`);
        throw new Error(`Failed to get device chat history: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      logInfo('ChatFeedbackService', 'Device chat history retrieved', {
        deviceId,
        totalElements: result.totalElements,
        totalPages: result.totalPages
      });

      return result;

    } catch (error) {
      logError('ChatFeedbackService', 'Failed to get device chat history', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * Get recent chat history for a user
   */
  async getRecentUserChatHistory(userId: string, limit: number = 50): Promise<ChatHistoryResponse[]> {
    try {
      logInfo('ChatFeedbackService', 'Getting recent user chat history', { 
        userId,
        limit
      });

      const response = await fetch(`${this.baseUrl}/api/chat-history/user/${userId}/recent?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenService.getToken()}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logError('ChatFeedbackService', `Failed to get recent user chat history: ${response.status} - ${errorText}`);
        throw new Error(`Failed to get recent user chat history: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      logInfo('ChatFeedbackService', 'Recent user chat history retrieved', {
        userId,
        count: result.length
      });

      return result;

    } catch (error) {
      logError('ChatFeedbackService', 'Failed to get recent user chat history', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * Get recent chat history for a device
   */
  async getRecentDeviceChatHistory(deviceId: string, limit: number = 50): Promise<ChatHistoryResponse[]> {
    try {
      logInfo('ChatFeedbackService', 'Getting recent device chat history', { 
        deviceId,
        limit
      });

      const response = await fetch(`${this.baseUrl}/api/chat-history/device/${deviceId}/recent?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenService.getToken()}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logError('ChatFeedbackService', `Failed to get recent device chat history: ${response.status} - ${errorText}`);
        throw new Error(`Failed to get recent device chat history: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      logInfo('ChatFeedbackService', 'Recent device chat history retrieved', {
        deviceId,
        count: result.length
      });

      return result;

    } catch (error) {
      logError('ChatFeedbackService', 'Failed to get recent device chat history', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * Get chat history by session ID
   */
  async getChatHistoryBySession(sessionId: string): Promise<ChatHistoryResponse[]> {
    try {
      logInfo('ChatFeedbackService', 'Getting chat history by session', { 
        sessionId
      });

      const response = await fetch(`${this.baseUrl}/api/chat-history/session/${sessionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenService.getToken()}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logError('ChatFeedbackService', `Failed to get session chat history: ${response.status} - ${errorText}`);
        throw new Error(`Failed to get session chat history: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      logInfo('ChatFeedbackService', 'Session chat history retrieved', {
        sessionId,
        count: result.length
      });

      return result;

    } catch (error) {
      logError('ChatFeedbackService', 'Failed to get session chat history', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * Get feedback statistics for a user
   */
  async getUserFeedbackStats(userId: string): Promise<FeedbackStats> {
    try {
      logInfo('ChatFeedbackService', 'Getting user feedback statistics', { 
        userId
      });

      const response = await fetch(`${this.baseUrl}/api/chat-history/user/${userId}/feedback-stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenService.getToken()}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logError('ChatFeedbackService', `Failed to get user feedback stats: ${response.status} - ${errorText}`);
        throw new Error(`Failed to get user feedback stats: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      logInfo('ChatFeedbackService', 'User feedback statistics retrieved', {
        userId,
        totalMessages: result.totalMessages,
        likes: result.likes,
        dislikes: result.dislikes,
        regenerates: result.regenerates
      });

      return result;

    } catch (error) {
      logError('ChatFeedbackService', 'Failed to get user feedback statistics', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * Get feedback statistics for a device
   */
  async getDeviceFeedbackStats(deviceId: string): Promise<FeedbackStats> {
    try {
      logInfo('ChatFeedbackService', 'Getting device feedback statistics', { 
        deviceId
      });

      const response = await fetch(`${this.baseUrl}/api/chat-history/device/${deviceId}/feedback-stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenService.getToken()}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logError('ChatFeedbackService', `Failed to get device feedback stats: ${response.status} - ${errorText}`);
        throw new Error(`Failed to get device feedback stats: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      logInfo('ChatFeedbackService', 'Device feedback statistics retrieved', {
        deviceId,
        totalMessages: result.totalMessages,
        likes: result.likes,
        dislikes: result.dislikes,
        regenerates: result.regenerates
      });

      return result;

    } catch (error) {
      logError('ChatFeedbackService', 'Failed to get device feedback statistics', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }
}

// Export singleton instance
export const chatFeedbackService = new ChatFeedbackService();
