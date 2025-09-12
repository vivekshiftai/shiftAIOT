import React, { useState, useEffect } from 'react';
import { ONBOARDING_STEPS } from '../../utils/onboardingSteps.tsx';
import { SSEEventDisplay } from '../Debug/SSEEventDisplay';
import { UnifiedOnboardingProgress } from '../../services/unifiedOnboardingService';

interface DeviceOnboardingLoaderProps {
  isProcessing: boolean;
  currentStep: string;
  deviceName: string;
  pdfFileName: string;
  progress?: number;
  message?: string;
  onComplete?: () => void;
  // SSE Progress tracking
  sseProgress?: UnifiedOnboardingProgress | null;
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
  const [realTimeProgress, setRealTimeProgress] = useState(progress);
  const [realTimeMessage, setRealTimeMessage] = useState(message);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  // Suppress unused variable warnings for now
  console.log('DeviceOnboardingLoader props:', { deviceName, pdfFileName, realTimeProgress, realTimeMessage, completedSteps });

  // Map backend stage to frontend step
  const mapBackendStageToStep = (stage: string): string => {
    switch (stage) {
      case 'device': return 'device_creation';
      case 'assignment': return 'user_assignment';
      case 'upload': return 'pdf_upload';
      case 'rules': return 'rules_generation';
      case 'maintenance': return 'maintenance_schedule';
      case 'safety': return 'safety_procedures';
      case 'complete': return 'safety_procedures';
      default: return 'device_creation';
    }
  };

  // Update current step index when currentStep changes
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

      // Handle completion
      if (sseProgress.stage === 'complete' && onComplete) {
        console.log('📊 Loader: Onboarding completed via SSE - triggering onComplete');
        setRealTimeMessage('✅ Onboarding completed successfully! Device is ready for use.');
        setRealTimeProgress(100);
        setTimeout(() => {
          console.log('📊 Loader: Calling onComplete callback after 2 second delay');
          onComplete();
        }, 2000); // 2 second delay to show success message
      }

      // Handle errors
      if (sseProgress.error) {
        console.error('📊 Loader: SSE Error received', sseProgress.error);
        setRealTimeMessage(`❌ Error: ${sseProgress.error}`);
      }
    }
  }, [sseProgress, currentStep, onComplete, currentStepIndex]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <SSEEventDisplay sseProgress={sseProgress || null} isProcessing={isProcessing} />
      </div>
    </div>
  );
};

export default DeviceOnboardingLoader;