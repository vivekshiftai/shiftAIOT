import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  FileText, 
  MessageSquare, 
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { chatService, ChatMessage } from '../../services/chatService';
import { logInfo, logError } from '../../utils/logger';
import ChatImageDisplay from './ChatImageDisplay';
import ChatTableDisplay from './ChatTableDisplay';

interface DeviceChatInterfaceProps {
  deviceName: string;
  deviceId: string;
  pdfFileName: string;
  onClose: () => void;
  onContinue: () => void;
}

export const DeviceChatInterface: React.FC<DeviceChatInterfaceProps> = ({
  deviceName,
  deviceId,
  pdfFileName,
  onClose,
  onContinue
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<'idle' | 'thinking' | 'responding'>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load chat history on component mount
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        logInfo('DeviceChatInterface', 'Loading device chat history', { deviceId, deviceName });
        
        const history = await chatService.getDeviceChatHistory(deviceId, 20);
        
        if (history.messages.length > 0) {
          setMessages(history.messages);
          logInfo('DeviceChatInterface', 'Chat history loaded successfully', { 
            messageCount: history.messages.length 
          });
        } else {
          // Show welcome message if no history
          const welcomeMessage: ChatMessage = {
            id: 'welcome_' + Date.now(),
            type: 'assistant',
            content: `Hello! I'm your AI assistant for ${deviceName}. I've analyzed the documentation you uploaded (${pdfFileName}) and I'm ready to help you with any questions about your device. You can ask me about setup, maintenance, troubleshooting, technical specifications, or any other aspects of your device. What would you like to know?`,
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
          content: `Hello! I'm your AI assistant for ${deviceName}. I'm ready to help you with any questions about your device.`,
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
    setAiStatus('thinking');

    try {
      logInfo('DeviceChatInterface', 'Sending message to AI', { 
        deviceId, 
        pdfName: pdfFileName,
        queryLength: query.length 
      });

      setAiStatus('responding');

      // Use the clean chat service - stores conversation automatically in backend
      const queryResponse = await chatService.queryPDF({
        pdf_name: pdfFileName,
        query: query,
        top_k: 5
      }, deviceId);
      
      // Reload chat history to get the updated conversation from backend
      const history = await chatService.getDeviceChatHistory(deviceId, 50);
      setMessages(history.messages);
      
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
      setAiStatus('idle');
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
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-indigo-400/30'
                  : 'bg-white/90 backdrop-blur-sm text-gray-800 border-gray-200/50'
              }`}
            >
              <div className="flex items-start gap-3">
                {message.type === 'assistant' && (
                  <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium opacity-70">
                      {message.type === 'user' ? 'You' : 'AI Assistant'}
                    </span>
                    <span className="text-xs opacity-50">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </div>
                  
                  {/* Display Images */}
                  {message.images && message.images.length > 0 && (
                    <ChatImageDisplay 
                      images={message.images} 
                      className="mt-3"
                    />
                  )}
                  
                  {/* Display Tables */}
                  {message.tables && message.tables.length > 0 && (
                    <ChatTableDisplay 
                      tables={message.tables} 
                      className="mt-3"
                    />
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
                  <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
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
              placeholder="Ask me about setup, maintenance, troubleshooting, or specifications..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm bg-white text-gray-800 placeholder-gray-500 transition-all duration-300"
              rows={2}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className={`flex-shrink-0 w-12 h-12 rounded-lg transition-all duration-300 flex items-center justify-center ${
              inputValue.trim() && !isLoading
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transform hover:scale-105 shadow-lg'
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

      {/* Footer */}
      <div className="border-t border-gray-200 p-4 bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <FileText className="w-3 h-3" />
            <span>Analyzed: {pdfFileName}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setMessages([messages[0]])}
              className="flex items-center gap-1 px-3 py-1 text-gray-500 hover:text-gray-700 transition-colors text-xs hover:bg-gray-50 rounded-lg"
            >
              <Clock className="w-3 h-3" />
              Reset
            </button>
            <button
              onClick={onContinue}
              className="flex items-center gap-1 px-4 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-medium text-xs"
            >
              <CheckCircle className="w-3 h-3" />
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceChatInterface;
