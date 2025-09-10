import React from 'react';
import { 
  Settings,
  User,
  Upload, 
  Zap, 
  Wrench, 
  Shield
} from 'lucide-react';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  details: string[];
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'device_creation',
    title: 'Device Creation',
    description: 'Creating device configuration in the system',
    icon: <Settings className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    details: [
      'Setting up device in the system',
      'Configuring device parameters',
      'Saving device configuration'
    ]
  },
  {
    id: 'user_assignment',
    title: 'User Assignment',
    description: 'Assigning device to responsible user',
    icon: <User className="w-6 h-6" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    details: [
      'Setting up user responsibility',
      'Configuring notifications',
      'Establishing ownership'
    ]
  },
  {
    id: 'pdf_upload',
    title: 'PDF Upload',
    description: 'Uploading device documentation to AI processing service',
    icon: <Upload className="w-6 h-6" />,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
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
  }
];

/**
 * Get step status based on current step and completed steps
 */
export const getStepStatus = (stepId: string, currentStep: string, completedSteps: string[]): 'completed' | 'current' | 'pending' => {
  if (completedSteps.includes(stepId)) {
    return 'completed';
  } else if (stepId === currentStep) {
    return 'current';
  } else {
    return 'pending';
  }
};

/**
 * Get step card style based on status
 */
export const getStepCardStyle = (step: OnboardingStep, status: 'completed' | 'current' | 'pending'): string => {
  if (status === 'completed') {
    return 'bg-green-50 border-green-200 shadow-sm';
  } else if (status === 'current') {
    return `${step.bgColor} border-2 border-blue-300 shadow-md`;
  } else {
    return 'bg-gray-50 border-gray-200 opacity-60';
  }
};

/**
 * Map backend stage to frontend step ID
 */
export const mapBackendStageToStep = (stage: string): string => {
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
      return 'safety_procedures'; // Complete stage shows the final step (safety procedures)
    default:
      console.warn(`Unknown backend stage: ${stage}, defaulting to device_creation`);
      return 'device_creation';
  }
};
