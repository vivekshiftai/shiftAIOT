import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock } from 'lucide-react'; // Added lucide-react for icons

interface StepDetails {
  currentStep: number;
  totalSteps: number;
  stepName: string;
}

interface AILoadingScreenProps {
  isProcessing: boolean;
  currentProcess: 'pdf' | 'rules' | 'knowledgebase';
  progress: number;
  onComplete: () => void;
  pdfFileName?: string;
  currentSubStage?: string;
  stepDetails?: StepDetails;
}

const AILoadingScreen: React.FC<AILoadingScreenProps> = ({
  isProcessing,
  currentProcess,
  progress,
  onComplete,
  pdfFileName,
  currentSubStage,
  stepDetails
}) => {
  // Debug logging
  console.log('AILoadingScreen render:', {
    isProcessing,
    currentProcess,
    progress,
    currentSubStage,
    stepDetails
  });

  const getStepInfo = () => {
    switch (currentProcess) {
      case 'pdf':
        return {
          icon: '📄',
          title: 'Processing Device Documentation',
          description: 'Analyzing your device manual and extracting key technical information',
          details: [
            'Reading PDF content and structure',
            'Extracting device specifications',
            'Identifying technical parameters',
            'Preparing data for AI analysis'
          ]
        };
      case 'rules':
        return {
          icon: '⚡',
          title: 'Generating AI Rules & Maintenance',
          description: 'Creating intelligent monitoring rules and maintenance schedules based on your device',
          details: [
            'Analyzing device specifications',
            'Generating monitoring rules',
            'Creating maintenance schedules',
            'Setting up alert thresholds'
          ]
        };
      case 'knowledgebase':
        return {
          icon: '🧠',
          title: 'Building AI Knowledge Base',
          description: 'Integrating device information into our AI system for intelligent assistance',
          details: [
            'Processing device data',
            'Creating knowledge base entries',
            'Setting up AI chat capabilities',
            'Finalizing device configuration'
          ]
        };
      default:
        return {
          icon: '🔄',
          title: 'Processing',
          description: 'Setting up your device',
          details: ['Initializing...']
        };
    }
  };

  const stepInfo = getStepInfo();
  const steps = ['pdf', 'rules', 'knowledgebase'];
  const currentStepIndex = steps.indexOf(currentProcess);

  // Calculate progress percentage for current stage
  const getStageProgress = () => {
    const baseProgress = currentStepIndex * 33.33;
    const stageProgress = (progress / 100) * 33.33;
    return Math.min(baseProgress + stageProgress, 100);
  };

  const overallProgress = getStageProgress();

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">

      {/* Main Content Container */}
      <div className="flex flex-col items-center justify-center space-y-8 px-6 max-w-2xl w-full">
        
        {/* Overall Progress Header */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">AI Device Onboarding</h2>
          <p className="text-gray-600">Setting up your device with intelligent AI capabilities</p>
        </div>

        {/* Overall Progress Bar */}
        <div className="w-full space-y-3">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Overall Progress</span>
            <span>{Math.round(overallProgress)}%</span>
          </div>
          <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${overallProgress}%` }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-40 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Current Stage Progress */}
        <div className="w-full space-y-3">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Current Stage</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-40 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Current Stage Info */}
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
              <span className="text-2xl">{stepInfo.icon}</span>
            </div>
            {/* Pulsing ring animation */}
            <div className="absolute inset-0 w-20 h-20 bg-blue-400 rounded-full animate-ping opacity-30"></div>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{stepInfo.title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{stepInfo.description}</p>
          </div>
        </div>

        {/* Current Stage Details */}
        <div className="w-full space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 text-center">Current Operations:</h4>
          <div className="grid grid-cols-1 gap-2">
            {stepInfo.details.map((detail, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className={`w-2 h-2 rounded-full ${
                  index < Math.floor(progress / 25) ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
                <span className="text-sm text-gray-700">{detail}</span>
                {index < Math.floor(progress / 25) && (
                  <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* File Info */}
        {pdfFileName && (
          <div className="flex items-center space-x-3 px-4 py-3 bg-blue-100 rounded-lg border border-blue-200">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">📄</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{pdfFileName}</p>
              <p className="text-xs text-gray-500">Processing with AI...</p>
            </div>
          </div>
        )}

        {/* Current Sub-stage */}
        {currentSubStage && (
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-100 rounded-full">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-blue-600 font-medium">{currentSubStage}</span>
            </div>
          </div>
        )}

        {/* Estimated Time */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Estimated time remaining: {Math.max(1, Math.ceil((100 - overallProgress) / 10))} minutes</span>
          </div>
          <p className="text-xs text-gray-400">This process ensures your device is fully configured with AI capabilities</p>
        </div>

        {/* Floating Animation Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Floating circles */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-blue-500 rounded-full opacity-20 animate-bounce"
              style={{
                left: `${15 + i * 15}%`,
                top: `${10 + (i % 3) * 30}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: `${2 + i * 0.2}s`
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

export default AILoadingScreen;
