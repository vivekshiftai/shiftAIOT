import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, 
  Send,
  Bot,
  User
} from 'lucide-react';
import { logError, logInfo } from '../utils/logger';
import '../styles/knowledge.css';

// Chat message interface
interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  images?: any[];
  tables?: any[];
  chunks_used?: any[];
  processing_time?: string;
  queryType?: 'DATABASE' | 'PDF' | 'MIXED' | 'LLM_ANSWER' | 'UNKNOWN';
  databaseResults?: any[];
  rowCount?: number;
  sqlQuery?: string;
}

export const ProcessSection: React.FC = () => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your AI assistant for marketing intelligence.\n\n**How to use:**\n1. Ask me questions about market trends, customer insights, or competitive analysis\n2. I can help you with marketing strategies, campaign optimization, and market research\n\n**What would you like to know about your market intelligence?**',
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Refs for scrolling
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Simple function to load query suggestions (optional)
  const loadQuerySuggestions = async () => {
    try {
      // Set some default suggestions for marketing intelligence
      const defaultSuggestions = [
        "What are the current market trends?",
        "How can I analyze customer behavior?",
        "What is our competitive advantage?",
        "How can I optimize our marketing campaigns?",
        "What are the key performance indicators for our market?"
      ];
      logInfo('Process', 'Default marketing intelligence suggestions loaded', { count: defaultSuggestions.length });
    } catch (error) {
      logError('Process', 'Failed to load query suggestions', error instanceof Error ? error : new Error('Unknown error'));
    }
  };

  // Load suggestions on component mount
  useEffect(() => {
    loadQuerySuggestions();
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: newMessage,
      timestamp: new Date()
    };

    setChatMessages((prev: ChatMessage[]) => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);

    try {
      // Simple response for process queries
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `I understand you're asking about: "${userMessage.content}"\n\nI'm here to help with process management, workflow optimization, and procedure documentation. Please provide more specific details about the process you'd like to discuss, and I'll assist you with analysis, optimization, or documentation.`,
        timestamp: new Date(),
        queryType: 'UNKNOWN'
      };
      setChatMessages((prev: ChatMessage[]) => [...prev, assistantMessage]);
    } catch (error) {
      logError('Process', 'Failed to send message', error instanceof Error ? error : new Error('Unknown error'));
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `I encountered an error while processing your request. Please try again or rephrase your question.`,
        timestamp: new Date(),
        queryType: 'UNKNOWN'
      };
      setChatMessages((prev: ChatMessage[]) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="process-section flex flex-col bg-gray-50 h-full">
      {/* Fixed Header */}
      <div className="knowledge-fixed-header flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-green-500 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Process Management</h1>
              <p className="text-gray-600">AI-powered process optimization and documentation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Full Width Chat Interface */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Chat Messages Area */}
        <div 
          ref={chatMessagesRef}
          className="knowledge-chat-messages flex-1 overflow-y-auto p-6 space-y-4"
        >
          {chatMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl rounded-lg p-4 ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {message.type === 'assistant' && (
                    <div className="p-1 bg-green-100 rounded-full flex-shrink-0">
                      <Bot className="w-4 h-4 text-green-600" />
                    </div>
                  )}
                  {message.type === 'user' && (
                    <div className="p-1 bg-blue-100 rounded-full flex-shrink-0">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-sm">
                        {message.type === 'user' ? 'You' : 'Process AI'}
                      </span>
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                      {message.queryType && (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          message.queryType === 'PDF' ? 'bg-green-100 text-green-700' :
                          message.queryType === 'DATABASE' ? 'bg-blue-100 text-blue-700' :
                          message.queryType === 'MIXED' ? 'bg-purple-100 text-purple-700' :
                          message.queryType === 'LLM_ANSWER' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {message.queryType === 'PDF' ? '📄' : message.queryType === 'DATABASE' ? '📊' : '🤖'} {message.queryType}
                        </span>
                      )}
                      {message.rowCount && (
                        <span className="text-xs text-gray-500">
                          {message.rowCount} result{message.rowCount === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                        {message.content}
                      </pre>
                    </div>
                    {message.images && message.images.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {message.images.map((image, index) => (
                          <div key={index} className="border rounded-lg p-2">
                            <img 
                              src={image.url || image.imageUrl} 
                              alt={`Process image ${index + 1}`}
                              className="w-full h-32 object-cover rounded"
                            />
                            <p className="text-xs text-gray-600 mt-1">{image.caption || image.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {message.tables && message.tables.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.tables.map((table, index) => (
                          <div key={index} className="border rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-3 py-2 border-b">
                              <h4 className="font-medium text-sm">Process Data Table {index + 1}</h4>
                            </div>
                            <div className="p-3">
                              <pre className="text-xs overflow-x-auto">
                                {JSON.stringify(table, null, 2)}
                              </pre>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {message.chunks_used && message.chunks_used.length > 0 && (
                      <div className="mt-3">
                        <details className="text-xs">
                          <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                            📋 View {message.chunks_used.length} source chunk{message.chunks_used.length === 1 ? '' : 's'}
                          </summary>
                          <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                            {message.chunks_used.map((chunk, index) => (
                              <div key={index} className="bg-gray-50 p-2 rounded text-xs">
                                <strong>Chunk {index + 1}:</strong> {chunk.substring(0, 100)}...
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}
                    {message.processing_time && (
                      <div className="mt-2 text-xs text-gray-500">
                        ⏱️ Processed in {message.processing_time}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-3xl rounded-lg p-4 bg-white border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-green-100 rounded-full flex-shrink-0">
                    <Bot className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-500">Process AI is thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input Area */}
        <div className="knowledge-chat-input flex-shrink-0 p-6 bg-white border-t border-gray-200">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about processes, workflows, or procedures..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                rows={3}
                disabled={isTyping}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isTyping}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
