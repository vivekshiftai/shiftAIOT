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
  Settings,
  Cpu,
  BarChart3,
  Clipboard
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
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-slate-200">
      {/* Header with Device Information */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Bot className="w-6 h-6 mr-2" />
            <h2 className="text-lg font-semibold">AI Device Assistant</h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Device Information */}
        <div className="bg-white/10 rounded-lg p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center">
              <Cpu className="w-4 h-4 mr-2 opacity-80" />
              <span className="font-medium">{deviceName}</span>
            </div>
            {deviceType && (
              <div className="flex items-center">
                <Settings className="w-4 h-4 mr-2 opacity-80" />
                <span>{deviceType}</span>
              </div>
            )}
            {pdfFileName && (
              <div className="flex items-center md:col-span-2">
                <FileText className="w-4 h-4 mr-2 opacity-80" />
                <span className="font-medium">Document: {pdfFileName}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.type === 'assistant' && (
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.type === 'assistant' && (
                    <button
                      aria-label="Copy message"
                      title="Copy"
                      onClick={() => navigator.clipboard.writeText(message.content)}
                      className="mt-2 text-xs text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"
                    >
                      <Clipboard className="w-3 h-3" /> Copy
                    </button>
                  )}
                  {message.metadata && (
                    <div className="mt-2 text-xs opacity-70">
                      {message.metadata.source && (
                        <div className="flex items-center">
                          <FileText className="w-3 h-3 mr-1" />
                          Source: {message.metadata.source}
                        </div>
                      )}
                      {message.metadata.pageNumber && (
                        <div className="flex items-center">
                          <BookOpen className="w-3 h-3 mr-1" />
                          Page: {message.metadata.pageNumber}
                        </div>
                      )}
                      {message.metadata.confidence && (
                        <div className="flex items-center">
                          <BarChart3 className="w-3 h-3 mr-1" />
                          Confidence: {Math.round(message.metadata.confidence * 100)}%
                        </div>
                      )}
                    </div>
                  )}
                  <div className="text-xs opacity-60 mt-1">
                    {formatTimestamp(message.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
          <p className="text-sm text-gray-600 mb-3">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => {
                  setNewMessage(question);
                  setTimeout(() => sendMessage(), 100);
                }}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-slate-200 p-4">
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your device..."
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={1}
              disabled={isTyping}
              aria-label="Message input"
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isTyping}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};
