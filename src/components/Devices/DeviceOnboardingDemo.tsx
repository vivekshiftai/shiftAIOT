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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Device Onboarding Demo</h1>
        <p className="text-gray-600">
          This is a standalone demo. It is not used in the main app routes and can be deleted if not needed.
        </p>
      </div>

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
      </div>

      {showOnboarding && (
        <EnhancedDeviceOnboardingForm
          onSubmit={handleOnboardingSubmit}
          onCancel={handleOnboardingCancel}
        />
      )}
    </div>
  );
};

