import React, { useEffect, useState } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  Bot,
  Brain,
  MessageSquare,
  Settings,
  Trash2,
  Clock
} from 'lucide-react';

interface OnboardingResult {
  deviceId: string;
  deviceName: string;
  rulesGenerated: number;
  maintenanceItems: number;
  safetyPrecautions: number;
  processingTime: number;
  pdfFileName: string;
  // Additional details for comprehensive display
  deviceType?: string;
  manufacturer?: string;
  model?: string;
  location?: string;
  generatedRules?: Array<{
    name: string;
    description: string;
    priority: string;
  }>;
  maintenanceSchedule?: Array<{
    component: string;
    frequency: string;
    description: string;
  }>;
  safetyAlerts?: Array<{
    title: string;
    severity: string;
    description: string;
  }>;
}

interface OnboardingSuccessProps {
  result: OnboardingResult;
  onContinue: () => void;
  onClose: () => void;
}

export const OnboardingSuccess: React.FC<OnboardingSuccessProps> = ({ 
  result, 
  onContinue, 
  onClose 
}) => {
  const [animationPhase, setAnimationPhase] = useState<'initial' | 'transforming' | 'ai-ready' | 'complete'>('initial');
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, vx: number, vy: number, color: string}>>([]);
  const [deviceIcons, setDeviceIcons] = useState<Array<{id: number, icon: any, x: number, y: number, delay: number}>>([]);

  // Generate particles for background effect
  useEffect(() => {
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      color: ['#3B82F6', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B'][Math.floor(Math.random() * 5)]
    }));
    setParticles(newParticles);

    // Generate device transformation icons
    const deviceIconList = [
      { icon: Settings, delay: 0 },
      { icon: Brain, delay: 200 },
      { icon: Bot, delay: 400 },
      { icon: Settings, delay: 600 },
      { icon: Bot, delay: 800 },
      { icon: CheckCircle, delay: 1000 },
      { icon: Clock, delay: 1200 },
      { icon: Settings, delay: 1400 },
      { icon: AlertTriangle, delay: 1600 },
      { icon: MessageSquare, delay: 1800 }
    ];

    const newDeviceIcons = deviceIconList.map((item, i) => ({
      id: i,
      icon: item.icon,
      x: 20 + (i % 5) * 15,
      y: 30 + Math.floor(i / 5) * 15,
      delay: item.delay
    }));
    setDeviceIcons(newDeviceIcons);
  }, []);

  // Animation sequence
  useEffect(() => {
    const timer1 = setTimeout(() => setAnimationPhase('transforming'), 500);
    const timer2 = setTimeout(() => setAnimationPhase('ai-ready'), 2000);
    const timer3 = setTimeout(() => setAnimationPhase('complete'), 3500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
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

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 flex items-center justify-center p-6 z-50 overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute w-1 h-1 rounded-full opacity-30 animate-pulse"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              backgroundColor: particle.color,
              animationDelay: `${particle.id * 0.1}s`
            }}
          />
        ))}
      </div>

      {/* Main Success Container */}
      <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl max-w-7xl w-full overflow-hidden border border-white/20 max-h-[90vh] overflow-y-auto">
        {/* Animated Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-8 text-center overflow-hidden">
          {/* Floating Device Icons */}
          <div className="absolute inset-0 overflow-hidden">
            {deviceIcons.map(({ id, icon: Icon, x, y, delay }) => (
              <div
                key={id}
                className={`absolute text-white/20 transition-all duration-1000 ${
                  animationPhase === 'transforming' ? 'animate-bounce' : 'animate-pulse'
                }`}
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  animationDelay: `${delay}ms`,
                  transform: animationPhase === 'ai-ready' ? 'scale(1.2) rotate(360deg)' : 'scale(1)'
                }}
              >
                <Icon className="w-6 h-6" />
              </div>
            ))}
          </div>

          {/* Success Icon with Animation */}
          <div className={`relative z-10 transition-all duration-1000 ${
            animationPhase === 'transforming' ? 'scale-110 rotate-12' : 
            animationPhase === 'ai-ready' ? 'scale-125' : 'scale-100'
          }`}>
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/30">
              <div className={`transition-all duration-1000 ${
                animationPhase === 'transforming' ? 'animate-spin' : ''
              }`}>
                {animationPhase === 'initial' && <CheckCircle className="w-12 h-12 text-green-300" />}
                {animationPhase === 'transforming' && <Settings className="w-12 h-12 text-blue-300" />}
                {animationPhase === 'ai-ready' && <Brain className="w-12 h-12 text-purple-300" />}
                {animationPhase === 'complete' && <Bot className="w-12 h-12 text-indigo-300" />}
              </div>
            </div>
          </div>

          {/* Animated Title */}
          <h1 className={`text-4xl font-bold mb-4 transition-all duration-1000 ${
            animationPhase === 'transforming' ? 'text-yellow-300' :
            animationPhase === 'ai-ready' ? 'text-purple-300' :
            'text-white'
          }`}>
            {animationPhase === 'initial' && '🎉 Success!'}
            {animationPhase === 'transforming' && '🤖 Transforming...'}
            {animationPhase === 'ai-ready' && '🧠 AI-Powered!'}
            {animationPhase === 'complete' && '✨ AI Machine Ready!'}
          </h1>

          {/* Animated Subtitle */}
          <p className={`text-xl transition-all duration-1000 ${
            animationPhase === 'transforming' ? 'text-blue-200' :
            animationPhase === 'ai-ready' ? 'text-purple-200' :
            'text-blue-100'
          }`}>
            {animationPhase === 'initial' && `${result.deviceName} is now ready for intelligent monitoring`}
            {animationPhase === 'transforming' && 'Converting your device into an AI-powered machine...'}
            {animationPhase === 'ai-ready' && 'Your device now has artificial intelligence capabilities!'}
            {animationPhase === 'complete' && `You can now chat with ${result.deviceName} like a human!`}
          </p>
        </div>

        <div className="p-8 relative">
          {/* Transformation Progress */}
          {animationPhase === 'transforming' && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full rounded-full animate-pulse" 
                     style={{ width: '75%' }} />
              </div>
              <p className="text-center text-gray-600 mt-2 animate-pulse">AI Integration in Progress...</p>
            </div>
          )}

          {/* Device Information Summary */}
          {animationPhase === 'complete' && (
            <div className="mb-8 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-8 border border-slate-200">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                Device Information Summary
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <span className="text-slate-600 font-medium block mb-2">Device Name:</span>
                  <p className="text-slate-800 font-semibold text-lg">{result.deviceName}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <span className="text-slate-600 font-medium block mb-2">Device Type:</span>
                  <p className="text-slate-800 font-semibold text-lg">{result.deviceType || 'IoT Device'}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <span className="text-slate-600 font-medium block mb-2">Manufacturer:</span>
                  <p className="text-slate-800 font-semibold text-lg">{result.manufacturer || 'Not specified'}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <span className="text-slate-600 font-medium block mb-2">Location:</span>
                  <p className="text-slate-800 font-semibold text-lg">{result.location || 'Not specified'}</p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <span className="text-slate-600 font-medium block mb-2">Processing Time:</span>
                  <p className="text-slate-800 font-semibold text-lg">{result.processingTime}s</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <span className="text-slate-600 font-medium block mb-2">PDF File:</span>
                  <p className="text-slate-800 font-semibold text-lg truncate">{result.pdfFileName}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <span className="text-slate-600 font-medium block mb-2">Total Items:</span>
                  <p className="text-slate-800 font-semibold text-lg">{result.rulesGenerated + result.maintenanceItems + result.safetyPrecautions}</p>
                </div>
              </div>
            </div>
          )}

          {/* AI Capabilities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className={`text-center p-8 rounded-2xl transition-all duration-1000 ${
              animationPhase === 'complete' ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 shadow-xl' : 'bg-gray-50'
            }`}>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-1000 ${
                animationPhase === 'complete' ? 'bg-blue-500 text-white scale-110' : 'bg-blue-100 text-blue-600'
              }`}>
                <CheckCircle className="w-10 h-10" />
              </div>
              <div className={`text-4xl font-bold mb-3 transition-all duration-1000 ${
                animationPhase === 'complete' ? 'text-blue-900' : 'text-gray-400'
              }`}>{result.rulesGenerated}</div>
              <div className={`text-lg font-medium transition-all duration-1000 ${
                animationPhase === 'complete' ? 'text-blue-700' : 'text-gray-500'
              }`}>AI Rules Created</div>
              <div className={`text-sm text-slate-600 mt-2 transition-all duration-1000 ${
                animationPhase === 'complete' ? 'opacity-100' : 'opacity-0'
              }`}>Intelligent automation rules</div>
            </div>
            
            <div className={`text-center p-8 rounded-2xl transition-all duration-1000 ${
              animationPhase === 'complete' ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 shadow-xl' : 'bg-gray-50'
            }`}>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-1000 ${
                animationPhase === 'complete' ? 'bg-orange-500 text-white scale-110' : 'bg-orange-100 text-orange-600'
              }`}>
                <Settings className="w-10 h-10" />
              </div>
              <div className={`text-4xl font-bold mb-3 transition-all duration-1000 ${
                animationPhase === 'complete' ? 'text-orange-900' : 'text-gray-400'
              }`}>{result.maintenanceItems}</div>
              <div className={`text-lg font-medium transition-all duration-1000 ${
                animationPhase === 'complete' ? 'text-orange-700' : 'text-gray-500'
              }`}>Smart Maintenance</div>
              <div className={`text-sm text-slate-600 mt-2 transition-all duration-1000 ${
                animationPhase === 'complete' ? 'opacity-100' : 'opacity-0'
              }`}>Scheduled maintenance tasks</div>
            </div>
            
            <div className={`text-center p-8 rounded-2xl transition-all duration-1000 ${
              animationPhase === 'complete' ? 'bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 shadow-xl' : 'bg-gray-50'
            }`}>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-1000 ${
                animationPhase === 'complete' ? 'bg-red-500 text-white scale-110' : 'bg-red-100 text-red-600'
              }`}>
                <AlertTriangle className="w-10 h-10" />
              </div>
              <div className={`text-4xl font-bold mb-3 transition-all duration-1000 ${
                animationPhase === 'complete' ? 'text-red-900' : 'text-gray-400'
              }`}>{result.safetyPrecautions}</div>
              <div className={`text-lg font-medium transition-all duration-1000 ${
                animationPhase === 'complete' ? 'text-red-700' : 'text-gray-500'
              }`}>Safety Alerts</div>
              <div className={`text-sm text-slate-600 mt-2 transition-all duration-1000 ${
                animationPhase === 'complete' ? 'opacity-100' : 'opacity-0'
              }`}>Critical safety warnings</div>
            </div>
          </div>

                        {/* Generated Content Details */}
              {animationPhase === 'complete' && (
                <div className="space-y-8 mb-8">
                  {/* AI Rules Generated */}
                  {result.generatedRules && result.generatedRules.length > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-blue-900">AI Rules Generated ({result.generatedRules.length})</h3>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {result.generatedRules.slice(0, 6).map((rule, index) => (
                          <div key={index} className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-semibold text-blue-800 text-base">{rule.name}</span>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                rule.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                                rule.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {rule.priority}
                              </span>
                            </div>
                            <p className="text-sm text-blue-600 leading-relaxed">{rule.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Maintenance Schedule */}
                  {result.maintenanceSchedule && result.maintenanceSchedule.length > 0 && (
                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-8 border border-orange-200">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
                          <Settings className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-orange-900">Maintenance Schedule ({result.maintenanceSchedule.length})</h3>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {result.maintenanceSchedule.slice(0, 6).map((item, index) => (
                          <div key={index} className="bg-white rounded-xl p-4 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-semibold text-orange-800 text-base">{item.component}</span>
                              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                                {item.frequency}
                              </span>
                            </div>
                            <p className="text-sm text-orange-600 leading-relaxed">{item.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Safety Alerts */}
                  {result.safetyAlerts && result.safetyAlerts.length > 0 && (
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-8 border border-red-200">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                          <AlertTriangle className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-red-900">Safety Alerts ({result.safetyAlerts.length})</h3>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {result.safetyAlerts.slice(0, 6).map((alert, index) => (
                          <div key={index} className="bg-white rounded-xl p-4 border border-red-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-semibold text-red-800 text-base">{alert.title}</span>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                                alert.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {alert.severity}
                              </span>
                            </div>
                            <p className="text-sm text-red-600 leading-relaxed">{alert.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

              {/* AI Features Showcase */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8 border border-purple-200">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-purple-900">Your Device is Now AI-Powered!</h3>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-base">
                  <div className="flex items-center gap-3 text-purple-800 bg-white rounded-xl p-4 border border-purple-100">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">Natural Language Chat</span>
                  </div>
                  <div className="flex items-center gap-3 text-purple-800 bg-white rounded-xl p-4 border border-purple-100">
                    <Brain className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">Intelligent Analysis</span>
                  </div>
                  <div className="flex items-center gap-3 text-purple-800 bg-white rounded-xl p-4 border border-purple-100">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">Predictive Monitoring</span>
                  </div>
                  <div className="flex items-center gap-3 text-purple-800 bg-white rounded-xl p-4 border border-purple-100">
                    <Settings className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">Smart Automation</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chat Preview */}
          {animationPhase === 'complete' && (
            <div className="bg-white rounded-2xl p-8 border border-gray-200 mb-8 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">AI Assistant Ready</h4>
                  <p className="text-base text-gray-600">Ask me anything about {result.deviceName}</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 text-base text-gray-700 border border-gray-100">
                <p className="font-medium mb-2">💬 AI Assistant Message:</p>
                <p className="leading-relaxed">
                  "Hello! I'm your AI assistant for <strong>{result.deviceName}</strong>. I can help you with setup, maintenance, troubleshooting, and technical questions. What would you like to know?"
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-6">
            <button
              onClick={onContinue}
              disabled={animationPhase !== 'complete'}
              className={`flex-1 flex items-center justify-center gap-4 px-10 py-5 rounded-xl font-bold text-xl transition-all duration-500 ${
                animationPhase === 'complete' 
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 transform hover:scale-105 shadow-xl' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <MessageSquare className="w-6 h-6" />
              {animationPhase === 'complete' ? 'Chat with AI Assistant' : 'Preparing...'}
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center gap-4 px-10 py-5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-bold text-lg"
            >
              <Trash2 className="w-6 h-6" />
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
