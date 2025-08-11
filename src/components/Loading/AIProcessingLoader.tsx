import React from 'react';
import { 
  Brain, 
  FileText, 
  Search, 
  Target, 
  Shield, 
  Database, 
  CheckCircle,
  Loader2,
  Sparkles
} from 'lucide-react';

interface ProcessingStage {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  duration: number;
}

interface AIProcessingLoaderProps {
  isProcessing: boolean;
  currentStage: string;
  progress: number;
  onComplete?: () => void;
}

const processingStages: ProcessingStage[] = [
  {
    id: 'uploading',
    title: 'Uploading PDF',
    description: 'Securely uploading your document to our AI processing engine',
    icon: FileText,
    duration: 2000
  },
  {
    id: 'analyzing',
    title: 'AI Analysis',
    description: 'Advanced AI is analyzing document content and structure',
    icon: Brain,
    duration: 3000
  },
  {
    id: 'extracting',
    title: 'Extracting Specifications',
    description: 'Identifying device specifications and technical details',
    icon: Search,
    duration: 2500
  },
  {
    id: 'generating_rules',
    title: 'Generating IoT Rules',
    description: 'Creating intelligent monitoring and alert rules',
    icon: Target,
    duration: 3000
  },
  {
    id: 'maintenance',
    title: 'Maintenance Schedule',
    description: 'Generating preventive maintenance schedules',
    icon: Shield,
    duration: 2000
  },
  {
    id: 'storing',
    title: 'Storing Data',
    description: 'Securely storing processed data and configurations',
    icon: Database,
    duration: 1500
  }
];

export const AIProcessingLoader: React.FC<AIProcessingLoaderProps> = ({
  isProcessing,
  currentStage,
  progress,
  onComplete
}) => {
  const currentStageIndex = processingStages.findIndex(stage => stage.id === currentStage);
  const isCompleted = progress >= 100;

  // Debug logging
  console.log('AIProcessingLoader - Props:', {
    isProcessing,
    currentStage,
    progress,
    currentStageIndex,
    isCompleted
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              {isCompleted ? (
                <CheckCircle className="w-10 h-10 text-white" />
              ) : (
                <Brain className="w-10 h-10 text-white" />
              )}
            </div>
            {isProcessing && !isCompleted && (
              <div className="absolute -top-2 -right-2">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {isCompleted ? 'Processing Complete!' : 'AI Processing Your Document'}
          </h2>
          <p className="text-slate-600">
            {isCompleted 
              ? 'Your device documentation has been successfully analyzed and processed.'
              : 'Our advanced AI is analyzing your PDF to generate intelligent IoT rules and maintenance schedules.'
            }
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-slate-600 mb-2">
            <span>Processing Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Processing Stages */}
        <div className="space-y-4">
          {processingStages.map((stage, index) => {
            const isActive = stage.id === currentStage;
            const isCompleted = index < currentStageIndex;
            const isPending = index > currentStageIndex;

            return (
              <div
                key={stage.id}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 ${
                  isActive
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : isCompleted
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                {/* Stage Icon */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                  isActive
                    ? 'bg-blue-500 text-white'
                    : isCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-300 text-slate-500'
                }`}>
                  {isActive ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : isCompleted ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <stage.icon className="w-6 h-6" />
                  )}
                </div>

                {/* Stage Content */}
                <div className="flex-1">
                  <h3 className={`font-semibold ${
                    isActive ? 'text-blue-800' : isCompleted ? 'text-green-800' : 'text-slate-600'
                  }`}>
                    {stage.title}
                  </h3>
                  <p className={`text-sm ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-slate-500'
                  }`}>
                    {stage.description}
                  </p>
                </div>

                {/* Status Indicator */}
                <div className="flex-shrink-0">
                  {isActive && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-blue-600 font-medium">Processing</span>
                    </div>
                  )}
                  {isCompleted && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-600 font-medium">Complete</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        {isCompleted && onComplete && (
          <div className="mt-8 text-center">
            <button
              onClick={onComplete}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium"
            >
              Continue to Device Setup
            </button>
          </div>
        )}

        {/* Processing Tips */}
        {isProcessing && !isCompleted && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">AI Processing Tips</span>
            </div>
            <p className="text-sm text-blue-700">
              Our AI is analyzing your document to extract device specifications, 
              generate monitoring rules, and create maintenance schedules. 
              This process typically takes 30-60 seconds depending on document complexity.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
