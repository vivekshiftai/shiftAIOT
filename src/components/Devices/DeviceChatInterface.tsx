import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  FileText, 
  Loader2, 
  MessageSquare, 
  Sparkles,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  BookOpen,
  Zap,
  Target,
  Settings
} from 'lucide-react';
import { pdfProcessingService, QueryRequest, QueryResponse } from '../../services/pdfProcessingService';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: string[];
  metadata?: {
    source?: string;
    confidence?: number;
    pageNumber?: number;
  };
}

interface DeviceChatInterfaceProps {
  deviceId: string;
  deviceName: string;
  pdfFileName?: string;
  deviceType?: string;
  manufacturer?: string;
  model?: string;
  onClose?: () => void;
}

export const DeviceChatInterface: React.FC<DeviceChatInterfaceProps> = ({
  deviceId,
  deviceName,
  pdfFileName,
  deviceType,
  manufacturer,
  model,
  onClose
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: `Hello! I'm your AI assistant for ${deviceName}. I can help you with information about this device, answer questions from the uploaded documentation, and assist with troubleshooting. What would you like to know?`,
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    'What are the main features of this device?',
    'How do I troubleshoot common issues?',
    'What are the maintenance requirements?',
    'What are the technical specifications?'
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load chat history for this device
    loadChatHistory();
  }, [deviceId]);

  const loadChatHistory = async () => {
    try {
      // In a real implementation, you would load chat history from the backend
      // For now, we'll use the initial message
      setChatHistory(messages);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: newMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);

    try {
      let response: ChatMessage;

      if (pdfFileName) {
        // Query the PDF for device-specific information
        const queryRequest: QueryRequest = {
          pdf_filename: pdfFileName,
          query: userMessage.content,
          max_results: 3
        };

        try {
          const queryResponse = await pdfProcessingService.queryPDF(queryRequest);
          
          response = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: queryResponse.answer || generateFallbackResponse(userMessage.content),
            timestamp: new Date(),
            metadata: {
              source: pdfFileName,
              confidence: queryResponse.confidence || 0.8,
              pageNumber: queryResponse.results?.[0]?.page_number
            }
          };
        } catch (error) {
          console.error('PDF query failed:', error);
          response = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: generateFallbackResponse(userMessage.content),
            timestamp: new Date()
          };
        }
      } else {
        // Generate a general response based on device information
        response = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: generateDeviceResponse(userMessage.content),
          timestamp: new Date()
        };
      }

      setMessages(prev => [...prev, response]);
      
      // Update chat history
      setChatHistory(prev => [...prev, userMessage, response]);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error while processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateFallbackResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('feature') || lowerQuery.includes('capability')) {
      return `Based on the device information, ${deviceName} appears to be a ${deviceType || 'IoT device'} with advanced monitoring capabilities. The device is designed for reliable operation and includes various sensors and communication protocols.`;
    } else if (lowerQuery.includes('troubleshoot') || lowerQuery.includes('problem') || lowerQuery.includes('issue')) {
      return `For troubleshooting ${deviceName}, I recommend checking the following: 1) Verify network connectivity, 2) Check power supply, 3) Review device logs, 4) Ensure proper configuration. Would you like me to elaborate on any of these areas?`;
    } else if (lowerQuery.includes('maintenance') || lowerQuery.includes('service')) {
      return `Regular maintenance for ${deviceName} typically includes: 1) Cleaning sensors and components, 2) Checking firmware updates, 3) Verifying calibration, 4) Inspecting physical connections. The frequency depends on your operating environment.`;
    } else if (lowerQuery.includes('specification') || lowerQuery.includes('technical')) {
      return `${deviceName} is a ${deviceType || 'IoT device'} manufactured by ${manufacturer || 'the manufacturer'}. ${model ? `Model: ${model}. ` : ''}For detailed technical specifications, please refer to the device documentation or contact support.`;
    } else {
      return `I understand you're asking about "${query}" regarding ${deviceName}. While I don't have specific documentation available, I can help you with general device information, troubleshooting, and best practices. What specific aspect would you like to know more about?`;
    }
  };

  const generateDeviceResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('hello') || lowerQuery.includes('hi')) {
      return `Hello! I'm here to help you with ${deviceName}. This ${deviceType || 'IoT device'} is ready to assist you with monitoring, troubleshooting, and optimization. What would you like to know?`;
    } else if (lowerQuery.includes('status') || lowerQuery.includes('health')) {
      return `${deviceName} is currently online and functioning normally. The device is actively monitoring and collecting data. You can view real-time status and telemetry data in the device dashboard.`;
    } else if (lowerQuery.includes('configure') || lowerQuery.includes('setup')) {
      return `To configure ${deviceName}, you can access the device settings through the dashboard. The device supports various configuration options including network settings, sensor calibration, and alert thresholds.`;
    } else {
      return generateFallbackResponse(query);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setNewMessage(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Device Chat Assistant</h3>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>{deviceName}</span>
              {pdfFileName && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    <span>{pdfFileName}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <span className="sr-only">Close chat</span>
            ×
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className="flex items-start gap-3 max-w-3xl">
              <div className={`p-2 rounded-full flex-shrink-0 shadow-sm ${
                message.type === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}>
                {message.type === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1">
                <div
                  className={`px-4 py-3 rounded-2xl shadow-sm ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                      : 'bg-white text-slate-800 border border-slate-200'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Message metadata */}
                  {message.metadata && (
                    <div className={`mt-2 text-xs ${
                      message.type === 'user' ? 'text-blue-100' : 'text-slate-500'
                    }`}>
                      {message.metadata.source && (
                        <div className="flex items-center gap-1 mb-1">
                          <FileText className="w-3 h-3" />
                          <span>Source: {message.metadata.source}</span>
                          {message.metadata.pageNumber && (
                            <span>(Page {message.metadata.pageNumber})</span>
                          )}
                        </div>
                      )}
                      {message.metadata.confidence && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>Confidence: {Math.round(message.metadata.confidence * 100)}%</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <p className={`text-xs mt-2 ${
                    message.type === 'user' ? 'text-blue-100' : 'text-slate-500'
                  }`}>
                    {formatTimestamp(message.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-start gap-3 max-w-3xl">
              <div className="p-2 rounded-full bg-white text-slate-600 border border-slate-200">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-4 py-3 bg-white text-slate-800 border border-slate-200 rounded-2xl">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length === 1 && (
        <div className="px-4 pb-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              Suggested Questions
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestion(question)}
                  className="text-left p-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-white rounded-md transition-colors border border-transparent hover:border-slate-200"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about this device..."
              className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-slate-400">
              Enter to send, Shift+Enter for new line
            </div>
          </div>
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isTyping}
            className="px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
          >
            {isTyping ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
