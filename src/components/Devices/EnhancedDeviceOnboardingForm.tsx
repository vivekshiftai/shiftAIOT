import React, { useState, useCallback, useEffect } from 'react';
import { Trash2, Upload, FileText, Settings, Bot, CheckCircle, AlertTriangle, MessageSquare, Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import { onboardingService, OnboardingProgress } from '../../services/onboardingService';
import { deviceAPI, ruleAPI, knowledgeAPI } from '../../services/api';
import EnhancedOnboardingLoader from '../Loading/EnhancedOnboardingLoader';
import { DeviceChatInterface } from './DeviceChatInterface';
import { OnboardingSuccess } from './OnboardingSuccess';
import { getApiConfig } from '../../config/api';

interface DeviceFormData {
  deviceName: string;
  location: string;
  manufacturer: string;
  connectionType: 'MQTT' | 'HTTP' | 'COAP';
  
  // MQTT specific fields
  brokerUrl?: string;
  topic?: string;
  username?: string;
  password?: string;
  
  // HTTP specific fields
  httpEndpoint?: string;
  httpMethod?: string;
  httpHeaders?: string;
  
  // COAP specific fields
  coapHost?: string;
  coapPort?: string;
  coapPath?: string;
}

interface FileUpload {
  file: File;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

interface EnhancedDeviceOnboardingFormProps {
  onSubmit: (deviceData: DeviceFormData, file: FileUpload | null) => Promise<void>;
  onCancel: () => void;
}

type Step = 1 | 2 | 3;

export const EnhancedDeviceOnboardingForm: React.FC<EnhancedDeviceOnboardingFormProps> = ({ 
  onSubmit, 
  onCancel 
}) => {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState<DeviceFormData>({
    deviceName: '',
    location: '',
    manufacturer: '',
    connectionType: 'MQTT',
    brokerUrl: '',
    topic: '',
    username: '',
    password: '',
    httpEndpoint: '',
    httpMethod: 'GET',
    httpHeaders: '',
    coapHost: '',
    coapPort: '',
    coapPath: ''
  });

  const [uploadedFile, setUploadedFile] = useState<FileUpload | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showOnboardingLoader, setShowOnboardingLoader] = useState(false);
  const [showChatInterface, setShowChatInterface] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [onboardingResult, setOnboardingResult] = useState<any>(null);

  // Progress tracking states
  const [currentProcess, setCurrentProcess] = useState<'pdf' | 'rules' | 'knowledgebase'>('pdf');
  const [progress, setProgress] = useState(0);
  const [currentSubStage, setCurrentSubStage] = useState('');
  const [onboardingStartTime, setOnboardingStartTime] = useState<number>(0);

  const handleInputChange = (field: keyof DeviceFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step: Step): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.deviceName.trim()) newErrors.deviceName = 'Device name is required';
      if (!formData.location.trim()) newErrors.location = 'Location is required';
      if (!formData.manufacturer.trim()) newErrors.manufacturer = 'Manufacturer is required';
    }

    if (step === 2) {
      if (formData.connectionType === 'MQTT') {
        if (!formData.brokerUrl?.trim()) newErrors.brokerUrl = 'Broker URL is required';
        if (!formData.topic?.trim()) newErrors.topic = 'Topic is required';
      } else if (formData.connectionType === 'HTTP') {
        if (!formData.httpEndpoint?.trim()) newErrors.httpEndpoint = 'Endpoint URL is required';
      } else if (formData.connectionType === 'COAP') {
        if (!formData.coapHost?.trim()) newErrors.coapHost = 'Host is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep(prev => (prev + 1) as Step);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => (prev - 1) as Step);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile({
        file,
        status: 'uploading'
      });
    }
  };

  const startOnboardingProcess = useCallback(async () => {
    if (!uploadedFile?.file) return;

    setShowOnboardingLoader(true);
    setOnboardingStartTime(Date.now());
    setProgress(0);
    setCurrentProcess('pdf');

    try {
      // Use the new onboarding service
      const result = await onboardingService.completeOnboarding(
        formData,
        uploadedFile.file,
        (progress: OnboardingProgress) => {
          setProgress(progress.progress);
          setCurrentSubStage(progress.message);
          if (progress.subMessage) {
            console.log(progress.subMessage);
          }
          
          // Update current process based on stage
          switch (progress.stage) {
            case 'upload':
              setCurrentProcess('pdf');
              break;
            case 'device':
              setCurrentProcess('rules');
              break;
            case 'rules':
              setCurrentProcess('rules');
              break;
            case 'maintenance':
              setCurrentProcess('rules');
              break;
            case 'safety':
              setCurrentProcess('rules');
              break;
            case 'knowledge':
              setCurrentProcess('knowledgebase');
              break;
            case 'complete':
              setCurrentProcess('knowledgebase');
              break;
          }
        }
      );

      // Set success result
      setOnboardingResult(result);

      setTimeout(() => {
        setShowOnboardingLoader(false);
        setShowSuccessMessage(true);
      }, 1000);

    } catch (error) {
      console.error('Onboarding process failed:', error);
      setShowOnboardingLoader(false);
      
      // Show error message to user
      alert(`Onboarding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [uploadedFile, formData]);

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    if (currentStep === 3 && uploadedFile) {
      await startOnboardingProcess();
    } else if (currentStep < 3) {
      nextStep();
    }
  };

  // Handle success continue - close onboarding and show chat
  const handleSuccessContinue = () => {
    setShowSuccessMessage(false);
    setShowChatInterface(true);
  };

  // Handle chat close - close everything and return to devices list
  const handleChatClose = () => {
    setShowChatInterface(false);
    setShowSuccessMessage(false);
    onCancel(); // Close the entire onboarding form
  };

  const renderStep1 = useCallback(() => (
    <div className="space-y-6 animate-fadeIn">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Settings className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2">Basic Device Information</h3>
        <p className="text-slate-600">Enter the essential details about your device</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Device Name *
          </label>
          <input
            type="text"
            value={formData.deviceName}
            onChange={(e) => handleInputChange('deviceName', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
              errors.deviceName ? 'border-red-300' : 'border-slate-300'
            }`}
            placeholder="e.g., Temperature Sensor 001"
          />
          {errors.deviceName && (
            <p className="text-red-500 text-sm mt-1">{errors.deviceName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Location *
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
              errors.location ? 'border-red-300' : 'border-slate-300'
            }`}
            placeholder="e.g., Building A, Floor 2, Room 205"
          />
          {errors.location && (
            <p className="text-red-500 text-sm mt-1">{errors.location}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Manufacturer *
          </label>
          <input
            type="text"
            value={formData.manufacturer}
            onChange={(e) => handleInputChange('manufacturer', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
              errors.manufacturer ? 'border-red-300' : 'border-slate-300'
            }`}
            placeholder="e.g., Siemens, Schneider Electric"
          />
          {errors.manufacturer && (
            <p className="text-red-500 text-sm mt-1">{errors.manufacturer}</p>
          )}
        </div>
      </div>
    </div>
  ), [formData.deviceName, formData.location, formData.manufacturer, errors, handleInputChange]);

  const renderStep2 = useCallback(() => (
    <div className="space-y-6 animate-fadeIn">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bot className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2">Connection Settings</h3>
        <p className="text-slate-600">Configure how your device will communicate</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Connection Type *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['MQTT', 'HTTP', 'COAP'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleInputChange('connectionType', type)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formData.connectionType === type
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg font-semibold">{type}</div>
                  <div className="text-xs text-slate-500">
                    {type === 'MQTT' && 'Message Queue'}
                    {type === 'HTTP' && 'REST API'}
                    {type === 'COAP' && 'Constrained Application'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* MQTT Fields */}
        {formData.connectionType === 'MQTT' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Broker URL *
              </label>
              <input
                type="text"
                value={formData.brokerUrl || ''}
                onChange={(e) => handleInputChange('brokerUrl', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  errors.brokerUrl ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="e.g., mqtt://broker.example.com:1883"
              />
              {errors.brokerUrl && (
                <p className="text-red-500 text-sm mt-1">{errors.brokerUrl}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Topic *
              </label>
              <input
                type="text"
                value={formData.topic || ''}
                onChange={(e) => handleInputChange('topic', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  errors.topic ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="e.g., device/sensor001/data"
              />
              {errors.topic && (
                <p className="text-red-500 text-sm mt-1">{errors.topic}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username || ''}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password || ''}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>
        )}

        {/* HTTP Fields */}
        {formData.connectionType === 'HTTP' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Endpoint URL *
              </label>
              <input
                type="text"
                value={formData.httpEndpoint || ''}
                onChange={(e) => handleInputChange('httpEndpoint', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  errors.httpEndpoint ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="e.g., https://api.example.com/device/data"
              />
              {errors.httpEndpoint && (
                <p className="text-red-500 text-sm mt-1">{errors.httpEndpoint}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  HTTP Method
                </label>
                <select
                  value={formData.httpMethod || 'GET'}
                  onChange={(e) => handleInputChange('httpMethod', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Headers (JSON)
                </label>
                <input
                  type="text"
                  value={formData.httpHeaders || ''}
                  onChange={(e) => handleInputChange('httpHeaders', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder='{"Content-Type": "application/json"}'
                />
              </div>
            </div>
          </div>
        )}

        {/* COAP Fields */}
        {formData.connectionType === 'COAP' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Host *
              </label>
              <input
                type="text"
                value={formData.coapHost || ''}
                onChange={(e) => handleInputChange('coapHost', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  errors.coapHost ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="e.g., coap.example.com"
              />
              {errors.coapHost && (
                <p className="text-red-500 text-sm mt-1">{errors.coapHost}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Port
                </label>
                <input
                  type="text"
                  value={formData.coapPort || ''}
                  onChange={(e) => handleInputChange('coapPort', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="5683"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Path
                </label>
                <input
                  type="text"
                  value={formData.coapPath || ''}
                  onChange={(e) => handleInputChange('coapPath', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="/device/data"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  ), [formData.connectionType, formData.brokerUrl, formData.topic, formData.username, formData.password, formData.httpEndpoint, formData.httpMethod, formData.httpHeaders, formData.coapHost, formData.coapPort, formData.coapPath, errors, handleInputChange]);

  const renderStep3 = useCallback(() => (
    <div className="space-y-6 animate-fadeIn">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2">Upload Device Documentation</h3>
        <p className="text-slate-600">Upload a PDF to automatically configure your device</p>
      </div>

      <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-700 mb-2">
            {uploadedFile ? uploadedFile.file.name : 'Click to upload PDF'}
          </p>
          <p className="text-sm text-slate-500">
            {uploadedFile ? 'File uploaded successfully' : 'Upload device manual, datasheet, or documentation'}
          </p>
        </label>
      </div>

      {uploadedFile && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-green-800 font-medium">File uploaded successfully</span>
          </div>
        </div>
      )}
    </div>
  ), [uploadedFile, handleFileUpload]);

  const renderProgressBar = useCallback(() => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
            currentStep >= step 
              ? 'bg-blue-500 border-blue-500 text-white' 
              : 'bg-white border-slate-300 text-slate-400'
          }`}>
            {currentStep > step ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <span className="text-sm font-medium">{step}</span>
            )}
          </div>
          {step < 3 && (
            <div className={`w-16 h-1 transition-all duration-300 ${
              currentStep > step ? 'bg-blue-500' : 'bg-slate-300'
            }`} />
          )}
        </div>
      ))}
    </div>
  ), [currentStep]);

  // Render loading screen within the modal
  const renderLoadingContent = useCallback(() => (
    <div className="flex-1 flex items-center justify-center p-6">
      <EnhancedOnboardingLoader
        isProcessing={true}
        currentProcess={currentProcess}
        progress={progress}
        onComplete={() => {}}
        pdfFileName={uploadedFile?.file.name}
        currentSubStage={currentSubStage}
      />
    </div>
  ), [currentProcess, progress, uploadedFile?.file.name, currentSubStage]);

  // Render success message within the modal
  const renderSuccessContent = useCallback(() => (
    <div className="flex-1 flex items-center justify-center p-4">
      <OnboardingSuccess
        result={{
          deviceId: onboardingResult?.deviceId || 'DEV-001',
          deviceName: formData.deviceName,
          rulesGenerated: onboardingResult?.rulesGenerated || 5,
          maintenanceItems: onboardingResult?.maintenanceItems || 3,
          safetyPrecautions: onboardingResult?.safetyPrecautions || 2,
          processingTime: onboardingStartTime ? Math.round((Date.now() - onboardingStartTime) / 1000) : 0,
          pdfFileName: uploadedFile?.file.name || 'device_documentation.pdf'
        }}
        onContinue={handleSuccessContinue}
        onClose={handleChatClose}
      />
    </div>
  ), [onboardingResult, formData.deviceName, onboardingStartTime, uploadedFile?.file.name, handleSuccessContinue, handleChatClose]);

  // Render chat interface as separate modal
  const renderChatContent = useCallback(() => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] overflow-hidden">
        <DeviceChatInterface
          deviceName={formData.deviceName}
          pdfFileName={uploadedFile?.file.name || 'device_documentation.pdf'}
          onClose={handleChatClose}
          onContinue={handleChatClose}
        />
      </div>
    </div>
  ), [formData.deviceName, uploadedFile?.file.name, handleChatClose]);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  {showOnboardingLoader ? 'Processing Device...' : 
                   showSuccessMessage ? 'Onboarding Complete!' :
                   'Device Onboarding'}
                </h2>
                <p className="text-purple-100 mt-1">
                  {showOnboardingLoader 
                    ? 'Please wait while we process your device documentation' 
                    : showSuccessMessage
                    ? 'Your device has been successfully onboarded'
                    : 'Enter basic device information and specifications'
                  }
                </p>
              </div>
              {!showOnboardingLoader && !showSuccessMessage && (
                <button
                  onClick={onCancel}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
            {renderProgressBar()}
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            {showOnboardingLoader ? (
              renderLoadingContent()
            ) : showSuccessMessage ? (
              renderSuccessContent()
            ) : (
              <>
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
              </>
            )}
          </div>

          {/* Footer - Hidden during loading and success */}
          {!showOnboardingLoader && !showSuccessMessage && (
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex-shrink-0">
              <div className="flex justify-between items-center">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>
                
                <div className="flex gap-2">
                  <button
                    onClick={onCancel}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  
                  <button
                    onClick={currentStep === 3 ? handleSubmit : nextStep}
                    disabled={isSubmitting || (currentStep === 3 && !uploadedFile) || !validateStep(currentStep)}
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    {currentStep === 3 ? 'Complete Onboarding' : 'Next'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Interface Modal - Separate from onboarding */}
      {showChatInterface && renderChatContent()}
    </>
  );
};
