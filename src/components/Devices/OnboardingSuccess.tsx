import React, { useEffect, useState } from 'react';
import { 
  CheckCircle, 
  Target, 
  Wrench, 
  AlertTriangle, 
  X,
  Activity,
  Zap,
  Sparkles,
  Bot,
  Cpu,
  Brain,
  CircuitBoard,
  Database,
  MessageSquare,
  Shield,
  Eye
} from 'lucide-react';

interface OnboardingResult {
  deviceId: string;
  deviceName: string;
  rulesGenerated: number;
  maintenanceItems: number;
  safetyPrecautions: number;
  processingTime: number;
  pdfFileName: string;
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
      { icon: Cpu, delay: 0 },
      { icon: Brain, delay: 200 },
      { icon: CircuitBoard, delay: 400 },
      { icon: Database, delay: 600 },
      { icon: Bot, delay: 800 },
      { icon: Sparkles, delay: 1000 },
      { icon: Zap, delay: 1200 },
      { icon: Shield, delay: 1400 },
      { icon: Eye, delay: 1600 },
      { icon: Activity, delay: 1800 }
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
      <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-white/20">
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
                {animationPhase === 'transforming' && <Cpu className="w-12 h-12 text-blue-300" />}
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

          {/* AI Capabilities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className={`text-center p-6 rounded-2xl transition-all duration-1000 ${
              animationPhase === 'complete' ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200' : 'bg-gray-50'
            }`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-1000 ${
                animationPhase === 'complete' ? 'bg-blue-500 text-white scale-110' : 'bg-blue-100 text-blue-600'
              }`}>
                <Target className="w-8 h-8" />
              </div>
              <div className={`text-3xl font-bold mb-2 transition-all duration-1000 ${
                animationPhase === 'complete' ? 'text-blue-900' : 'text-gray-400'
              }`}>{result.rulesGenerated}</div>
              <div className={`text-sm font-medium transition-all duration-1000 ${
                animationPhase === 'complete' ? 'text-blue-700' : 'text-gray-500'
              }`}>AI Rules Created</div>
            </div>
            
            <div className={`text-center p-6 rounded-2xl transition-all duration-1000 ${
              animationPhase === 'complete' ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200' : 'bg-gray-50'
            }`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-1000 ${
                animationPhase === 'complete' ? 'bg-orange-500 text-white scale-110' : 'bg-orange-100 text-orange-600'
              }`}>
                <Wrench className="w-8 h-8" />
              </div>
              <div className={`text-3xl font-bold mb-2 transition-all duration-1000 ${
                animationPhase === 'complete' ? 'text-orange-900' : 'text-gray-400'
              }`}>{result.maintenanceItems}</div>
              <div className={`text-sm font-medium transition-all duration-1000 ${
                animationPhase === 'complete' ? 'text-orange-700' : 'text-gray-500'
              }`}>Smart Maintenance</div>
            </div>
            
            <div className={`text-center p-6 rounded-2xl transition-all duration-1000 ${
              animationPhase === 'complete' ? 'bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200' : 'bg-gray-50'
            }`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-1000 ${
                animationPhase === 'complete' ? 'bg-red-500 text-white scale-110' : 'bg-red-100 text-red-600'
              }`}>
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className={`text-3xl font-bold mb-2 transition-all duration-1000 ${
                animationPhase === 'complete' ? 'text-red-900' : 'text-gray-400'
              }`}>{result.safetyPrecautions}</div>
              <div className={`text-sm font-medium transition-all duration-1000 ${
                animationPhase === 'complete' ? 'text-red-700' : 'text-gray-500'
              }`}>Safety Alerts</div>
            </div>
          </div>

          {/* AI Features Showcase */}
          {animationPhase === 'complete' && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-200 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-purple-900">Your Device is Now AI-Powered!</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2 text-purple-800">
                  <MessageSquare className="w-4 h-4 text-purple-600" />
                  <span>Natural Language Chat</span>
                </div>
                <div className="flex items-center gap-2 text-purple-800">
                  <Brain className="w-4 h-4 text-purple-600" />
                  <span>Intelligent Analysis</span>
                </div>
                <div className="flex items-center gap-2 text-purple-800">
                  <Activity className="w-4 h-4 text-purple-600" />
                  <span>Predictive Monitoring</span>
                </div>
                <div className="flex items-center gap-2 text-purple-800">
                  <Zap className="w-4 h-4 text-purple-600" />
                  <span>Smart Automation</span>
                </div>
              </div>
            </div>
          )}

          {/* Chat Preview */}
          {animationPhase === 'complete' && (
            <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-8 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">AI Assistant Ready</h4>
                  <p className="text-sm text-gray-600">Ask me anything about {result.deviceName}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                "Hello! I'm your AI assistant for {result.deviceName}. I can help you with setup, maintenance, troubleshooting, and technical questions. What would you like to know?"
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onContinue}
              disabled={animationPhase !== 'complete'}
              className={`flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-500 ${
                animationPhase === 'complete' 
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 transform hover:scale-105 shadow-lg' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              {animationPhase === 'complete' ? 'Chat with AI Assistant' : 'Preparing...'}
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center gap-3 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
            >
              <X className="w-5 h-5" />
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
