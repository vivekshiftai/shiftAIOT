import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  FileText, 
  Sparkles,
  MessageSquare, 
  X,
  RotateCcw
} from 'lucide-react';

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
      content: `Hello! I'm your AI assistant for ${deviceName}. I've analyzed your device documentation and I'm ready to help you with any questions about setup, maintenance, troubleshooting, or technical specifications. What would you like to know?`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

    try {
      // Simulate API call to /query endpoint
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock response based on user input
      const response = generateMockResponse(inputValue.toLowerCase());
      
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { ...msg, content: response, isLoading: false }
          : msg
      ));
    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { ...msg, content: 'Sorry, I encountered an error. Please try again.', isLoading: false }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockResponse = (query: string): string => {
    if (query.includes('setup') || query.includes('install')) {
      return `Based on your ${deviceName} documentation, here's the setup process:

1. **Power Connection**: Connect the device to a stable power source (24V DC)
2. **Network Configuration**: Configure the IP address and network settings as specified in your documentation
3. **Authentication**: Use the provided credentials to authenticate the device
4. **Calibration**: Run the initial calibration sequence
5. **Testing**: Perform a test cycle to ensure all sensors are working correctly

The complete setup should take approximately 15-20 minutes. Would you like me to provide more details about any specific step?`;
    } else if (query.includes('maintenance') || query.includes('service')) {
      return `Here's the recommended maintenance schedule for your ${deviceName}:

**Daily Checks:**
- Visual inspection for any physical damage
- Check indicator lights and status displays

**Weekly Maintenance:**
- Clean sensor surfaces
- Verify calibration accuracy
- Check communication status

**Monthly Maintenance:**
- Perform full calibration
- Update firmware if available
- Check all connections and wiring

**Quarterly Maintenance:**
- Replace air filters
- Perform comprehensive system test
- Update backup configurations

The device should be serviced by qualified technicians only.`;
    } else if (query.includes('troubleshoot') || query.includes('error') || query.includes('problem')) {
      return `Common troubleshooting steps for ${deviceName}:

**If the device won't start:**
1. Check power supply and connections
2. Verify fuse status
3. Check for error codes on display

**If communication fails:**
1. Verify network settings
2. Check cable connections
3. Restart the device
4. Verify firewall settings

**If readings are inaccurate:**
1. Perform sensor calibration
2. Check for environmental interference
3. Verify sensor placement

**Error Code Reference:**
- E01: Communication error
- E02: Sensor fault
- E03: Power supply issue
- E04: Calibration required

What specific issue are you experiencing?`;
    } else if (query.includes('specification') || query.includes('specs') || query.includes('technical')) {
      return `Technical specifications for ${deviceName}:

**Physical Dimensions:**
- Width: 200mm
- Height: 150mm
- Depth: 80mm
- Weight: 2.5kg

**Electrical Specifications:**
- Power Supply: 24V DC ±10%
- Power Consumption: 15W typical
- Operating Temperature: -20°C to +60°C
- Operating Humidity: 10% to 90% RH (non-condensing)

**Communication:**
- Protocol: MQTT, HTTP, TCP
- Network: Ethernet 10/100 Mbps
- Security: SSL/TLS encryption

**Accuracy:**
- Measurement Range: 0-100 units
- Accuracy: ±0.5% of full scale
- Resolution: 0.1 units

**Environmental:**
- Protection Rating: IP65
- Material: Stainless steel housing
- Certifications: CE, UL, RoHS compliant`;
    } else {
      return `I understand you're asking about "${query}". Based on the ${deviceName} documentation I've analyzed, I can help you with:

- **Setup and installation procedures**
- **Maintenance schedules and procedures**
- **Troubleshooting common issues**
- **Technical specifications and capabilities**
- **Safety precautions and warnings**
- **Performance optimization tips**

Could you please be more specific about what you'd like to know? I'm here to help you get the most out of your device!`;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="w-full h-full">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden h-full flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold">AI Assistant</h1>
                <p className="text-blue-100 text-sm">
                  Ask me anything about {deviceName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 h-64">
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.type === 'assistant' && (
                      <div className="flex-shrink-0 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <Bot className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      {message.isLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span className="text-xs">AI is thinking...</span>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap text-sm">
                          {message.content}
                        </div>
                      )}
                    </div>
                    {message.type === 'user' && (
                      <div className="flex-shrink-0 w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                        <User className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className={`text-xs mt-1 ${
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

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about setup, maintenance, troubleshooting, or specifications..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                rows={2}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Quick Actions */}
          <div className="mt-3 flex flex-wrap gap-1">
            <button
              onClick={() => setInputValue('How do I set up this device?')}
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200 transition-colors"
            >
              Setup Guide
            </button>
            <button
              onClick={() => setInputValue('What maintenance is required?')}
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200 transition-colors"
            >
              Maintenance
            </button>
            <button
              onClick={() => setInputValue('Help me troubleshoot issues')}
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200 transition-colors"
            >
              Troubleshooting
            </button>
            <button
              onClick={() => setInputValue('Show me technical specifications')}
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200 transition-colors"
            >
              Specifications
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <FileText className="w-3 h-3" />
              <span>Analyzed: {pdfFileName}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setMessages([messages[0]])}
                className="flex items-center gap-1 px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors text-xs"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
              <button
                onClick={onContinue}
                className="flex items-center gap-1 px-4 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-xs"
              >
                <Sparkles className="w-3 h-3" />
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
