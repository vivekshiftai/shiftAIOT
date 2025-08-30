import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Zap, 
  Wrench, 
  Shield, 
  CheckCircle, 
  Clock,
  FileText,
  Cpu,
  Database
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  details: string[];
}

interface DeviceOnboardingLoaderProps {
  isProcessing: boolean;
  currentStep: string;
  deviceName: string;
  pdfFileName: string;
  onComplete?: () => void;
}

export const DeviceOnboardingLoader: React.FC<DeviceOnboardingLoaderProps> = ({
  isProcessing,
  currentStep,
  deviceName,
  pdfFileName,
  onComplete
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'pdf_upload',
      title: 'PDF Upload',
      description: 'Uploading device documentation to AI processing service',
      icon: <Upload className="w-6 h-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      details: [
        'Securely uploading PDF file',
        'Validating document format',
        'Preparing for AI analysis'
      ]
    },
    {
      id: 'rules_generation',
      title: 'Rules Generation',
      description: 'Creating intelligent IoT monitoring rules',
      icon: <Zap className="w-6 h-6" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      details: [
        'Analyzing device specifications',
        'Generating monitoring rules',
        'Setting alert thresholds'
      ]
    },
    {
      id: 'maintenance_schedule',
      title: 'Maintenance Schedule',
      description: 'Generating preventive maintenance plans',
      icon: <Wrench className="w-6 h-6" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      details: [
        'Extracting maintenance requirements',
        'Creating service schedules',
        'Setting up reminders'
      ]
    },
    {
      id: 'safety_procedures',
      title: 'Safety Procedures',
      description: 'Extracting safety guidelines and procedures',
      icon: <Shield className="w-6 h-6" />,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      details: [
        'Identifying safety requirements',
        'Creating safety protocols',
        'Setting up safety alerts'
      ]
    },
    {
      id: 'device_storage',
      title: 'Device Storage',
      description: 'Saving device configuration to database',
      icon: <Database className="w-6 h-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      details: [
        'Storing device information',
        'Saving AI-generated content',
        'Finalizing configuration'
      ]
    }
  ];

  useEffect(() => {
    const stepIndex = onboardingSteps.findIndex(step => step.id === currentStep);
    if (stepIndex !== -1) {
      setCurrentStepIndex(stepIndex);
    }
  }, [currentStep]);

  useEffect(() => {
    // Mark previous steps as completed
    const completed = onboardingSteps
      .slice(0, currentStepIndex)
      .map(step => step.id);
    setCompletedSteps(completed);
  }, [currentStepIndex]);

  const getStepStatus = (stepId: string) => {
    if (completedSteps.includes(stepId)) {
      return 'completed';
    } else if (stepId === currentStep) {
      return 'current';
    } else {
      return 'pending';
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
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
        </div>
      );
    } else {
      return <div className={`w-6 h-6 ${step.color} opacity-50`}>{step.icon}</div>;
    }
  };

  const getStepCardStyle = (step: OnboardingStep, status: string) => {
    if (status === 'completed') {
      return 'bg-green-50 border-green-200 shadow-sm';
    } else if (status === 'current') {
      return `${step.bgColor} border-2 border-blue-300 shadow-md`;
    } else {
      return 'bg-gray-50 border-gray-200 opacity-60';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">AI Device Onboarding</h2>
              <p className="text-blue-100">Setting up {deviceName} with intelligent AI capabilities</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {onboardingSteps.map((step, index) => {
              const status = getStepStatus(step.id);
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
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <Clock className="w-4 h-4 animate-pulse" />
                        <span>Processing...</span>
                      </div>
                      <div className="space-y-1">
                        {step.details.map((detail, detailIndex) => (
                          <div key={detailIndex} className="flex items-center gap-2 text-xs text-gray-600">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
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
                  Current Step: {onboardingSteps[currentStepIndex]?.title}
                </span>
                <span className="text-sm text-gray-500">
                  Step {currentStepIndex + 1} of {onboardingSteps.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out animate-pulse"
                  style={{ width: '60%' }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Processing {pdfFileName} for {deviceName}...
              </p>
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
