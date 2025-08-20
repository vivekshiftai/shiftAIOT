import React, { useEffect, useState } from 'react';

interface EnhancedOnboardingLoaderProps {
  isProcessing: boolean;
  currentProcess: 'pdf' | 'rules' | 'knowledgebase';
  progress: number;
  onComplete: () => void;
  pdfFileName?: string;
  currentSubStage?: string;
}

const EnhancedOnboardingLoader: React.FC<EnhancedOnboardingLoaderProps> = ({
  isProcessing,
  currentProcess,
  progress,
  onComplete,
  pdfFileName,
  currentSubStage
}) => {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    if (isProcessing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.body.style.cursor = 'none';
    } else {
      document.body.style.cursor = 'default';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.body.style.cursor = 'default';
    };
  }, [isProcessing]);

  const getStepInfo = () => {
    switch (currentProcess) {
      case 'pdf':
        return {
          icon: '📄',
          title: 'Processing PDF',
          description: 'Analyzing device documentation and extracting key information'
        };
      case 'rules':
        return {
          icon: '⚡',
          title: 'Generating Rules',
          description: 'Creating intelligent monitoring and alerting rules'
        };
      case 'knowledgebase':
        return {
          icon: '🧠',
          title: 'Building Knowledge',
          description: 'Integrating device data into AI knowledge base'
        };
      default:
        return {
          icon: '🔄',
          title: 'Processing',
          description: 'Setting up your device'
        };
    }
  };

  const stepInfo = getStepInfo();

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-white overflow-hidden">
      {/* Custom Cursor */}
      {isProcessing && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: cursorPosition.x - 20,
            top: cursorPosition.y - 20,
          }}
        >
          <div className="relative">
            {/* Outer ring */}
            <div className="absolute w-10 h-10 border-2 border-green-500 rounded-full animate-pulse opacity-60"></div>
            {/* Inner ring */}
            <div className="absolute w-6 h-6 border-2 border-green-400 rounded-full animate-ping opacity-80" style={{ left: '8px', top: '8px' }}></div>
            {/* Center dot */}
            <div className="absolute w-2 h-2 bg-green-600 rounded-full" style={{ left: '18px', top: '18px' }}></div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col items-center space-y-8 px-6">
        
        {/* Animated Step Indicator */}
        <div className="relative">
          {/* Background circles */}
          <div className="flex items-center space-x-4">
            {['pdf', 'rules', 'knowledgebase'].map((step, index) => (
              <div key={step} className="relative">
                <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                  currentProcess === step 
                    ? 'border-green-500 bg-green-50 shadow-lg shadow-green-200' 
                    : index < ['pdf', 'rules', 'knowledgebase'].indexOf(currentProcess)
                    ? 'border-green-400 bg-green-100'
                    : 'border-gray-200 bg-gray-50'
                }`}>
                  {currentProcess === step ? (
                    <div className="relative">
                      {/* Pulsing animation for current step */}
                      <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-30"></div>
                      <div className="relative z-10 text-2xl">{stepInfo.icon}</div>
                    </div>
                  ) : index < ['pdf', 'rules', 'knowledgebase'].indexOf(currentProcess) ? (
                    <div className="text-green-600 text-xl">✓</div>
                  ) : (
                    <div className="text-gray-400 text-xl">
                      {step === 'pdf' ? '📄' : step === 'rules' ? '⚡' : '🧠'}
                    </div>
                  )}
                </div>
                
                {/* Connecting lines */}
                {index < 2 && (
                  <div className={`absolute top-8 left-16 w-4 h-0.5 transition-all duration-500 ${
                    index < ['pdf', 'rules', 'knowledgebase'].indexOf(currentProcess)
                      ? 'bg-green-400'
                      : 'bg-gray-200'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Info */}
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-semibold text-gray-800">{stepInfo.title}</h3>
          <p className="text-gray-600 max-w-md leading-relaxed">{stepInfo.description}</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md space-y-3">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            >
              {/* Animated shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* File Info */}
        {pdfFileName && (
          <div className="flex items-center space-x-3 px-4 py-3 bg-green-50 rounded-lg border border-green-200">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">📄</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{pdfFileName}</p>
              <p className="text-xs text-gray-500">Processing...</p>
            </div>
          </div>
        )}

        {/* Current Sub-stage */}
        {currentSubStage && (
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-100 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-700 font-medium">{currentSubStage}</span>
            </div>
          </div>
        )}

        {/* Floating Animation Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Floating circles */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-green-300 rounded-full opacity-30 animate-bounce"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 2) * 40}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${2 + i * 0.5}s`
              }}
            ></div>
          ))}
          
          {/* Morphing streak */}
          <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent rounded-full animate-pulse opacity-20"></div>
        </div>
      </div>

      {/* Custom CSS animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes morph {
            0%, 100% { transform: scaleX(1) rotate(0deg); }
            50% { transform: scaleX(1.2) rotate(180deg); }
          }
          
          .animate-morph {
            animation: morph 3s ease-in-out infinite;
          }
        `
      }} />
    </div>
  );
};

export default EnhancedOnboardingLoader;
