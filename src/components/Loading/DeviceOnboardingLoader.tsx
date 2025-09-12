import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, FileText, Cpu, CheckCircle2 } from 'lucide-react';
import { ONBOARDING_STEPS, getStepStatus, getStepCardStyle, OnboardingStep } from '../../utils/onboardingSteps.tsx';

interface DeviceOnboardingLoaderProps {
  isProcessing: boolean;
  currentStep: string;
  deviceName: string;
  pdfFileName: string;
  progress?: number;
  message?: string;
  onComplete?: () => void;
  // SSE Progress tracking
  sseProgress?: {
    stage: string;
    progress: number;
    message: string;
    subMessage?: string;
    stepDetails?: {
      currentStep: number;
      totalSteps: number;
      stepName: string;
      status?: string;
    };
    error?: string;
  } | null;
}

export const DeviceOnboardingLoader: React.FC<DeviceOnboardingLoaderProps> = ({
  isProcessing,
  currentStep,
  deviceName,
  pdfFileName,
  progress = 0,
  message = '',
  onComplete,
  sseProgress
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [realTimeProgress, setRealTimeProgress] = useState<number>(progress);
  const [realTimeMessage, setRealTimeMessage] = useState<string>(message);

  useEffect(() => {
    const stepIndex = ONBOARDING_STEPS.findIndex(step => step.id === currentStep);
    if (stepIndex !== -1) {
      setCurrentStepIndex(stepIndex);
    }
  }, [currentStep]);

  useEffect(() => {
    // Mark previous steps as completed
    const completed = ONBOARDING_STEPS
      .slice(0, currentStepIndex)
      .map(step => step.id);
    setCompletedSteps(completed);
  }, [currentStepIndex]);

  /**
   * Handle SSE progress updates in real-time
   * Updates the loading screen with live progress data from the backend
   */
  useEffect(() => {
    if (sseProgress) {
      console.log('📊 Loader: SSE Progress Update received', {
        stage: sseProgress.stage,
        progress: sseProgress.progress,
        message: sseProgress.message,
        subMessage: sseProgress.subMessage,
        error: sseProgress.error,
        stepDetails: sseProgress.stepDetails
      });
      
      // Update real-time progress and message from SSE stream
      setRealTimeProgress(sseProgress.progress);
      setRealTimeMessage(sseProgress.message);
      
      // Map backend stage to frontend step and update current step
      if (sseProgress.stage && sseProgress.stage !== currentStep) {
        const mappedStep = mapBackendStageToStep(sseProgress.stage);
        console.log('📊 Loader: Mapping backend stage to frontend step', {
          backendStage: sseProgress.stage,
          mappedStep: mappedStep,
          currentStep: currentStep
        });
        
        if (mappedStep !== currentStep) {
          // Update current step based on SSE progress
          const stepIndex = ONBOARDING_STEPS.findIndex(step => step.id === mappedStep);
          if (stepIndex !== -1) {
            console.log('📊 Loader: Updating step index', {
              from: currentStepIndex,
              to: stepIndex,
              stepName: ONBOARDING_STEPS[stepIndex]?.title
            });
            setCurrentStepIndex(stepIndex);
          }
        }
      }
      
      // Handle completion - trigger onComplete callback when onboarding finishes
      if (sseProgress.stage === 'complete' && onComplete) {
        console.log('📊 Loader: Onboarding completed via SSE - triggering onComplete');
        // Show success message before completing
        setRealTimeMessage('✅ Onboarding completed successfully! Device is ready for use.');
        setRealTimeProgress(100);
        
        // Wait a moment to show the success message, then complete
        setTimeout(() => {
          console.log('📊 Loader: Calling onComplete callback after 2 second delay');
          onComplete();
        }, 2000); // 2 second delay to show success message
      }
      
      // Handle errors - display error message to user
      if (sseProgress.error) {
        console.error('❌ SSE Error:', sseProgress.error);
        setRealTimeMessage(`Error: ${sseProgress.error}`);
      }
    }
  }, [sseProgress, currentStep, onComplete]);

  /**
   * Maps backend stage names to frontend step IDs
   * This ensures consistency between backend SSE events and frontend UI steps
   */
  const mapBackendStageToStep = (stage: string): string => {
    switch (stage) {
      case 'device':
        return 'device_creation';
      case 'assignment':
        return 'user_assignment';
      case 'upload':
        return 'pdf_upload';
      case 'rules':
        return 'rules_generation';
      case 'maintenance':
        return 'maintenance_schedule';
      case 'safety':
        return 'safety_procedures';
      case 'complete':
        return 'safety_procedures'; // Complete stage shows the final step
      default:
        return 'device_creation';
    }
  };

  const getStepIcon = (step: OnboardingStep, status: string) => {
    if (status === 'completed') {
      return <CheckCircle className="w-6 h-6 text-green-600" />;
    } else if (status === 'current') {
      return (
        <div className="relative">
          <div className={`w-6 h-6 ${step.color}`}>
            {step.icon}
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full animate-pulse"></div>
        </div>
      );
    } else {
      return <div className={`w-6 h-6 ${step.color} opacity-50`}>{step.icon}</div>;
    }
  };

  // getStepCardStyle is now imported from shared utility

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">AI Device Onboarding</h2>
              <p className="text-pink-100">Setting up {deviceName} with intelligent AI capabilities</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            {ONBOARDING_STEPS.map((step) => {
              const status = getStepStatus(step.id, currentStep, completedSteps);
              const isCurrent = status === 'current';
              
              return (
                <div
                  key={step.id}
                  className={`p-4 rounded-xl border transition-all duration-300 ${getStepCardStyle(step, status)}`}
                >
                  {/* Step Header */}
                  <div className="flex items-center gap-3 mb-3">
                    {getStepIcon(step, status)}
                    <div className="flex-1">
                      <h3 className={`font-semibold ${status === 'completed' ? 'text-green-700' : status === 'current' ? step.color : 'text-gray-500'}`}>
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                  </div>

                  {/* Current Step Details */}
                  {isCurrent && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-pink-600">
                        <Clock className="w-4 h-4 animate-pulse" />
                        <span>Processing...</span>
                      </div>
                      <div className="space-y-1">
                        {step.details.map((detail, detailIndex) => (
                          <div key={detailIndex} className="flex items-center gap-2 text-xs text-gray-600">
                            <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse"></div>
                            <span>{detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Completed Step */}
                  {status === 'completed' && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>Completed</span>
                    </div>
                  )}

                  {/* Pending Step */}
                  {status === 'pending' && (
                    <div className="text-sm text-gray-400">
                      Pending...
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Current Step Progress */}
          {isProcessing && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {sseProgress?.stage === 'complete' ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>Onboarding Complete!</span>
                    </div>
                  ) : (
                    `Current Step: ${ONBOARDING_STEPS[currentStepIndex]?.title}`
                  )}
                </span>
                <span className={`text-sm ${sseProgress?.stage === 'complete' ? 'text-green-600 font-semibold' : 'text-gray-500'}`}>
                  {realTimeProgress}% Complete
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ease-out ${
                    sseProgress?.stage === 'complete' 
                      ? 'bg-gradient-to-r from-green-500 to-green-600' 
                      : 'bg-gradient-to-r from-pink-500 to-purple-600'
                  }`}
                  style={{ width: `${realTimeProgress}%` }}
                />
              </div>
              <p className={`text-xs mt-2 ${sseProgress?.stage === 'complete' ? 'text-green-600 font-semibold' : 'text-gray-500'}`}>
                {realTimeMessage || message || `Processing ${pdfFileName} for ${deviceName}...`}
              </p>
              {sseProgress?.subMessage && (
                <p className="text-xs text-gray-400 mt-1">
                  {sseProgress.subMessage}
                </p>
              )}
              {sseProgress?.stepDetails && (
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                  <span>Step {sseProgress.stepDetails.currentStep} of {sseProgress.stepDetails.totalSteps}</span>
                  <span>•</span>
                  <span>{sseProgress.stepDetails.stepName}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText className="w-4 h-4" />
              <span>{pdfFileName}</span>
            </div>
            <div className="text-sm text-gray-500">
              This process ensures your device is fully configured with AI capabilities
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceOnboardingLoader;
