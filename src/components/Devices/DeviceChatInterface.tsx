import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { chatService, ChatMessage } from '../../services/chatService';
import { logInfo, logError } from '../../utils/logger';
import ChatTableDisplay from './ChatTableDisplay';
import { formatKnowledgeBaseResponse, getUserDisplayName } from '../../utils/responseTemplates';
import { useAuth } from '../../contexts/AuthContext';
import { processImagePlaceholders } from '../../utils/imageResponseProcessor';
import { ImageViewer } from '../UI/ImageViewer';
import { ChatFeedbackButtons } from '../Chat/ChatFeedbackButtons';
import { chatFeedbackService } from '../../services/chatFeedbackService';

interface DeviceChatInterfaceProps {
  deviceName: string;
  deviceId: string;
  pdfFileName: string;
  onClose?: () => void;
  onContinue?: () => void;
}

export const DeviceChatInterface: React.FC<DeviceChatInterfaceProps> = ({
  deviceName,
  deviceId,
  pdfFileName,
  onClose,
  onContinue
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Image viewer state
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerImages, setImageViewerImages] = useState<any[]>([]);
  const [imageViewerInitialIndex, setImageViewerInitialIndex] = useState(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatResponseText = (text: string, images: any[] = []): string => {
    // First, process image placeholders
    const imageProcessed = processImagePlaceholders(text, images);
    let formatted = imageProcessed.processedText;
    
    // Convert line breaks to HTML
    formatted = formatted.replace(/\n/g, '<br>');
    
    // Handle bold text (**text**)
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Handle italic text (*text*)
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Handle code blocks
    formatted = formatted.replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>');
    
    // Handle inline code
    formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');
    
    return formatted;
  };

  // Image viewer functions
  const openImageViewer = (images: any[], initialIndex: number = 0) => {
    setImageViewerImages(images);
    setImageViewerInitialIndex(initialIndex);
    setImageViewerOpen(true);
  };

  const closeImageViewer = () => {
    setImageViewerOpen(false);
    setImageViewerImages([]);
    setImageViewerInitialIndex(0);
  };

  // Feedback handling functions
  const handleFeedback = async (messageId: string, feedback: 'like' | 'dislike' | 'regenerate') => {
    try {
      logInfo('DeviceChatInterface', 'Handling user feedback', { 
        messageId, 
        feedback,
        deviceId 
      });

      // Send feedback to backend
      await chatFeedbackService.addFeedback({
        messageId,
        feedback
      });

      logInfo('DeviceChatInterface', 'Feedback submitted successfully', { 
        messageId, 
        feedback 
      });

    } catch (error) {
      logError('DeviceChatInterface', 'Failed to submit feedback', error instanceof Error ? error : new Error('Unknown error'));
    }
  };


  // Load chat history on component mount
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        logInfo('DeviceChatInterface', 'Loading device chat history', { deviceId, deviceName });
        
        const history = await chatService.getDeviceChatHistory(deviceId, 20);
        
        if (history.messages.length > 0) {
          // Format assistant messages with personalized templates
          const formattedMessages = history.messages.map(message => {
            if (message.type === 'assistant' && message.content) {
              const username = getUserDisplayName(user);
              const formattedContent = formatKnowledgeBaseResponse(message.content, username);
              return { ...message, content: formattedContent };
            }
            return message;
          });
          setMessages(formattedMessages);
          logInfo('DeviceChatInterface', 'Chat history loaded successfully', { 
            messageCount: history.messages.length 
          });
        } else {
          // Show welcome message if no history
          const welcomeMessage: ChatMessage = {
            id: 'welcome_' + Date.now(),
            type: 'assistant',
            content: `Hello! I'm here to help you with information about this device. What would you like to know?`,
            timestamp: new Date(),
            pdfName: pdfFileName,
            deviceId: deviceId
          };
          setMessages([welcomeMessage]);
        }
      } catch (error) {
        logError('DeviceChatInterface', 'Failed to load chat history', error instanceof Error ? error : new Error('Unknown error'));
        
        // Show welcome message on error
        const welcomeMessage: ChatMessage = {
          id: 'welcome_' + Date.now(),
          type: 'assistant',
          content: `Hello! I'm here to help you with information about this device. What would you like to know?`,
          timestamp: new Date(),
          pdfName: pdfFileName,
          deviceId: deviceId
        };
        setMessages([welcomeMessage]);
      }
    };

    loadChatHistory();
  }, [deviceId, deviceName, pdfFileName]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Component mount logging
  useEffect(() => {
    logInfo('DeviceChatInterface', 'Component mounted successfully', { deviceId, deviceName });
  }, [deviceId, deviceName]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const query = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    // Generate session ID for this conversation
    const sessionId = `device_${deviceId}_${Date.now()}`;

    try {
      logInfo('DeviceChatInterface', 'Sending message to AI', { 
        deviceId, 
        pdfName: pdfFileName,
        queryLength: query.length,
        sessionId
      });

      // Save user message to database
      if (user?.id && user?.organizationId) {
        await chatService.saveUserMessage(
          user.id,
          deviceId,
          user.organizationId,
          query,
          sessionId
        );
      }

      // Use the clean chat service - stores conversation automatically in backend
      const queryResponse = await chatService.queryPDF({
        pdf_name: pdfFileName,
        query: query,
        top_k: 5
      }, deviceId);
      
      // Save assistant message to database
      if (user?.id && user?.organizationId && queryResponse.response) {
        await chatService.saveAssistantMessage(
          user.id,
          deviceId,
          user.organizationId,
          queryResponse.response,
          sessionId,
          'PDF',
          pdfFileName,
          queryResponse.chunks_used ? JSON.stringify(queryResponse.chunks_used) : undefined,
          queryResponse.processing_time,
          undefined, // sqlQuery
          undefined, // databaseResults
          undefined  // rowCount
        );
      }

      // Reload chat history to get the updated conversation from backend
      const history = await chatService.getDeviceChatHistory(deviceId, 50);
      
      // Format assistant messages with personalized templates
      const formattedMessages = history.messages.map(message => {
        if (message.type === 'assistant' && message.content) {
          const username = getUserDisplayName(user);
          const formattedContent = formatKnowledgeBaseResponse(message.content, username);
          return { ...message, content: formattedContent };
        }
        return message;
      });
      setMessages(formattedMessages);
      
      logInfo('DeviceChatInterface', 'Message sent and chat history updated', {
        deviceId,
        responseLength: queryResponse.response?.length || 0,
        totalMessages: history.messages.length
      });

    } catch (error) {
      logError('DeviceChatInterface', 'Failed to send message', error instanceof Error ? error : new Error('Unknown error'));
      
      // Show error message to user
      const errorMessage: ChatMessage = {
        id: 'error_' + Date.now(),
        type: 'assistant',
        content: `I apologize, but I'm having trouble processing your request right now. ${error instanceof Error ? error.message : 'Please try again later.'}`,
        timestamp: new Date(),
        pdfName: pdfFileName,
        deviceId: deviceId,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      setMessages(prev => [...prev, {
        id: 'user_' + Date.now(),
        type: 'user',
        content: query,
        timestamp: new Date(),
        pdfName: pdfFileName,
        deviceId: deviceId
      }, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm border ${
                message.type === 'user'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-pink-400/30'
                  : 'bg-white/90 backdrop-blur-sm text-gray-800 border-gray-200/50'
              }`}
            >
              <div className="flex items-start gap-3">
                {message.type === 'assistant' && (
                  <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium opacity-70">
                      {message.type === 'user' ? 'You' : 'AI Assistant'}
                    </span>
                    <span className="text-xs opacity-50">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div 
                    className="text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatResponseText(message.content, message.images) }}
                    onClick={(e) => {
                      // Handle inline image clicks to open in ImageViewer
                      const target = e.target as HTMLElement;
                      if (target.tagName === 'IMG' && target.classList.contains('inline-response-image')) {
                        const filename = target.getAttribute('data-filename');
                        if (filename && message.images) {
                          const imageIndex = message.images.findIndex(img => img.filename === filename);
                          if (imageIndex !== -1) {
                            openImageViewer(message.images, imageIndex);
                          }
                        }
                      }
                    }}
                  />
                  
                  {/* Images are now displayed inline in the text above - no separate gallery needed */}
                  
                  {/* Display Tables */}
                  {message.tables && message.tables.length > 0 && (
                    <ChatTableDisplay 
                      tables={message.tables} 
                      className="mt-3"
                    />
                  )}
                  
                  {/* Feedback Buttons for Assistant Messages */}
                  {message.type === 'assistant' && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <ChatFeedbackButtons
                        messageId={message.id}
                        onFeedback={handleFeedback}
                        disabled={isLoading}
                      />
                    </div>
                  )}
                  
                  {message.error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-600">
                        Error: {message.error}
                      </p>
                    </div>
                  )}
                </div>
                {message.type === 'user' && (
                  <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-white flex-shrink-0">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about this device"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none text-sm bg-white text-gray-800 placeholder-gray-500 transition-all duration-300"
              rows={2}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className={`flex-shrink-0 w-12 h-12 rounded-lg transition-all duration-300 flex items-center justify-center ${
              inputValue.trim() && !isLoading
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 transform hover:scale-105 shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <Clock className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setInputValue('How do I set up this device?')}
            className="px-3 py-2 bg-white text-gray-700 rounded-full text-xs hover:bg-gray-50 transition-all duration-300 border border-gray-200 hover:border-gray-300"
          >
            <CheckCircle className="w-3 h-3 inline mr-1" />
            Setup Guide
          </button>
          <button
            onClick={() => setInputValue('What maintenance is required?')}
            className="px-3 py-2 bg-white text-gray-700 rounded-full text-xs hover:bg-gray-50 transition-all duration-300 border border-gray-200 hover:border-gray-300"
          >
            <Settings className="w-3 h-3 inline mr-1" />
            Maintenance
          </button>
          <button
            onClick={() => setInputValue('Help me troubleshoot issues')}
            className="px-3 py-2 bg-white text-gray-700 rounded-full text-xs hover:bg-gray-50 transition-all duration-300 border border-gray-200 hover:border-gray-300"
          >
            <AlertTriangle className="w-3 h-3 inline mr-1" />
            Troubleshooting
          </button>
          <button
            onClick={() => setInputValue('Show me technical specifications')}
            className="px-3 py-2 bg-white text-gray-700 rounded-full text-xs hover:bg-gray-50 transition-all duration-300 border border-gray-200 hover:border-gray-300"
          >
            <Settings className="w-3 h-3 inline mr-1" />
            Specifications
          </button>
        </div>
      </div>

      {/* Image Viewer Modal */}
      <ImageViewer
        images={imageViewerImages}
        isOpen={imageViewerOpen}
        onClose={closeImageViewer}
        initialIndex={imageViewerInitialIndex}
      />

    </div>
  );
};

export default DeviceChatInterface;
