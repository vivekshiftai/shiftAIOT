import React, { useEffect, useState } from 'react';
import { 
  CheckCircle, 
  FileText, 
  Target, 
  Brain, 
  MessageSquare, 
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  Activity,
  GitBranch,
  Database,
  Search,
  Bot,
  Clock,
  CheckCircle2,
  GitCommit,
  Layers,
  Cpu,
  BarChart3,
  AlertTriangle,
  Settings,
  Network
} from 'lucide-react';

interface DeviceOnboardingSuccessProps {
  deviceName: string;
  pdfFileName?: string;
  rulesCount: number;
  maintenanceCount: number;
  safetyCount: number;
  onContinue: () => void;
  onStartChat: () => void;
  onClose: () => void;
  processingDetails?: {
    total_pages?: number;
    processed_chunks?: number;
    processing_time?: number;
  };
}

export const DeviceOnboardingSuccess: React.FC<DeviceOnboardingSuccessProps> = ({
  deviceName,
  pdfFileName,
  rulesCount,
  maintenanceCount,
  safetyCount,
  onContinue,
  onStartChat,
  onClose,
  processingDetails
}) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    // Trigger animations in sequence
    setShowAnimation(true);
    setTimeout(() => setShowDetails(true), 500);
    setTimeout(() => setShowStats(true), 1000);
    setTimeout(() => setShowActions(true), 1500);
  }, []);

  const features = [
    {
      icon: <FileText className="w-5 h-5" />,
      title: 'PDF Processed & Stored',
      description: 'Documentation securely stored in Git repository',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      detail: pdfFileName ? `File: ${pdfFileName}` : 'Documentation processed',
      subDetails: processingDetails ? [
        `Pages processed: ${processingDetails.total_pages || 0}`,
        `Chunks created: ${processingDetails.processed_chunks || 0}`,
        `Processing time: ${processingDetails.processing_time ? Math.round(processingDetails.processing_time / 1000) : 0}s`
      ] : []
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: `${rulesCount} IoT Rules Generated`,
      description: 'Intelligent monitoring and automation rules',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      detail: `${rulesCount} rules created for device monitoring`,
      subDetails: [
        'Monitoring rules for real-time tracking',
        'Alert conditions for proactive notifications',
        'Automation workflows for device control'
      ]
    },
    {
      icon: <Brain className="w-5 h-5" />,
      title: 'AI Knowledge Base Created',
      description: 'Ready for intelligent device queries',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      detail: 'Vector embeddings and search index ready',
      subDetails: [
        'Semantic search capabilities',
        'Context-aware responses',
        'Multi-language support'
      ]
    }
  ];

  const stats = [
    {
      label: 'Maintenance Records',
      value: maintenanceCount,
      icon: <Shield className="w-4 h-4" />,
      color: 'text-orange-600'
    },
    {
      label: 'Safety Precautions',
      value: safetyCount,
      icon: <Activity className="w-4 h-4" />,
      color: 'text-red-600'
    },
    {
      label: 'Processing Time',
      value: processingDetails?.processing_time ? `${Math.round(processingDetails.processing_time / 1000)}s` : '~3 min',
      icon: <Clock className="w-4 h-4" />,
      color: 'text-gray-600'
    }
  ];

  const processSteps = [
    {
      stage: 'PDF Processing & Git Storage',
      icon: <GitCommit className="w-4 h-4" />,
      status: 'completed',
      details: ['Document uploaded', 'Content extracted', 'Git repository initialized', 'Search index created']
    },
    {
      stage: 'Rules Generation',
      icon: <Target className="w-4 h-4" />,
      status: 'completed',
      details: ['Specifications analyzed', 'Parameters identified', 'Rules generated', 'Logic validated']
    },
    {
      stage: 'Knowledge Base Creation',
      icon: <Brain className="w-4 h-4" />,
      status: 'completed',
      details: ['Content vectorized', 'Embeddings created', 'AI model trained', 'Chat interface ready']
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-3xl">
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4 transition-all duration-700 ${showAnimation ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Device Onboarding Complete!</h1>
            <p className="text-green-100 text-lg">
              {deviceName} is now ready for intelligent monitoring and management
            </p>
          </div>
        </div>

        <div className="p-6">
          {/* Process Overview */}
          <div className={`mb-8 transition-all duration-700 ${showDetails ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Process Summary</h2>
            <div className="space-y-3">
              {processSteps.map((step, index) => (
                <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      {step.icon}
                      <span className="ml-2 font-medium text-gray-900">{step.stage}</span>
                    </div>
                    <div className="ml-6 mt-1">
                      <div className="text-sm text-gray-600 space-y-1">
                        {step.details.map((detail, detailIndex) => (
                          <div key={detailIndex} className="flex items-center">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                            {detail}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Features Grid */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 transition-all duration-700 ${showDetails ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {features.map((feature, index) => (
              <div key={index} className={`p-4 rounded-xl border-2 transition-all duration-300 ${feature.bgColor} border-${feature.color.replace('text-', '')}-200`}>
                <div className="flex items-center mb-3">
                  <div className={`w-10 h-10 ${feature.bgColor.replace('bg-', 'bg-').replace('-50', '-100')} rounded-full flex items-center justify-center mr-3`}>
                    <div className={feature.color}>{feature.icon}</div>
                  </div>
                  <div>
                    <h3 className={`font-semibold ${feature.color}`}>{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-800 mb-2">{feature.detail}</p>
                {feature.subDetails && feature.subDetails.length > 0 && (
                  <div className="space-y-1">
                    {feature.subDetails.map((subDetail, subIndex) => (
                      <div key={subIndex} className="text-xs text-gray-600 flex items-center">
                        <div className="w-1 h-1 bg-gray-400 rounded-full mr-2"></div>
                        {subDetail}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Statistics */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 transition-all duration-700 ${showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-white rounded-full mb-3 shadow-sm`}>
                  <div className={stat.color}>{stat.icon}</div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className={`flex flex-col sm:flex-row gap-3 justify-center transition-all duration-700 ${showActions ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <button
              onClick={onStartChat}
              className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Start AI Chat
            </button>
            <button
              onClick={onContinue}
              className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Continue to Dashboard
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
