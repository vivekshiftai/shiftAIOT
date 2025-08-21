import React, { useEffect, useState } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  Bot,
  Brain,
  MessageSquare,
  Settings,
  Clock,
  FileText
} from 'lucide-react';
import { DeviceStatsService, DeviceStats } from '../../services/deviceStatsService';

interface OnboardingResult {
  deviceId: string;
  deviceName: string;
  rulesGenerated: number;
  maintenanceItems: number;
  safetyPrecautions: number;
  processingTime: number;
  pdfFileName: string;
  deviceType?: string;
  manufacturer?: string;
  model?: string;
  location?: string;
  generatedRules?: Array<{
    name: string;
    description: string;
    priority: string;
  }>;
  maintenanceSchedule?: Array<{
    component: string;
    frequency: string;
    description: string;
  }>;
  safetyAlerts?: Array<{
    title: string;
    severity: string;
    description: string;
  }>;
}

interface OnboardingSuccessProps {
  result: OnboardingResult;
  onContinue: () => void;
  onClose: () => void;
}

export const OnboardingSuccess: React.FC<OnboardingSuccessProps> = ({ 
  result, 
  onContinue, 
  onClose 
}) => {
  const [animationPhase, setAnimationPhase] = useState<'initial' | 'complete'>('initial');
  const [deviceStats, setDeviceStats] = useState<DeviceStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Animation sequence
  useEffect(() => {
    const timer = setTimeout(() => setAnimationPhase('complete'), 500);
    return () => clearTimeout(timer);
  }, []);

  // Load real-time device statistics
  useEffect(() => {
    const loadDeviceStats = async () => {
      try {
        setIsLoadingStats(true);
        const stats = await DeviceStatsService.getDeviceStats(result.deviceId);
        setDeviceStats(stats);
      } catch (error) {
        console.error('Failed to load device stats:', error);
        // Use fallback data from result
        setDeviceStats({
          deviceId: result.deviceId,
          rulesCount: result.rulesGenerated,
          maintenanceCount: result.maintenanceItems,
          safetyCount: result.safetyPrecautions,
          totalItems: result.rulesGenerated + result.maintenanceItems + result.safetyPrecautions
        });
      } finally {
        setIsLoadingStats(false);
      }
    };

    if (result.deviceId) {
      loadDeviceStats();
    }
  }, [result.deviceId, result.rulesGenerated, result.maintenanceItems, result.safetyPrecautions]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[800px] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-800">✨ AI Machine Ready!</h2>
                <p className="text-green-600">You can now chat with {result.deviceName} like a human!</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-green-100 hover:bg-green-200 rounded-full flex items-center justify-center transition-colors"
            >
              <span className="text-green-600 text-lg">×</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Device Info Card */}
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Device Information
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-green-600 font-medium">Name:</span>
                    <p className="text-green-800 font-semibold">{result.deviceName}</p>
                  </div>
                  <div>
                    <span className="text-green-600 font-medium">Type:</span>
                    <p className="text-green-800 font-semibold">{result.deviceType || 'IoT Device'}</p>
                  </div>
                  <div>
                    <span className="text-green-600 font-medium">Manufacturer:</span>
                    <p className="text-green-800 font-semibold">{result.manufacturer || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-green-600 font-medium">Location:</span>
                    <p className="text-green-800 font-semibold">{result.location || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-green-600 font-medium">Processing Time:</span>
                    <p className="text-green-800 font-semibold">{result.processingTime}s</p>
                  </div>
                  <div>
                    <span className="text-green-600 font-medium">PDF File:</span>
                    <p className="text-green-800 font-semibold truncate">{result.pdfFileName}</p>
                  </div>
                </div>
              </div>

              {/* AI Capabilities */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                                 <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                   <Brain className="w-5 h-5" />
                   AI Capabilities
                 </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Natural Language Chat</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Intelligent Analysis</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Predictive Monitoring</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Settings className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Smart Automation</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Metrics Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200 text-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                                   <div className="text-2xl font-bold text-blue-800 mb-1">
                   {isLoadingStats ? '...' : (deviceStats?.rulesCount || result.rulesGenerated)}
                 </div>
                 <div className="text-sm font-medium text-blue-700">AI Rules</div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200 text-center">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                                   <div className="text-2xl font-bold text-orange-800 mb-1">
                   {isLoadingStats ? '...' : (deviceStats?.maintenanceCount || result.maintenanceItems)}
                 </div>
                 <div className="text-sm font-medium text-orange-700">Maintenance</div>
                </div>
                
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200 text-center">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                                   <div className="text-2xl font-bold text-red-800 mb-1">
                   {isLoadingStats ? '...' : (deviceStats?.safetyCount || result.safetyPrecautions)}
                 </div>
                 <div className="text-sm font-medium text-red-700">Safety Alerts</div>
                </div>
              </div>

              {/* AI Assistant Ready */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                <h3 className="text-lg font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  AI Assistant Ready
                </h3>
                <p className="text-emerald-700 text-sm mb-4">
                  Ask me anything about {result.deviceName}
                </p>
                <div className="bg-white rounded-lg p-3 border border-emerald-200">
                  <p className="text-sm text-gray-700">
                    Hello! I'm your AI assistant for {result.deviceName}. I can help you with setup, maintenance, troubleshooting, and technical questions. What would you like to know?
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Processing Summary
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                                     <div className="bg-white rounded-lg p-3 border border-green-200">
                     <span className="text-green-600 font-medium block">Total Items Generated:</span>
                     <span className="text-green-800 font-bold text-lg">
                       {isLoadingStats ? '...' : (deviceStats?.totalItems || result.rulesGenerated + result.maintenanceItems + result.safetyPrecautions)}
                     </span>
                   </div>
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <span className="text-green-600 font-medium block">Processing Time:</span>
                    <span className="text-green-800 font-bold text-lg">{result.processingTime}s</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-green-50 p-6 border-t border-green-200">
          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white text-green-700 border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={onContinue}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Start Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingSuccess;
