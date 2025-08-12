import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  FileText, 
  Cpu, 
  Database, 
  CheckCircle, 
  Loader2, 
  Sparkles,
  Bot,
  Zap,
  Target,
  Shield,
  Activity,
  Clock,
  BarChart3,
  Settings,
  Wrench,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface AIProcessingLoaderProps {
  isProcessing: boolean;
  currentStage: string;
  progress: number;
  onComplete: () => void;
}

interface ProcessingStage {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export const AIProcessingLoader: React.FC<AIProcessingLoaderProps> = ({
  isProcessing,
  currentStage,
  progress,
  onComplete
}) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  const processingStages: ProcessingStage[] = [
    {
      id: 'uploading',
      title: 'Uploading PDF',
      description: 'Securely uploading your device documentation to our AI processing system',
      icon: <FileText className="w-6 h-6" />,
      color: 'text-blue-600'
    },
    {
      id: 'analyzing',
      title: 'AI Analysis',
      description: 'Our AI is analyzing your device specifications and technical requirements',
      icon: <Brain className="w-6 h-6" />,
      color: 'text-purple-600'
    },
    {
      id: 'extracting',
      title: 'Extracting Data',
      description: 'Extracting key device parameters, specifications, and operational details',
      icon: <Cpu className="w-6 h-6" />,
      color: 'text-indigo-600'
    },
    {
      id: 'generating_rules',
      title: 'Generating IoT Rules',
      description: 'Creating intelligent monitoring rules and alert conditions for your device',
      icon: <Target className="w-6 h-6" />,
      color: 'text-green-600'
    },
    {
      id: 'maintenance',
      title: 'Maintenance Planning',
      description: 'Generating preventive maintenance schedules and service recommendations',
      icon: <Wrench className="w-6 h-6" />,
      color: 'text-orange-600'
    },
    {
      id: 'storing',
      title: 'Storing in Vector DB',
      description: 'Storing processed data in our vector database for future AI queries',
      icon: <Database className="w-6 h-6" />,
      color: 'text-teal-600'
    }
  ];

  useEffect(() => {
    const stageIndex = processingStages.findIndex(stage => stage.id === currentStage);
    if (stageIndex !== -1) {
      setCurrentStageIndex(stageIndex);
    }
  }, [currentStage]);

  useEffect(() => {
    if (progress >= 100 && isProcessing) {
      setTimeout(() => {
        setShowSuccess(true);
        setTimeout(() => {
          onComplete();
        }, 3000);
      }, 1000);
    }
  }, [progress, isProcessing, onComplete]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseAnimation(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const getStageStatus = (index: number) => {
    if (index < currentStageIndex) return 'completed';
    if (index === currentStageIndex) return 'current';
    return 'pending';
  };

  const getStageIcon = (stage: ProcessingStage, status: string) => {
    if (status === 'completed') {
      return <CheckCircle className="w-6 h-6 text-green-600" />;
    }
    if (status === 'current') {
      return (
        <div className={`${stage.color} ${pulseAnimation ? 'animate-pulse' : ''}`}>
          {stage.icon}
        </div>
      );
    }
    return <div className="text-gray-400">{stage.icon}</div>;
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              🎉 AI Processing Complete!
            </h3>
            <p className="text-gray-600 mb-4">
              Your device documentation has been successfully analyzed and processed.
            </p>
            <div className="bg-green-50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">AI Analysis Results</span>
              </div>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• IoT monitoring rules generated</li>
                <li>• Maintenance schedule created</li>
                <li>• Device specifications extracted</li>
                <li>• Data stored in vector database</li>
              </ul>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Preparing your device dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Activity className="w-3 h-3 text-white animate-pulse" />
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            AI-Powered Device Analysis
          </h2>
          <p className="text-gray-600">
            Our advanced AI is processing your device documentation to create intelligent monitoring rules and maintenance schedules.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Processing Progress</span>
            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Current Stage */}
        <div className="mb-8">
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                {processingStages[currentStageIndex]?.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-800">
                  {processingStages[currentStageIndex]?.title}
                </h3>
                <p className="text-sm text-blue-600">
                  {processingStages[currentStageIndex]?.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Please wait while we process your data...</span>
            </div>
          </div>
        </div>

        {/* Processing Stages */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Processing Steps</h4>
          {processingStages.map((stage, index) => {
            const status = getStageStatus(index);
            return (
              <div 
                key={stage.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                  status === 'current' 
                    ? 'bg-blue-50 border border-blue-200' 
                    : status === 'completed'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex-shrink-0">
                  {getStageIcon(stage, status)}
                </div>
                <div className="flex-1">
                  <h5 className={`text-sm font-medium ${
                    status === 'current' ? 'text-blue-800' :
                    status === 'completed' ? 'text-green-800' : 'text-gray-500'
                  }`}>
                    {stage.title}
                  </h5>
                  <p className={`text-xs ${
                    status === 'current' ? 'text-blue-600' :
                    status === 'completed' ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {stage.description}
                  </p>
                </div>
                {status === 'current' && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  </div>
                )}
                {status === 'completed' && (
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Tips */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h5 className="text-sm font-medium text-yellow-800 mb-1">Processing Tips</h5>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• Processing time depends on document size and complexity</li>
                <li>• Please don't close this window during processing</li>
                <li>• You'll receive intelligent rules and maintenance schedules</li>
                <li>• All data is securely processed and stored</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
