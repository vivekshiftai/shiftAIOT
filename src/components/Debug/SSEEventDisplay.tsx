import React, { useState, useEffect } from 'react';
import { UnifiedOnboardingProgress } from '../../services/unifiedOnboardingService';

interface SSEEventDisplayProps {
  sseProgress: UnifiedOnboardingProgress | null;
  isProcessing: boolean;
}

export const SSEEventDisplay: React.FC<SSEEventDisplayProps> = ({ sseProgress, isProcessing }) => {
  const [currentStep, setCurrentStep] = useState<UnifiedOnboardingProgress | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');


  useEffect(() => {
    if (sseProgress) {
      // Update connection status
      setConnectionStatus('connected');
      
      // Update current step
      setCurrentStep(sseProgress);

    } else if (isProcessing) {
      setConnectionStatus('connecting');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [sseProgress, isProcessing]);

  const getStageInfo = (stage: string) => {
    switch (stage) {
      case 'device':
        return {
          title: 'Device Creation',
          description: 'Setting up device configuration',
          icon: '🔧',
          color: 'blue'
        };
      case 'assignment':
        return {
          title: 'User Assignment',
          description: 'Assigning device to responsible user',
          icon: '👤',
          color: 'indigo'
        };
      case 'upload':
        return {
          title: 'PDF Upload',
          description: 'Uploading device documentation',
          icon: '📄',
          color: 'purple'
        };
      case 'rules':
        return {
          title: 'Rules Generation',
          description: 'Creating intelligent monitoring rules',
          icon: '⚡',
          color: 'yellow'
        };
      case 'maintenance':
        return {
          title: 'Maintenance Schedule',
          description: 'Generating preventive maintenance plans',
          icon: '🔧',
          color: 'orange'
        };
      case 'safety':
        return {
          title: 'Safety Procedures',
          description: 'Extracting safety guidelines',
          icon: '🛡️',
          color: 'red'
        };
      case 'complete':
        return {
          title: 'Onboarding Complete',
          description: 'Device successfully onboarded',
          icon: '✅',
          color: 'green'
        };
      default:
        return {
          title: 'Processing',
          description: 'Setting up your device',
          icon: '⏳',
          color: 'gray'
        };
    }
  };


  const getProgressColor = (progress: number) => {
    if (progress < 30) return 'from-red-400 to-red-600';
    if (progress < 60) return 'from-yellow-400 to-yellow-600';
    if (progress < 90) return 'from-blue-400 to-blue-600';
    return 'from-green-400 to-green-600';
  };

  const stageInfo = currentStep ? getStageInfo(currentStep.stage) : getStageInfo('processing');

  return (
    <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Device Onboarding</h2>
            <p className="text-pink-100 text-sm">Setting up your device with intelligent monitoring</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' : 
              connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 
              connectionStatus === 'error' ? 'bg-red-400' : 'bg-gray-400'
            }`}></div>
          </div>
        </div>
      </div>


      {/* Content Area */}
      <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
        {/* Completion Status Section */}
        {currentStep?.stage === 'complete' ? (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-8 mb-8 border border-green-200">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-3xl text-white">✅</span>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Onboarding Complete</h3>
                <p className="text-gray-600">Device successfully onboarded with all configurations and ready for use</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">100%</div>
                <div className="text-sm text-gray-500">Step 6 of 6</div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
              <div className="h-4 rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500 ease-out" style={{ width: '100%' }}></div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">✅</span>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Onboarding completed successfully</h4>
                <p className="text-gray-600">Device successfully onboarded with all configurations and ready for use</p>
              </div>
              <div className="ml-auto">
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Completed</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 mb-8 border border-blue-200">
            <div className="flex items-center gap-6 mb-6">
              <div className="text-5xl">{stageInfo.icon}</div>
              <div className="flex-1">
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">{stageInfo.title}</h3>
                <p className="text-gray-600">{stageInfo.description}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">
                  {currentStep?.progress || 0}%
                </div>
                <div className="text-sm text-gray-500">
                  {currentStep?.stepDetails ? 
                    `Step ${currentStep.stepDetails.currentStep} of ${currentStep.stepDetails.totalSteps}` : 
                    'Initializing...'
                  }
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
              <div
                className={`h-4 rounded-full bg-gradient-to-r transition-all duration-500 ease-out ${getProgressColor(currentStep?.progress || 0)}`}
                style={{ width: `${currentStep?.progress || 0}%` }}
              ></div>
            </div>

            {/* Current Message */}
            {currentStep?.message && (
              <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500 mb-4">
                <p className="text-gray-800 font-medium">{currentStep.message}</p>
                {currentStep.subMessage && (
                  <p className="text-gray-600 text-sm mt-1">{currentStep.subMessage}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Onboarding Steps Section */}
        <div className="space-y-6">
          <h4 className="text-xl font-semibold text-gray-900">Onboarding Steps</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {[
              { stage: 'device', title: 'Device Creation', icon: '🔧' },
              { stage: 'assignment', title: 'User Assignment', icon: '👤' },
              { stage: 'upload', title: 'PDF Upload', icon: '📄' },
              { stage: 'rules', title: 'Rules Generation', icon: '⚡' },
              { stage: 'maintenance', title: 'Maintenance Schedule', icon: '🔧' },
              { stage: 'safety', title: 'Safety Procedures', icon: '🛡️' }
            ].map((step) => {
              const isActive = currentStep?.stage === step.stage;
              const isCompleted = currentStep?.stage && 
                ['device', 'assignment', 'upload', 'rules', 'maintenance', 'safety', 'complete'].indexOf(currentStep.stage) > 
                ['device', 'assignment', 'upload', 'rules', 'maintenance', 'safety'].indexOf(step.stage);
              
              return (
                <div
                  key={step.stage}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                    isActive 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : isCompleted 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`text-2xl ${isActive ? 'animate-pulse' : ''}`}>
                      {isCompleted ? '✅' : step.icon}
                    </div>
                    <div>
                      <h5 className={`font-medium ${isActive ? 'text-blue-900' : isCompleted ? 'text-green-900' : 'text-gray-700'}`}>
                        {step.title}
                      </h5>
                      <p className={`text-sm ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                        {isActive ? 'In Progress' : isCompleted ? 'Completed' : 'Pending'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
};

export default SSEEventDisplay;