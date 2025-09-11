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
import { logError } from '../../utils/logger';

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
  const [deviceStats, setDeviceStats] = useState<DeviceStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Load real-time device statistics with a delay to avoid race conditions
  useEffect(() => {
    const loadDeviceStats = async () => {
      try {
        setIsLoadingStats(true);
        
        // Add a small delay to ensure the device is fully created and accessible
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log(`🔧 OnboardingSuccess: Loading device stats for device ${result.deviceId}`);
        const stats = await DeviceStatsService.getDeviceStats(result.deviceId);
        console.log(`🔧 OnboardingSuccess: Device stats loaded:`, stats);
        setDeviceStats(stats);
      } catch (error) {
        logError('OnboardingSuccess', 'Failed to load device stats', error instanceof Error ? error : new Error('Unknown error'));
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
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 p-3 sm:p-4 border-b border-pink-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">✨ AI Device Ready!</h2>
                <p className="text-pink-100 text-xs sm:text-sm">You can now chat with {result.deviceName} like a human!</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            >
              <span className="text-lg font-bold text-white">×</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
          <div className="space-y-3 sm:space-y-4">
              {/* Device Info Card */}
              <div className="bg-pink-50 rounded-lg p-3 border border-pink-200">
              <h3 className="text-sm sm:text-base font-semibold text-pink-800 mb-2 flex items-center gap-2">
                <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                  Device Information
                </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                  <div>
                    <span className="text-pink-600 font-medium">Name:</span>
                  <p className="text-pink-800 font-semibold truncate">{result.deviceName}</p>
                  </div>
                  <div>
                    <span className="text-pink-600 font-medium">Type:</span>
                    <p className="text-pink-800 font-semibold">{result.deviceType || 'Smart Asset'}</p>
                  </div>
                  <div>
                    <span className="text-pink-600 font-medium">Processing Time:</span>
                    <p className="text-pink-800 font-semibold">{result.processingTime}s</p>
                  </div>
                  <div>
                    <span className="text-pink-600 font-medium">PDF File:</span>
                    <p className="text-pink-800 font-semibold truncate">{result.pdfFileName}</p>
                  </div>
                </div>
              </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-2 sm:p-3 border border-blue-200 text-center">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-1 sm:mb-2">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                <div className="text-sm sm:text-lg font-bold text-blue-800 mb-1">
                  {isLoadingStats ? '...' : (deviceStats?.rulesCount || result.rulesGenerated)}
                  </div>
                <div className="text-xs font-medium text-blue-700">AI Rules</div>
                    </div>
              
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-2 sm:p-3 border border-orange-200 text-center">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-1 sm:mb-2">
                  <Settings className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                <div className="text-sm sm:text-lg font-bold text-orange-800 mb-1">
                  {isLoadingStats ? '...' : (deviceStats?.maintenanceCount || result.maintenanceItems)}
                    </div>
                <div className="text-xs font-medium text-orange-700">Maintenance</div>
                  </div>
              
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-2 sm:p-3 border border-red-200 text-center">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-1 sm:mb-2">
                  <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                <div className="text-sm sm:text-lg font-bold text-red-800 mb-1">
                  {isLoadingStats ? '...' : (deviceStats?.safetyCount || result.safetyPrecautions)}
                </div>
                <div className="text-xs font-medium text-red-700">Safety Alerts</div>
              </div>
            </div>

            {/* AI Capabilities */}
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-3 border border-pink-200">
              <h3 className="text-sm sm:text-base font-semibold text-pink-800 mb-2 flex items-center gap-2">
                <Brain className="w-3 h-3 sm:w-4 sm:h-4" />
                AI Capabilities
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white rounded-lg p-2 border border-pink-200">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="w-3 h-3 text-pink-600" />
                    <span className="text-xs font-medium text-pink-700">Natural Language Chat</span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-2 border border-pink-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="w-3 h-3 text-pink-600" />
                    <span className="text-xs font-medium text-pink-700">Intelligent Analysis</span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-2 border border-pink-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-3 h-3 text-pink-600" />
                    <span className="text-xs font-medium text-pink-700">Predictive Monitoring</span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-2 border border-pink-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Settings className="w-3 h-3 text-pink-600" />
                    <span className="text-xs font-medium text-pink-700">Smart Automation</span>
                 </div>
                </div>
                </div>
              </div>

              {/* AI Assistant Ready */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200">
              <h3 className="text-sm sm:text-base font-semibold text-purple-800 mb-2 flex items-center gap-2">
                <Bot className="w-3 h-3 sm:w-4 sm:h-4" />
                  AI Assistant Ready
                </h3>
              <p className="text-purple-700 text-xs sm:text-sm mb-2">
                  Ask me anything about {result.deviceName}
                </p>
                <div className="bg-white rounded-lg p-2 border border-purple-200">
                  <p className="text-xs sm:text-sm text-gray-700">
                    Hello! I'm your AI assistant for {result.deviceName}. I can help you with setup, maintenance, troubleshooting, and technical questions. What would you like to know?
                  </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-pink-50 p-3 sm:p-4 border-t border-pink-200">
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
            <button
              onClick={onClose}
              className="px-3 sm:px-4 py-2 bg-white text-pink-700 border border-pink-300 rounded-lg hover:bg-pink-50 transition-colors text-xs sm:text-sm"
            >
              Close
            </button>
            <button
              onClick={onContinue}
              className="px-3 sm:px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
              Start Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingSuccess;
