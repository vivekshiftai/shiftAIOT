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
  Trash2,
  Clock
} from 'lucide-react';
import { pdfProcessingService } from '../../services/pdfprocess';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface DeviceChatInterfaceProps {
  deviceName: string;
  pdfFileName: string;
  onClose: () => void;
  onContinue: () => void;
}

export const DeviceChatInterface: React.FC<DeviceChatInterfaceProps> = ({
  deviceName,
  pdfFileName,
  onClose,
  onContinue
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: `Hello! I'm your AI assistant for ${deviceName}. I've analyzed the documentation you uploaded (${pdfFileName}) and I'm ready to help you with any questions about your device. You can ask me about setup, maintenance, troubleshooting, technical specifications, or any other aspects of your device. What would you like to know?`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, vx: number, vy: number, color: string, size: number}>>([]);
  const [floatingIcons, setFloatingIcons] = useState<Array<{id: number, icon: any, x: number, y: number, delay: number, rotation: number}>>([]);
  const [aiStatus, setAiStatus] = useState<'idle' | 'thinking' | 'responding'>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate animated particles
  useEffect(() => {
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      vx: (Math.random() - 0.5) * 1,
      vy: (Math.random() - 0.5) * 1,
      color: ['#3B82F6', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B'][Math.floor(Math.random() * 5)],
      size: Math.random() * 2 + 1
    }));
    setParticles(newParticles);

    // Generate floating AI icons
    const iconList = [
      Bot, Settings, AlertTriangle, CheckCircle,
      FileText, Send, User, MessageSquare, Trash2, Clock
    ];

    const newFloatingIcons = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      icon: iconList[Math.floor(Math.random() * iconList.length)],
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2000,
      rotation: Math.random() * 360
    }));
    setFloatingIcons(newFloatingIcons);
  }, []);

  // Animate particles
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => prev.map(particle => ({
        ...particle,
        x: (particle.x + particle.vx + 100) % 100,
        y: (particle.y + particle.vy + 100) % 100
      })));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInputValue('');
    setIsLoading(true);
    setAiStatus('thinking');

    try {
      // Get device info from localStorage
      const lastCreatedDevice = localStorage.getItem('lastCreatedDevice');
      let deviceInfo = null;
      
      if (lastCreatedDevice) {
        try {
          deviceInfo = JSON.parse(lastCreatedDevice);
        } catch (e) {
          console.warn('Failed to parse lastCreatedDevice:', e);
        }
      }

      setAiStatus('responding');

      // Use the real PDF processing service to query the uploaded PDF
      const queryResponse = await pdfProcessingService.queryPDF({
        pdf_name: pdfFileName,
        query: inputValue.trim(),
        top_k: 5
      });
      
      let responseContent = queryResponse.response || 'I apologize, but I couldn\'t find a specific answer to your question in the device documentation. Please try rephrasing your question or ask about a different aspect of the device.';
      
      // Add context about generated rules and maintenance if available
      if (deviceInfo && (inputValue.toLowerCase().includes('rule') || inputValue.toLowerCase().includes('maintenance'))) {
        responseContent += '\n\n💡 **AI-Generated Insights Available:** I\'ve analyzed your device documentation and generated monitoring rules and maintenance schedules. You can view these in the device details section.';
      }
      
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { ...msg, content: responseContent, isLoading: false }
          : msg
      ));
    } catch (error) {
      console.error('PDF query failed:', error);
      
      // Provide user-friendly error message instead of fallback data
      let errorMessage = 'I apologize, but I\'m having trouble accessing the device documentation right now. ';
      
      if (error instanceof Error) {
        if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
          errorMessage += 'The PDF processing service appears to be unavailable. Please check your internet connection and try again.';
        } else if (error.message.includes('404') || error.message.includes('not found')) {
          errorMessage += 'The device documentation could not be found. Please ensure the PDF was uploaded successfully during device onboarding.';
        } else if (error.message.includes('500') || error.message.includes('server error')) {
          errorMessage += 'The PDF processing service is experiencing issues. Please try again in a few moments.';
        } else {
          errorMessage += 'An unexpected error occurred while processing your question. Please try again.';
        }
      } else {
        errorMessage += 'An unexpected error occurred. Please try again.';
      }
      
      errorMessage += '\n\n**Error Details:** ' + (error instanceof Error ? error.message : 'Unknown error');
      
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { ...msg, content: errorMessage, isLoading: false }
          : msg
      ));
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
    <div className="w-full h-full relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900">
        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {particles.map(particle => (
            <div
              key={particle.id}
              className="absolute rounded-full opacity-20 animate-pulse"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                backgroundColor: particle.color,
                animationDelay: `${particle.id * 0.1}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        {/* Floating AI Icons */}
        <div className="absolute inset-0 overflow-hidden">
          {floatingIcons.map(({ id, icon: Icon, x, y, delay, rotation }) => (
            <div
              key={id}
              className="absolute text-white/5 transition-all duration-300 animate-bounce"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                animationDelay: `${delay}ms`,
                transform: `rotate(${rotation}deg)`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            >
              <Icon className="w-3 h-3" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden h-full flex flex-col relative z-10">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-4 relative overflow-hidden">
          {/* AI Status Indicator */}
          <div className="absolute top-2 right-2 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              aiStatus === 'idle' ? 'bg-green-400' :
              aiStatus === 'thinking' ? 'bg-yellow-400 animate-pulse' :
              'bg-blue-400 animate-ping'
            }`}></div>
            <span className="text-xs text-blue-100">
              {aiStatus === 'idle' ? 'AI Ready' :
               aiStatus === 'thinking' ? 'Thinking...' :
               'Responding...'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                {aiStatus === 'thinking' && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold">AI Assistant</h1>
                <p className="text-blue-100 text-sm flex items-center gap-2">
                  <CheckCircle className="w-3 h-3" />
                  Ask me anything about {deviceName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Enhanced Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 h-64">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 backdrop-blur-sm border ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-400/30'
                      : 'bg-white/10 text-gray-900 border-white/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {message.type === 'assistant' && (
                      <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                        <Bot className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      {message.isLoading ? (
                        <div className="flex items-center gap-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm text-gray-600">AI is thinking...</span>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.content}
                        </div>
                      )}
                    </div>
                    {message.type === 'user' && (
                      <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                        <User className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className={`text-xs mt-2 ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Enhanced Input Area */}
        <div className="border-t border-white/20 p-4 bg-white/5 backdrop-blur-sm">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about setup, maintenance, troubleshooting, or specifications..."
                className="w-full px-4 py-3 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm bg-white/10 backdrop-blur-sm text-white placeholder-white/60"
                rows={2}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className={`flex-shrink-0 w-12 h-12 rounded-xl transition-all duration-300 flex items-center justify-center ${
                inputValue.trim() && !isLoading
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transform hover:scale-105 shadow-lg'
                  : 'bg-white/20 text-white/40 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <Clock className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Enhanced Quick Actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setInputValue('How do I set up this device?')}
              className="px-3 py-2 bg-white/10 backdrop-blur-sm text-white/80 rounded-full text-xs hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-white/40"
            >
              <CheckCircle className="w-3 h-3 inline mr-1" />
              Setup Guide
            </button>
            <button
              onClick={() => setInputValue('What maintenance is required?')}
              className="px-3 py-2 bg-white/10 backdrop-blur-sm text-white/80 rounded-full text-xs hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-white/40"
            >
              <Settings className="w-3 h-3 inline mr-1" />
              Maintenance
            </button>
            <button
              onClick={() => setInputValue('Help me troubleshoot issues')}
              className="px-3 py-2 bg-white/10 backdrop-blur-sm text-white/80 rounded-full text-xs hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-white/40"
            >
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              Troubleshooting
            </button>
            <button
              onClick={() => setInputValue('Show me technical specifications')}
              className="px-3 py-2 bg-white/10 backdrop-blur-sm text-white/80 rounded-full text-xs hover:bg-white/20 transition-all duration-300 border border-white/20 hover:border-white/40"
            >
              <Settings className="w-3 h-3 inline mr-1" />
              Specifications
            </button>
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="border-t border-white/20 p-4 bg-white/5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-white/60">
              <FileText className="w-3 h-3" />
              <span>Analyzed: {pdfFileName}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setMessages([messages[0]])}
                className="flex items-center gap-1 px-3 py-1 text-white/60 hover:text-white transition-colors text-xs hover:bg-white/10 rounded-lg"
              >
                <Clock className="w-3 h-3" />
                Reset
              </button>
              <button
                onClick={onContinue}
                className="flex items-center gap-1 px-4 py-1 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-300 font-medium text-xs transform hover:scale-105 shadow-lg"
              >
                <CheckCircle className="w-3 h-3" />
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
