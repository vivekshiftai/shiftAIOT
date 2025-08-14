import React from 'react';
import { 
  CheckCircle, 
  Target, 
  Wrench, 
  AlertTriangle, 
  FileText, 
  Clock, 
  X,
  ArrowRight,
  Settings,
  Activity,
  Database,
  Network,
  Zap,
  Shield,
  BarChart3,
  Calendar,
  TrendingUp,
  Users,
  Bell,
  Eye,
  Play,
  Sparkles,
  Rocket
} from 'lucide-react';

interface OnboardingResult {
  deviceId: string;
  deviceName: string;
  rulesGenerated: number;
  maintenanceItems: number;
  safetyPrecautions: number;
  processingTime: number;
  pdfFileName: string;
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
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-8 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold mb-2">🎉 Success!</h1>
          <p className="text-green-100 text-lg">
            {result.deviceName} is now ready for intelligent monitoring
          </p>
        </div>

        <div className="p-8">
          {/* Quick Summary */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Your device is now AI-powered!
            </h2>
            <p className="text-gray-600">
              I've analyzed your documentation and set up intelligent monitoring for {result.deviceName}
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-900">{result.rulesGenerated}</div>
              <div className="text-sm text-blue-700">Rules Created</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-xl">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Wrench className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-orange-900">{result.maintenanceItems}</div>
              <div className="text-sm text-orange-700">Maintenance Tasks</div>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-900">{result.safetyPrecautions}</div>
              <div className="text-sm text-red-700">Safety Alerts</div>
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Rocket className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-900">Ready to Go!</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-600" />
                <span className="text-green-800">Real-time monitoring is active</span>
              </div>
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-green-600" />
                <span className="text-green-800">Smart alerts are configured</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-green-600" />
                <span className="text-green-800">Analytics dashboard ready</span>
              </div>
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-green-600" />
                <span className="text-green-800">AI assistant available</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onContinue}
              className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold text-lg"
            >
              <Sparkles className="w-5 h-5" />
              Go to Dashboard
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center gap-3 px-6 py-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
            >
              <X className="w-5 h-5" />
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
