import React, { useState } from 'react';
import { DeviceOnboardingForm } from './DeviceOnboardingForm';
import { DeviceOnboardingLoader } from '../Loading/DeviceOnboardingLoader';
import { DeviceOnboardingSuccess } from './DeviceOnboardingSuccess';
import { DeviceChatInterface } from './DeviceChatInterface';
import { 
  Plus, 
  FileText, 
  Target, 
  Brain, 
  MessageSquare,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

interface DeviceOnboardingDemoProps {
  onClose?: () => void;
}

export const DeviceOnboardingDemo: React.FC<DeviceOnboardingDemoProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState<'form' | 'loading' | 'success' | 'chat'>('form');
  const [deviceData, setDeviceData] = useState<any>(null);
  const [pdfFileName, setPdfFileName] = useState<string>('');
  const [processingDetails, setProcessingDetails] = useState<any>(null);

  const handleFormSubmit = async (formData: any, uploadedFile: any) => {
    setDeviceData(formData);
    setPdfFileName(uploadedFile?.file?.name || '');
    setProcessingDetails(formData.pdfResults);
    setCurrentStep('loading');
    
    // Simulate the three-stage process
    setTimeout(() => {
      setCurrentStep('success');
    }, 8000); // 8 seconds to simulate the full process
  };

  const handleSuccessContinue = () => {
    setCurrentStep('chat');
  };

  const handleStartChat = () => {
    setCurrentStep('chat');
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const resetDemo = () => {
    setCurrentStep('form');
    setDeviceData(null);
    setPdfFileName('');
    setProcessingDetails(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">Device Onboarding Demo</h1>
              <p className="text-blue-100">Complete IoT device onboarding with AI-powered intelligence</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={resetDemo}
                className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors text-sm"
              >
                Reset Demo
              </button>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="mt-4">
            <div className="flex items-center justify-center space-x-8">
              <div className={`flex items-center space-x-2 ${currentStep === 'form' ? 'text-white' : 'text-blue-200'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'form' ? 'bg-white text-blue-600' : 'bg-blue-200 text-blue-600'}`}>
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Setup</span>
              </div>
              <div className={`flex items-center space-x-2 ${currentStep === 'loading' ? 'text-white' : currentStep === 'success' || currentStep === 'chat' ? 'text-white' : 'text-blue-200'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'loading' ? 'bg-white text-blue-600' : currentStep === 'success' || currentStep === 'chat' ? 'bg-white text-blue-600' : 'bg-blue-200 text-blue-600'}`}>
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Processing</span>
              </div>
              <div className={`flex items-center space-x-2 ${currentStep === 'success' ? 'text-white' : currentStep === 'chat' ? 'text-white' : 'text-blue-200'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'success' ? 'bg-white text-blue-600' : currentStep === 'chat' ? 'bg-white text-blue-600' : 'bg-blue-200 text-blue-600'}`}>
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Complete</span>
              </div>
              <div className={`flex items-center space-x-2 ${currentStep === 'chat' ? 'text-white' : 'text-blue-200'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'chat' ? 'bg-white text-blue-600' : 'bg-blue-200 text-blue-600'}`}>
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Chat</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {currentStep === 'form' && (
            <div className="h-full">
              <DeviceOnboardingForm
                onSubmit={handleFormSubmit}
                onCancel={handleClose}
                isDemo={true}
              />
            </div>
          )}

          {currentStep === 'loading' && (
            <div className="h-full">
              <DeviceOnboardingLoader
                isProcessing={true}
                currentProcess="pdf"
                progress={0}
                onComplete={() => setCurrentStep('success')}
                pdfFileName={pdfFileName}
                currentSubStage="Starting PDF processing..."
                subStageProgress={0}
              />
            </div>
          )}

          {currentStep === 'success' && deviceData && (
            <div className="h-full">
              <DeviceOnboardingSuccess
                deviceName={deviceData.deviceName}
                pdfFileName={pdfFileName}
                rulesCount={deviceData.pdfResults?.iot_rules?.length || 0}
                maintenanceCount={deviceData.pdfResults?.maintenance_data?.length || 0}
                safetyCount={deviceData.pdfResults?.safety_precautions?.length || 0}
                processingDetails={processingDetails}
                onContinue={handleSuccessContinue}
                onStartChat={handleStartChat}
                onClose={handleClose}
              />
            </div>
          )}

          {currentStep === 'chat' && deviceData && (
            <div className="h-full p-4">
              <DeviceChatInterface
                deviceId={deviceData.deviceId}
                deviceName={deviceData.deviceName}
                pdfFileName={pdfFileName}
                deviceType={deviceData.productId}
                manufacturer=""
                model={deviceData.productId}
                onClose={handleClose}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

