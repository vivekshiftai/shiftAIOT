import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Brain, 
  Database, 
  CheckCircle, 
  Loader2, 
  Sparkles,
  GitBranch,
  Target,
  Shield,
  Activity,
  Clock,
  BarChart3,
  Settings,
  Wrench,
  AlertTriangle,
  RotateCcw,
  Upload,
  Zap,
  MessageSquare,
  Bot,
  GitCommit,
  Search,
  Code,
  Layers,
  Cpu,
  Network,
  FileCode,
  GitPullRequest,
  GitMerge,
  GitCompare,
  CheckCircle2,
  XCircle,
  Info,
  FileCheck,
  FolderGit2
} from 'lucide-react';

interface EnhancedOnboardingLoaderProps {
  isProcessing: boolean;
  currentProcess: 'pdf' | 'rules' | 'knowledgebase';
  progress: number;
  onComplete: () => void;
  pdfFileName?: string;
  onError?: (error: string) => void;
  currentSubStage?: string;
  subStageProgress?: number;
}

interface ProcessStage {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export const EnhancedOnboardingLoader: React.FC<EnhancedOnboardingLoaderProps> = ({
  isProcessing,
  currentProcess,
  progress,
  onComplete,
  pdfFileName,
  onError,
  currentSubStage,
  subStageProgress = 0
}) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const processStages: ProcessStage[] = [
    {
      id: 'pdf',
      title: 'PDF Uploading',
      description: 'Securely uploading and processing your device documentation',
      icon: <Upload className="w-8 h-8" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      status: 'pending'
    },
    {
      id: 'rules',
      title: 'Rules Generation',
      description: 'AI-powered analysis and rule generation from documentation',
      icon: <Brain className="w-8 h-8" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      status: 'pending'
    },
    {
      id: 'knowledgebase',
      title: 'Initializing Chat',
      description: 'Setting up intelligent chat interface for your device',
      icon: <MessageSquare className="w-8 h-8" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      status: 'pending'
    }
  ];

  useEffect(() => {
    const stageIndex = processStages.findIndex(stage => stage.id === currentProcess);
    if (stageIndex !== -1) {
      setCurrentStageIndex(stageIndex);
    }
  }, [currentProcess]);

  useEffect(() => {
    if (progress >= 100 && isProcessing) {
      setTimeout(() => {
        setShowSuccess(true);
        setTimeout(() => {
          onComplete();
        }, 2000);
      }, 1000);
    }
  }, [progress, isProcessing, onComplete]);

  const handleRetry = () => {
    setError(null);
    setRetryCount(prev => prev + 1);
  };

  const getStageStatus = (index: number) => {
    if (index < currentStageIndex) return 'completed';
    if (index === currentStageIndex) return 'processing';
    return 'pending';
  };

  const currentStage = processStages[currentStageIndex];

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-green-200 max-w-2xl w-full text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Device Onboarding Complete!</h1>
            <p className="text-lg text-gray-600">
              Your device has been successfully onboarded and is ready for use.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onComplete}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Continue to Device Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-red-200 max-w-2xl w-full text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing Error</h1>
            <p className="text-gray-600 mb-4">{error}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <RotateCcw className="w-4 h-4 inline mr-2" />
              Retry Processing
            </button>
            <button
              onClick={() => onError?.(error)}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden">
        {/* Header with prominent progress bar */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Equipment Intelligence Agent</h1>
              <p className="text-blue-100 text-lg">
                Processing your device documentation with AI
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{Math.round(progress)}%</div>
              <div className="text-blue-100 text-sm">Complete</div>
            </div>
          </div>
          
          {/* Prominent progress bar */}
          <div className="bg-blue-700 rounded-full h-3 mb-4">
            <div 
              className="bg-white h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Minimal status text */}
          <div className="text-center">
            <p className="text-blue-100 text-sm">
              {currentStage?.title} • {Math.round(progress)}% complete
            </p>
            {currentSubStage && (
              <p className="text-blue-200 text-xs mt-1">
                {currentSubStage}
              </p>
            )}
          </div>
        </div>

        <div className="p-8">
          {/* Process Stages as animated cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {processStages.map((stage, index) => {
              const status = getStageStatus(index);
              const isCurrent = index === currentStageIndex;
              const isCompleted = index < currentStageIndex;
              
              return (
                <div 
                  key={stage.id}
                  className={`relative p-6 rounded-2xl border-2 transition-all duration-500 transform ${
                    isCurrent 
                      ? `${stage.bgColor} border-${stage.color.replace('text-', '')}-300 shadow-xl scale-105` 
                      : isCompleted 
                        ? 'bg-green-50 border-green-300 shadow-lg' 
                        : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center mb-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                      isCurrent 
                        ? `${stage.bgColor.replace('bg-', 'bg-').replace('-50', '-100')}` 
                        : isCompleted 
                          ? 'bg-green-100' 
                          : 'bg-gray-100'
                    }`}>
                      {isCurrent ? (
                        <Loader2 className={`w-6 h-6 ${stage.color} animate-spin`} />
                      ) : isCompleted ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        stage.icon
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-lg font-semibold ${
                        isCurrent ? stage.color : isCompleted ? 'text-green-700' : 'text-gray-600'
                      }`}>
                        {stage.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">{stage.description}</p>
                    </div>
                  </div>
                  
                  {isCurrent && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Processing</span>
                        <span>{Math.round((progress - (index * 33.33)) / 33.33 * 100)}%</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2">
                        <div 
                          className={`${stage.color.replace('text-', 'bg-')} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min(Math.max((progress - (index * 33.33)) / 33.33 * 100, 0), 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {isCompleted && (
                    <div className="flex items-center text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Completed
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* File Information */}
          {pdfFileName && (
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center">
                <FileText className="w-6 h-6 text-blue-600 mr-3" />
                <div>
                  <span className="text-sm font-medium text-blue-900">
                    Processing: {pdfFileName}
                  </span>
                  <p className="text-xs text-blue-700 mt-1">
                    {currentSubStage || 'AI analysis in progress...'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
