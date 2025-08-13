import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { EnhancedDeviceOnboardingForm } from './EnhancedDeviceOnboardingForm';

interface OnboardingResult {
  deviceId: string;
  deviceName: string;
  rulesGenerated: number;
  maintenanceItems: number;
  safetyPrecautions: number;
  processingTime: number;
  pdfFileName: string;
}

export const DeviceOnboardingDemo: React.FC = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingResults, setOnboardingResults] = useState<OnboardingResult[]>([]);

  const handleOnboardingSubmit = (result: OnboardingResult) => {
    setOnboardingResults(prev => [...prev, result]);
    setShowOnboarding(false);
  };

  const handleOnboardingCancel = () => {
    setShowOnboarding(false);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Device Onboarding Demo</h1>
        <p className="text-gray-600">
          Experience the enhanced 3-step device onboarding process with AI-powered rule generation
        </p>
      </div>

      {/* Demo Controls */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Enhanced Onboarding Flow</h2>
            <p className="text-gray-600">
              Test the complete device onboarding process with PDF processing and AI rule generation
            </p>
          </div>
          <button
            onClick={() => setShowOnboarding(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            <Plus className="w-5 h-5" />
            Start Onboarding Demo
          </button>
        </div>

        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Step 1: Device Information</h3>
            <p className="text-blue-700 text-sm">
              Collect device details, specifications, and connection settings with comprehensive form validation.
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-2">Step 2: PDF Processing</h3>
            <p className="text-purple-700 text-sm">
              Upload device documentation for AI analysis using MinerU technology to extract specifications.
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">Step 3: Rules Generation</h3>
            <p className="text-green-700 text-sm">
              Automatically generate IoT rules, maintenance schedules, and safety precautions from documentation.
            </p>
          </div>
        </div>
      </div>

      {/* Onboarding Results */}
      {onboardingResults.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Onboarding Results</h2>
          <div className="space-y-4">
            {onboardingResults.map((result, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{result.deviceName}</h3>
                  <span className="text-sm text-gray-500">ID: {result.deviceId}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Rules Generated:</span>
                    <span className="font-semibold text-purple-600 ml-2">{result.rulesGenerated}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Maintenance Items:</span>
                    <span className="font-semibold text-orange-600 ml-2">{result.maintenanceItems}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Safety Precautions:</span>
                    <span className="font-semibold text-red-600 ml-2">{result.safetyPrecautions}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Processing Time:</span>
                    <span className="font-semibold text-green-600 ml-2">{result.processingTime.toFixed(1)}s</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Document: {result.pdfFileName}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Onboarding Form */}
      {showOnboarding && (
        <EnhancedDeviceOnboardingForm
          onSubmit={handleOnboardingSubmit}
          onCancel={handleOnboardingCancel}
        />
      )}
    </div>
  );
};

