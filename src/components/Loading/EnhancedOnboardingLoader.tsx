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
  subStages: SubStage[];
  estimatedTime: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

interface SubStage {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
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
  const [pulseAnimation, setPulseAnimation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [stageProgress, setStageProgress] = useState(0);
  const [currentSubStageIndex, setCurrentSubStageIndex] = useState(0);

  const processStages: ProcessStage[] = [
    {
      id: 'pdf',
      title: 'Device Onboarding',
      description: 'Processing device information and storing data',
      icon: <FileText className="w-8 h-8" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      estimatedTime: '1-2 minutes',
      status: 'pending',
      subStages: [
        {
          id: 'store_device',
          title: 'Storing device data',
          description: 'Saving device information to database',
          icon: <Database className="w-5 h-5" />,
          status: 'pending'
        },
        {
          id: 'link_pdf',
          title: 'Linking PDF to device',
          description: 'Associating documentation with device record',
          icon: <FileCheck className="w-5 h-5" />,
          status: 'pending'
        },
        {
          id: 'validate_data',
          title: 'Validating device data',
          description: 'Ensuring all required fields are complete',
          icon: <Shield className="w-5 h-5" />,
          status: 'pending'
        }
      ]
    },
    {
      id: 'rules',
      title: 'PDF Processing',
      description: 'Processing PDF manual with MinerU AI',
      icon: <Brain className="w-8 h-8" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      estimatedTime: '2-3 minutes',
      status: 'pending',
      subStages: [
        {
          id: 'upload_pdf',
          title: 'Uploading PDF',
          description: 'Securely uploading document to processing service',
          icon: <Upload className="w-5 h-5" />,
          status: 'pending'
        },
        {
          id: 'extract_content',
          title: 'Extracting content',
          description: 'Extracting text, images, and metadata from PDF',
          icon: <FileCode className="w-5 h-5" />,
          status: 'pending'
        },
        {
          id: 'analyze_structure',
          title: 'Analyzing structure',
          description: 'Understanding document layout and organization',
          icon: <Layers className="w-5 h-5" />,
          status: 'pending'
        },
        {
          id: 'process_chunks',
          title: 'Processing chunks',
          description: 'Breaking document into manageable chunks',
          icon: <Code className="w-5 h-5" />,
          status: 'pending'
        }
      ]
    },
    {
      id: 'knowledgebase',
      title: 'Rules Generation',
      description: 'Generating maintenance rules and details',
      icon: <Target className="w-8 h-8" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      estimatedTime: '2-3 minutes',
      status: 'pending',
      subStages: [
        {
          id: 'generate_rules',
          title: 'Generating IoT rules',
          description: 'Creating monitoring and alert rules',
          icon: <Target className="w-5 h-5" />,
          status: 'pending'
        },
        {
          id: 'create_maintenance',
          title: 'Creating maintenance schedule',
          description: 'Generating preventive maintenance tasks',
          icon: <Wrench className="w-5 h-5" />,
          status: 'pending'
        },
        {
          id: 'extract_safety',
          title: 'Extracting safety precautions',
          description: 'Identifying safety requirements and warnings',
          icon: <AlertTriangle className="w-5 h-5" />,
          status: 'pending'
        },
        {
          id: 'store_data',
          title: 'Storing in database',
          description: 'Saving generated rules and maintenance data',
          icon: <Database className="w-5 h-5" />,
          status: 'pending'
        },
        {
          id: 'link_to_device',
          title: 'Linking to device',
          description: 'Associating rules with device record',
          icon: <Network className="w-5 h-5" />,
          status: 'pending'
        }
      ]
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
        }, 4000);
      }, 1000);
    }
  }, [progress, isProcessing, onComplete]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseAnimation(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Update stage progress based on current process
  useEffect(() => {
    if (isProcessing) {
      const progressPerStage = 100 / processStages.length;
      const currentStageProgress = progressPerStage * currentStageIndex;
      const stageProgress = Math.min(progress - currentStageProgress, progressPerStage);
      setStageProgress(stageProgress);
    }
  }, [progress, currentStageIndex, isProcessing]);

  const handleRetry = () => {
    setError(null);
    setRetryCount(prev => prev + 1);
    setStageProgress(0);
    setCurrentSubStageIndex(0);
  };

  const getStageStatus = (index: number) => {
    if (index < currentStageIndex) return 'completed';
    if (index === currentStageIndex) return 'current';
    return 'pending';
  };

  const getSubStageStatus = (stageIndex: number, subStageIndex: number) => {
    if (stageIndex < currentStageIndex) return 'completed';
    if (stageIndex === currentStageIndex) {
      if (subStageIndex < currentSubStageIndex) return 'completed';
      if (subStageIndex === currentSubStageIndex) return 'processing';
    }
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {processStages.map((stage, index) => (
              <div key={stage.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{stage.title}</p>
                  <p className="text-xs text-gray-500">Completed</p>
                </div>
              </div>
            ))}
          </div>

          {pdfFileName && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-900">
                  Document: {pdfFileName}
                </span>
              </div>
            </div>
          )}

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
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">Device Onboarding</h1>
              <p className="text-blue-100">
                Setting up your device with AI-powered intelligence
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{Math.round(progress)}%</div>
              <div className="text-blue-100 text-sm">Complete</div>
            </div>
          </div>
          
          {/* Overall Progress Bar */}
          <div className="mt-4 bg-blue-700 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="p-6">
          {/* Process Stages Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {processStages.map((stage, index) => {
              const status = getStageStatus(index);
              const isCurrent = index === currentStageIndex;
              const isCompleted = index < currentStageIndex;
              
              return (
                <div 
                  key={stage.id}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                    isCurrent 
                      ? `${stage.bgColor} border-${stage.color.replace('text-', '')}-300 shadow-lg` 
                      : isCompleted 
                        ? 'bg-green-50 border-green-300' 
                        : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center mb-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                      isCurrent 
                        ? `${stage.bgColor.replace('bg-', 'bg-').replace('-50', '-100')}` 
                        : isCompleted 
                          ? 'bg-green-100' 
                          : 'bg-gray-100'
                    }`}>
                      {isCurrent ? (
                        <Loader2 className={`w-5 h-5 ${stage.color} animate-spin`} />
                      ) : isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        stage.icon
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold ${
                        isCurrent ? stage.color : isCompleted ? 'text-green-700' : 'text-gray-600'
                      }`}>
                        {stage.title}
                      </h3>
                      <p className="text-xs text-gray-500">{stage.estimatedTime}</p>
                    </div>
                  </div>
                  
                  {isCurrent && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Progress</span>
                        <span>{Math.round(stageProgress)}%</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`${stage.color.replace('text-', 'bg-')} h-1.5 rounded-full transition-all duration-500`}
                          style={{ width: `${stageProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {isCompleted && (
                    <div className="flex items-center text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Completed
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Current Stage Details */}
          {currentStage && (
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="flex items-center mb-4">
                <div className={`w-12 h-12 ${currentStage.bgColor} rounded-full flex items-center justify-center mr-4`}>
                  {currentStage.icon}
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${currentStage.color}`}>
                    {currentStage.title}
                  </h2>
                  <p className="text-gray-600">{currentStage.description}</p>
                </div>
              </div>

              {/* Sub-stages */}
              <div className="space-y-3">
                {currentStage.subStages.map((subStage, subIndex) => {
                  const subStatus = getSubStageStatus(currentStageIndex, subIndex);
                  const isCurrentSub = subIndex === currentSubStageIndex;
                  
                  return (
                    <div 
                      key={subStage.id}
                      className={`flex items-center p-3 rounded-lg border transition-all duration-300 ${
                        isCurrentSub 
                          ? 'bg-white border-blue-300 shadow-sm' 
                          : subStatus === 'completed' 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                        isCurrentSub 
                          ? 'bg-blue-100' 
                          : subStatus === 'completed' 
                            ? 'bg-green-100' 
                            : 'bg-gray-100'
                      }`}>
                        {isCurrentSub ? (
                          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                        ) : subStatus === 'completed' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          subStage.icon
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className={`font-medium ${
                          isCurrentSub ? 'text-blue-900' : subStatus === 'completed' ? 'text-green-800' : 'text-gray-700'
                        }`}>
                          {subStage.title}
                        </h4>
                        <p className={`text-sm ${
                          isCurrentSub ? 'text-blue-700' : subStatus === 'completed' ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {subStage.description}
                        </p>
                      </div>
                      
                      {isCurrentSub && (
                        <div className="flex-shrink-0 ml-3">
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${subStageProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* File Information */}
          {pdfFileName && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-900">
                  Processing: {pdfFileName}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
