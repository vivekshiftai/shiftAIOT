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
  CheckCircle2
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
}

export const DeviceOnboardingSuccess: React.FC<DeviceOnboardingSuccessProps> = ({
  deviceName,
  pdfFileName,
  rulesCount,
  maintenanceCount,
  safetyCount,
  onContinue,
  onStartChat,
  onClose
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
      detail: pdfFileName ? `File: ${pdfFileName}` : 'Documentation processed'
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: `${rulesCount} IoT Rules Generated`,
      description: 'Intelligent monitoring and automation rules',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      detail: `${rulesCount} rules created for device monitoring`
    },
    {
      icon: <Brain className="w-5 h-5" />,
      title: 'AI Knowledge Base Created',
      description: 'Ready for intelligent device queries',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      detail: 'Vector embeddings and search index ready'
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
      value: '~3 min',
      icon: <Clock className="w-4 h-4" />,
      color: 'text-gray-600'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`bg-white rounded-3xl p-8 shadow-2xl max-w-2xl w-full text-center transform transition-all duration-700 ${
        showAnimation ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        {/* Success Icon with Animation */}
        <div className="mb-6">
          <div className={`inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4 transform transition-all duration-700 ${
            showAnimation ? 'scale-100 rotate-0' : 'scale-0 rotate-180'
          }`}>
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎉 Device Onboarding Complete!
          </h1>
          <p className="text-lg text-gray-600">
            Your IoT device <strong>"{deviceName}"</strong> has been successfully onboarded with AI-powered intelligence.
          </p>
        </div>

        {/* Features Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 transform transition-all duration-700 delay-300 ${
          showDetails ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          {features.map((feature, index) => (
            <div key={index} className={`p-4 rounded-xl border transition-all duration-300 hover:shadow-lg ${
              feature.bgColor
            } border-gray-200`}>
              <div className={`flex items-center justify-center w-10 h-10 ${feature.bgColor.replace('bg-', 'bg-').replace('-50', '-100')} rounded-full mb-3 mx-auto`}>
                <div className={feature.color}>
                  {feature.icon}
                </div>
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">{feature.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
              <p className="text-xs text-gray-500 font-medium">{feature.detail}</p>
            </div>
          ))}
        </div>

        {/* Statistics */}
        <div className={`mb-6 transform transition-all duration-700 delay-500 ${
          showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Processing Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className={`flex items-center justify-center w-8 h-8 ${stat.color.replace('text-', 'bg-').replace('-600', '-100')} rounded-full mb-2 mx-auto`}>
                    <div className={stat.color}>
                      {stat.icon}
                    </div>
                  </div>
                  <div className="text-lg font-bold text-gray-800">{stat.value}</div>
                  <div className="text-xs text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`flex flex-col sm:flex-row gap-3 transform transition-all duration-700 delay-700 ${
          showActions ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <button
            onClick={onStartChat}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            <MessageSquare className="w-4 h-4" />
            Start AI Chat
          </button>
          <button
            onClick={onContinue}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            <ArrowRight className="w-4 h-4" />
            Continue to Dashboard
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <span className="sr-only">Close</span>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};
