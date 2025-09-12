import React, { useState, useEffect } from 'react';
import { UnifiedOnboardingProgress } from '../../services/unifiedOnboardingService';

interface SSEEventDisplayProps {
  sseProgress: UnifiedOnboardingProgress | null;
  isProcessing: boolean;
}

export const SSEEventDisplay: React.FC<SSEEventDisplayProps> = ({ sseProgress, isProcessing }) => {
  const [events, setEvents] = useState<UnifiedOnboardingProgress[]>([]);
  const [currentStep, setCurrentStep] = useState<UnifiedOnboardingProgress | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');

  console.log('📱 SSEEventDisplay: Component rendered', {
    sseProgress,
    isProcessing,
    eventsCount: events.length,
    currentStep
  });

  useEffect(() => {
    if (sseProgress) {
      console.log('📱 SSEEventDisplay: Received SSE progress update', {
        sseProgress,
        sseProgressStringified: JSON.stringify(sseProgress, null, 2),
        currentEventsCount: events.length,
        isProcessing,
        stage: sseProgress.stage,
        progress: sseProgress.progress,
        message: sseProgress.message,
        subMessage: sseProgress.subMessage,
        stepDetails: sseProgress.stepDetails
      });
      
      // Update connection status
      setConnectionStatus('connected');
      
      setEvents(prev => {
        const newEvents = [...prev, sseProgress];
        console.log('📱 SSEEventDisplay: Updated events array', {
          previousCount: prev.length,
          newCount: newEvents.length,
          latestEvent: sseProgress,
          allEvents: newEvents
        });
        return newEvents;
      });

      // Update current step
      setCurrentStep(sseProgress);
      console.log('📱 SSEEventDisplay: Updated current step', {
        stage: sseProgress.stage,
        progress: sseProgress.progress,
        stepName: sseProgress.stepDetails?.stepName,
        currentStep: sseProgress.stepDetails?.currentStep,
        totalSteps: sseProgress.stepDetails?.totalSteps
      });
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

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
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
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Device Onboarding</h2>
        <p className="text-gray-600">Setting up your device with intelligent monitoring</p>
        <div className="mt-4 flex justify-center">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
              connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
            }`}></div>
            <span className="text-sm text-gray-600">
              {connectionStatus === 'connected' ? 'SSE Connected' : 
               connectionStatus === 'connecting' ? 'Connecting...' : 
               connectionStatus === 'error' ? 'Connection Error' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Current Step Display */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="text-4xl">{stageInfo.icon}</div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{stageInfo.title}</h3>
              <p className="text-gray-600">{stageInfo.description}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
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
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div
            className={`h-3 rounded-full bg-gradient-to-r transition-all duration-500 ease-out ${getProgressColor(currentStep?.progress || 0)}`}
            style={{ width: `${currentStep?.progress || 0}%` }}
          ></div>
        </div>

        {/* Current Message */}
        {currentStep?.message && (
          <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
            <p className="text-gray-800 font-medium">{currentStep.message}</p>
            {currentStep.subMessage && (
              <p className="text-gray-600 text-sm mt-1">{currentStep.subMessage}</p>
            )}
          </div>
        )}

        {/* Status Badge */}
        {currentStep?.stepDetails?.status && (
          <div className="mt-4 flex justify-center">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentStep.stepDetails.status)}`}>
              {currentStep.stepDetails.status.charAt(0).toUpperCase() + currentStep.stepDetails.status.slice(1)}
            </span>
          </div>
        )}
      </div>

      {/* Step Progress Timeline */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Onboarding Steps</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* Debug Info and Test Controls */}
      <div className="mt-8 bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-sm font-medium text-gray-700">Debug Info</h4>
          <button
            onClick={() => {
              // Simulate the SSE data flow from the logs
              const testSteps = [
                { stage: 'device', progress: 10, message: 'Creating device configuration...', subMessage: 'Setting up device in the system', currentStep: 1, totalSteps: 6, stepName: 'Device Creation' },
                { stage: 'device', progress: 20, message: 'Device created successfully', subMessage: 'Device configuration saved to database', currentStep: 1, totalSteps: 6, stepName: 'Device Creation' },
                { stage: 'assignment', progress: 30, message: 'Assigning device to user', subMessage: 'Setting up user responsibility', currentStep: 2, totalSteps: 6, stepName: 'User Assignment' },
                { stage: 'assignment', progress: 40, message: 'Device assigned successfully', subMessage: 'Assignment verified', currentStep: 2, totalSteps: 6, stepName: 'User Assignment' },
                { stage: 'upload', progress: 50, message: 'Uploading PDF to AI service', subMessage: 'Document chunking for downstream processing', currentStep: 3, totalSteps: 6, stepName: 'PDF Upload' },
                { stage: 'upload', progress: 60, message: 'PDF uploaded successfully', subMessage: 'Data available for intelligence analysis', currentStep: 3, totalSteps: 6, stepName: 'PDF Upload' },
                { stage: 'rules', progress: 70, message: 'Generating intelligent rules', subMessage: 'Device specs analyzed, automation rules extracted', currentStep: 4, totalSteps: 6, stepName: 'Rules Generation' },
                { stage: 'rules', progress: 80, message: 'Rules generated successfully', subMessage: 'Count and success of rules stored', currentStep: 4, totalSteps: 6, stepName: 'Rules Generation' },
                { stage: 'maintenance', progress: 85, message: 'Creating maintenance schedule', subMessage: 'Maintenance tasks and frequency derived from PDF chunks', currentStep: 5, totalSteps: 6, stepName: 'Maintenance Schedule' },
                { stage: 'maintenance', progress: 90, message: 'Maintenance schedule created', subMessage: 'DB storage and task assignment validated', currentStep: 5, totalSteps: 6, stepName: 'Maintenance Schedule' },
                { stage: 'safety', progress: 95, message: 'Extracting safety procedures', subMessage: 'Analyzing for safety protocols', currentStep: 6, totalSteps: 6, stepName: 'Safety Procedures' },
                { stage: 'safety', progress: 98, message: 'Safety procedures configured', subMessage: 'Protocols finalized in database', currentStep: 6, totalSteps: 6, stepName: 'Safety Procedures' },
                { stage: 'complete', progress: 100, message: 'Onboarding completed successfully', subMessage: 'Device successfully onboarded with all configurations and ready for use', currentStep: 6, totalSteps: 6, stepName: 'Completion' }
              ];

              let stepIndex = 0;
              const interval = setInterval(() => {
                if (stepIndex < testSteps.length) {
                  const step = testSteps[stepIndex];
                  const mockProgress: UnifiedOnboardingProgress = {
                    stage: step.stage as any,
                    progress: step.progress,
                    message: step.message,
                    subMessage: step.subMessage,
                    stepDetails: {
                      currentStep: step.currentStep,
                      totalSteps: step.totalSteps,
                      stepName: step.stepName,
                      status: step.progress === 100 ? 'completed' : 'processing',
                      startTime: Date.now()
                    },
                    timestamp: new Date().toISOString()
                  };
                  
                  // Simulate the SSE progress update
                  setCurrentStep(mockProgress);
                  setEvents(prev => [...prev, mockProgress]);
                  
                  stepIndex++;
                } else {
                  clearInterval(interval);
                }
              }, 2000); // 2 seconds between steps
            }}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
          >
            Test SSE Flow
          </button>
        </div>
        
        <div className="text-xs text-gray-600 space-y-1">
          <div><strong>Events Received:</strong> {events.length}</div>
          <div><strong>Current Stage:</strong> {currentStep?.stage || 'None'}</div>
          <div><strong>Progress:</strong> {currentStep?.progress || 0}%</div>
          <div><strong>Status:</strong> {currentStep?.stepDetails?.status || 'Unknown'}</div>
          <div><strong>Step:</strong> {currentStep?.stepDetails?.currentStep || 0}/{currentStep?.stepDetails?.totalSteps || 0}</div>
        </div>
      </div>
    </div>
  );
};

export default SSEEventDisplay;