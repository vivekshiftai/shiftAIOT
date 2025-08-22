import React, { useEffect, useState } from 'react';

interface StepDetails {
  currentStep: number;
  totalSteps: number;
  stepName: string;
}

interface EnhancedOnboardingLoaderProps {
  isProcessing: boolean;
  currentProcess: 'pdf' | 'rules' | 'knowledgebase';
  progress: number;
  onComplete: () => void;
  pdfFileName?: string;
  currentSubStage?: string;
  stepDetails?: StepDetails;
}

const EnhancedOnboardingLoader: React.FC<EnhancedOnboardingLoaderProps> = ({
  isProcessing,
  currentProcess,
  progress,
  onComplete,
  pdfFileName,
  currentSubStage,
  stepDetails
}) => {

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
  const steps = ['pdf', 'rules', 'knowledgebase'];
  const currentStepIndex = steps.indexOf(currentProcess);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-white overflow-hidden">

      {/* Main Content Container */}
      <div className="flex flex-col items-center justify-center space-y-8 px-6 max-w-md w-full">
        
        {/* Morphing Green Streak Animation */}
        <div className="relative w-full h-1 mb-4">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#20C997] to-transparent rounded-full animate-pulse opacity-30"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#20C997] to-transparent rounded-full animate-ping opacity-20" style={{ animationDelay: '0.5s' }}></div>
        </div>

        {/* Detailed Step Progress */}
        {stepDetails && (
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-sm font-medium text-gray-600">Step</span>
              <span className="text-lg font-bold text-[#20C997]">{stepDetails.currentStep}</span>
              <span className="text-sm text-gray-400">of</span>
              <span className="text-lg font-bold text-gray-800">{stepDetails.totalSteps}</span>
            </div>
            <div className="text-sm font-semibold text-gray-800">{stepDetails.stepName}</div>
          </div>
        )}

        {/* Step Indicators */}
        <div className="flex items-center justify-center space-x-6">
          {steps.map((step, index) => (
            <div key={step} className="relative flex flex-col items-center">
              {/* Step Circle */}
              <div 
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                  currentStepIndex === index 
                    ? 'border-[#20C997] bg-[#D0F5E3] shadow-lg shadow-[#20C997]/20 scale-110' 
                    : index < currentStepIndex
                    ? 'border-[#20C997] bg-[#D0F5E3]'
                    : 'border-gray-200 bg-[#F6FFF7]'
                }`}
                
              >
                {currentStepIndex === index ? (
                  <div className="relative">
                    {/* Pulsing animation for current step */}
                    <div className="absolute inset-0 rounded-full bg-[#20C997] animate-ping opacity-30"></div>
                    <div className="relative z-10 text-lg">{stepInfo.icon}</div>
                  </div>
                ) : index < currentStepIndex ? (
                  <div className="text-[#20C997] text-lg">✓</div>
                ) : (
                  <div className="text-gray-400 text-lg">
                    {step === 'pdf' ? '📄' : step === 'rules' ? '⚡' : '🧠'}
                  </div>
                )}
              </div>
              
              {/* Connecting Lines */}
              {index < steps.length - 1 && (
                <div className={`absolute top-6 left-12 w-6 h-0.5 transition-all duration-500 ${
                  index < currentStepIndex
                    ? 'bg-[#20C997]'
                    : 'bg-gray-200'
                }`}></div>
              )}
            </div>
          ))}
        </div>

        {/* Current Step Description */}
        <div className="text-center space-y-3">
          <h3 className="text-xl font-semibold text-gray-800">{stepInfo.title}</h3>
          <p className="text-gray-600 text-sm leading-relaxed max-w-xs">{stepInfo.description}</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="relative h-1.5 bg-[#F6FFF7] rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#20C997] to-[#20C997]/80 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-40 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* File Info */}
        {pdfFileName && (
          <div className="flex items-center space-x-3 px-4 py-2 bg-[#D0F5E3] rounded-lg border border-[#20C997]/20">
            <div className="w-6 h-6 bg-[#20C997] rounded-lg flex items-center justify-center">
              <span className="text-white text-xs">📄</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">{pdfFileName}</p>
              <p className="text-xs text-gray-500">Processing...</p>
            </div>
          </div>
        )}

        {/* Current Sub-stage */}
        {currentSubStage && (
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-[#D0F5E3] rounded-full">
              <div className="w-1.5 h-1.5 bg-[#20C997] rounded-full animate-pulse"></div>
              <span className="text-xs text-[#20C997] font-medium">{currentSubStage}</span>
            </div>
          </div>
        )}

        {/* Floating Animation Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Floating circles */}
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 bg-[#20C997] rounded-full opacity-20 animate-bounce"
              style={{
                left: `${25 + i * 20}%`,
                top: `${20 + (i % 2) * 60}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${2 + i * 0.3}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Custom CSS animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes morph {
            0%, 100% { transform: scaleX(1) rotate(0deg); }
            50% { transform: scaleX(1.1) rotate(180deg); }
          }
          
          .animate-morph {
            animation: morph 4s ease-in-out infinite;
          }
        `
      }} />
    </div>
  );
};

export default EnhancedOnboardingLoader;
