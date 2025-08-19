import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Brain, 
  CheckCircle, 
  Loader2,
  Database,
  Bot,
  Settings,
  Wifi,
  Shield
} from 'lucide-react';

interface EnhancedOnboardingLoaderProps {
  isProcessing: boolean;
  currentProcess: string;
  progress: number;
  onComplete: () => void;
  pdfFileName?: string;
  currentSubStage?: string;
}

const pdfProcessingStages = [
  { name: 'Uploading PDF', icon: Upload, color: 'text-blue-500' },
  { name: 'Processing Content', icon: Brain, color: 'text-purple-500' },
  { name: 'Creating Device', icon: Database, color: 'text-green-500' },
  { name: 'Setting Up AI Assistant', icon: Bot, color: 'text-orange-500' }
];

export const EnhancedOnboardingLoader: React.FC<EnhancedOnboardingLoaderProps> = ({
  isProcessing,
  currentProcess,
  progress,
  onComplete,
  pdfFileName,
  currentSubStage
}) => {
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    if (progress >= 100) {
      setTimeout(() => {
        onComplete();
      }, 1000);
    }
  }, [progress, onComplete]);

  useEffect(() => {
    // Update current stage based on progress
    if (progress < 30) setCurrentStage(0);
    else if (progress < 70) setCurrentStage(1);
    else if (progress < 90) setCurrentStage(2);
    else setCurrentStage(3);
  }, [progress]);

  return (
    <div className="w-full max-w-md mx-auto text-center">
      {/* Main Loading Animation */}
      <div className="relative mb-8">
        <div className="w-24 h-24 mx-auto relative">
          {/* Outer ring */}
          <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
          
          {/* Animated ring */}
          <div className="absolute inset-0 border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
          
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Process Title */}
      <h2 className="text-xl font-bold text-slate-800 mb-2">
        {currentProcess === 'pdf' ? 'PDF Processing' : 'Device Onboarding'}
      </h2>

      {/* Current Stage Display */}
      <div className="mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          {pdfProcessingStages.map((stage, index) => {
            const Icon = stage.icon;
            const isActive = index === currentStage;
            const isCompleted = index < currentStage;
            
            return (
              <div key={index} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isCompleted ? 'bg-green-100 text-green-600' :
                  isActive ? 'bg-blue-100 text-blue-600' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                {index < pdfProcessingStages.length - 1 && (
                  <div className={`w-8 h-0.5 mx-2 ${
                    isCompleted ? 'bg-green-300' : 'bg-gray-200'
                  }`}></div>
                )}
              </div>
            );
          })}
        </div>
        
        <p className="text-sm text-slate-600 font-medium">
          {pdfProcessingStages[currentStage]?.name}
        </p>
      </div>

      {/* Current Sub-Stage */}
      {currentSubStage && (
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
            <p className="text-sm text-slate-600">{currentSubStage}</p>
          </div>
        </div>
      )}

      {/* File Information */}
      {pdfFileName && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Processing File</span>
          </div>
          <p className="text-xs text-blue-700 truncate">{pdfFileName}</p>
        </div>
      )}

      {/* Status Indicators */}
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-slate-600">PDF Upload</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            progress >= 30 ? 'bg-green-500' : 'bg-gray-300'
          }`}></div>
          <span className="text-slate-600">Content Processing</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            progress >= 70 ? 'bg-green-500' : 'bg-gray-300'
          }`}></div>
          <span className="text-slate-600">Device Creation</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            progress >= 90 ? 'bg-green-500' : 'bg-gray-300'
          }`}></div>
          <span className="text-slate-600">AI Setup</span>
        </div>
      </div>

      {/* Completion Message */}
      {progress >= 100 && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">Processing Complete!</span>
          </div>
          <p className="text-xs text-green-700">
            Your device has been successfully onboarded with AI assistance.
          </p>
        </div>
      )}
    </div>
  );
};
