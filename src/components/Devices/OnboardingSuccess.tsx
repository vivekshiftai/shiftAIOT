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
  Play
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Device Onboarding Complete!</h1>
                <p className="text-green-100 text-lg">
                  {result.deviceName} is now ready for monitoring
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Success Summary */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              🎉 Successfully Onboarded!
            </h2>
            <p className="text-gray-600 text-lg">
              Your device has been configured with AI-generated rules and maintenance schedules.
            </p>
          </div>

          {/* Device Information */}
          <div className="bg-blue-50 rounded-xl p-6 mb-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">Device Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-700 font-medium">Device Name</p>
                <p className="text-blue-900 font-semibold">{result.deviceName}</p>
              </div>
              <div>
                <p className="text-sm text-blue-700 font-medium">Device ID</p>
                <p className="text-blue-900 font-semibold">{result.deviceId}</p>
              </div>
              <div>
                <p className="text-sm text-blue-700 font-medium">Documentation</p>
                <p className="text-blue-900 font-semibold">{result.pdfFileName}</p>
              </div>
              <div>
                <p className="text-sm text-blue-700 font-medium">Processing Time</p>
                <p className="text-blue-900 font-semibold">{result.processingTime.toFixed(1)} seconds</p>
              </div>
            </div>
          </div>

          {/* Generated Content Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* IoT Rules */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-purple-900">IoT Rules</h3>
                  <p className="text-purple-700 text-sm">Monitoring & Alerts</p>
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-900 mb-2">
                  {result.rulesGenerated}
                </div>
                <p className="text-purple-700 text-sm">Rules Generated</p>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-purple-700">
                  <Activity className="w-4 h-4" />
                  <span>Real-time monitoring</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-purple-700">
                  <Bell className="w-4 h-4" />
                  <span>Automated alerts</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-purple-700">
                  <Zap className="w-4 h-4" />
                  <span>Smart automation</span>
                </div>
              </div>
            </div>

            {/* Maintenance Schedule */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-orange-900">Maintenance</h3>
                  <p className="text-orange-700 text-sm">Preventive Tasks</p>
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-900 mb-2">
                  {result.maintenanceItems}
                </div>
                <p className="text-orange-700 text-sm">Items Scheduled</p>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-orange-700">
                  <Calendar className="w-4 h-4" />
                  <span>Regular intervals</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-orange-700">
                  <TrendingUp className="w-4 h-4" />
                  <span>Performance tracking</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-orange-700">
                  <Users className="w-4 h-4" />
                  <span>Team assignments</span>
                </div>
              </div>
            </div>

            {/* Safety Precautions */}
            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 border border-red-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-900">Safety</h3>
                  <p className="text-red-700 text-sm">Precautions & Warnings</p>
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-900 mb-2">
                  {result.safetyPrecautions}
                </div>
                <p className="text-red-700 text-sm">Precautions Identified</p>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-red-700">
                  <Shield className="w-4 h-4" />
                  <span>Safety protocols</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-red-700">
                  <Eye className="w-4 h-4" />
                  <span>Risk monitoring</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-red-700">
                  <Bell className="w-4 h-4" />
                  <span>Emergency alerts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-900">What's Next?</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Activity className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-900">Real-time Monitoring</p>
                    <p className="text-sm text-green-700">Monitor device performance and status</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-900">Analytics Dashboard</p>
                    <p className="text-sm text-green-700">View detailed analytics and insights</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Settings className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-900">Configure Rules</p>
                    <p className="text-sm text-green-700">Customize monitoring rules and alerts</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Database className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-900">Manage Maintenance</p>
                    <p className="text-sm text-green-700">Schedule and track maintenance tasks</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onContinue}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold text-lg"
            >
              <Play className="w-5 h-5" />
              Continue to Dashboard
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center gap-3 px-8 py-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-lg"
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
