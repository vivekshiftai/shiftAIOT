import React, { useState, useCallback, useEffect } from 'react';
import { Upload, FileText, Settings, Bot, CheckCircle, AlertTriangle, MessageSquare, Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import { onboardingService, OnboardingProgress } from '../../services/onboardingService';
import { deviceAPI, ruleAPI, knowledgeAPI } from '../../services/api';
import EnhancedOnboardingLoader from '../Loading/EnhancedOnboardingLoader';
import { DeviceChatInterface } from './DeviceChatInterface';
import { OnboardingSuccess } from './OnboardingSuccess';
import { getApiConfig } from '../../config/api';
import { logInfo, logError } from '../../utils/logger';

interface DeviceFormData {
  deviceName: string;
  location: string;
  manufacturer: string;
  deviceStatus: 'ONLINE' | 'OFFLINE' | 'WARNING' | 'ERROR';
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
    deviceStatus: 'OFFLINE',
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

  const handleInputChange = useCallback((field: keyof DeviceFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field if it exists
    setErrors(prev => {
      if (prev[field]) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return prev;
    });
  }, []); // Remove errors dependency to prevent infinite re-renders

  const validateStep = useCallback((step: Step): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.deviceName.trim()) newErrors.deviceName = 'Device name is required';
      if (!formData.location.trim()) newErrors.location = 'Location is required';
      if (!formData.manufacturer.trim()) newErrors.manufacturer = 'Manufacturer is required';
      if (!formData.deviceStatus) newErrors.deviceStatus = 'Device status is required';
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
  }, [formData.deviceName, formData.location, formData.manufacturer, formData.connectionType, formData.brokerUrl, formData.topic, formData.httpEndpoint, formData.coapHost]); // Specific dependencies instead of entire formData object

  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep(prev => (prev + 1) as Step);
      }
    }
  }, [currentStep, validateStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => (prev - 1) as Step);
    }
  }, [currentStep]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile({
        file,
        status: 'uploading'
      });
    }
  }, []);

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
            logInfo('Onboarding', progress.subMessage);
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
      logError('Onboarding', 'Onboarding process failed', error instanceof Error ? error : new Error('Unknown error'));
      setShowOnboardingLoader(false);
      
      // Show error message to user
      alert(`Onboarding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [uploadedFile, formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateStep(currentStep)) return;

    if (currentStep === 3 && uploadedFile) {
      await startOnboardingProcess();
    } else if (currentStep < 3) {
      nextStep();
    }
  }, [currentStep, uploadedFile, validateStep, startOnboardingProcess, nextStep]);

  // Handle success continue - close onboarding and show chat
  const handleSuccessContinue = useCallback(() => {
    setShowSuccessMessage(false);
    setShowChatInterface(true);
  }, []);

  // Handle chat close - close everything and return to devices list
  const handleChatClose = useCallback(() => {
    setShowChatInterface(false);
    setShowSuccessMessage(false);
    onCancel(); // Close the entire onboarding form
  }, [onCancel]);

  const renderStep1 = useCallback(() => (
    <div className="w-3/5 mx-auto h-3/4 flex flex-col justify-center animate-fadeIn">
      {/* Enhanced Header with Glassmorphism */}
      <div className="text-center mb-8 p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Settings className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">Basic Device Information</h3>
        <p className="text-white/80 text-lg">Enter the essential details about your device</p>
      </div>

      {/* Form Container with Glassmorphism */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-xl">
        {/* First Row - Device Name and Location */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-white mb-2">
              Device Name *
            </label>
            <input
              type="text"
              value={formData.deviceName}
              onChange={(e) => handleInputChange('deviceName', e.target.value)}
              className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all duration-300 bg-white/20 backdrop-blur-sm text-white placeholder-white/60 ${
                errors.deviceName ? 'border-red-400' : 'border-white/30'
              }`}
              placeholder="e.g., Temperature Sensor 001"
            />
            {errors.deviceName && (
              <p className="text-red-300 text-sm mt-1">{errors.deviceName}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-white mb-2">
              Location *
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all duration-300 bg-white/20 backdrop-blur-sm text-white placeholder-white/60 ${
                errors.location ? 'border-red-400' : 'border-white/30'
              }`}
              placeholder="e.g., Building A, Floor 2, Room 205"
            />
            {errors.location && (
              <p className="text-red-300 text-sm mt-1">{errors.location}</p>
            )}
          </div>
        </div>

        {/* Second Row - Manufacturer and Device Status */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-white mb-2">
              Manufacturer *
            </label>
            <input
              type="text"
              value={formData.manufacturer}
              onChange={(e) => handleInputChange('manufacturer', e.target.value)}
              className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all duration-300 bg-white/20 backdrop-blur-sm text-white placeholder-white/60 ${
                errors.manufacturer ? 'border-red-400' : 'border-white/30'
              }`}
              placeholder="e.g., Siemens, Schneider Electric"
            />
            {errors.manufacturer && (
              <p className="text-red-300 text-sm mt-1">{errors.manufacturer}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-white mb-2">
              Device Status *
            </label>
            <select
              value={formData.deviceStatus}
              onChange={(e) => handleInputChange('deviceStatus', e.target.value)}
              className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all duration-300 bg-white/20 backdrop-blur-sm text-white ${
                errors.deviceStatus ? 'border-red-400' : 'border-white/30'
              }`}
            >
              <option value="ONLINE" className="bg-gray-800 text-white">🟢 Online</option>
              <option value="OFFLINE" className="bg-gray-800 text-white">🔴 Offline</option>
              <option value="WARNING" className="bg-gray-800 text-white">🟡 Warning</option>
              <option value="ERROR" className="bg-gray-800 text-white">🔴 Error</option>
            </select>
            {errors.deviceStatus && (
              <p className="text-red-300 text-sm mt-1">{errors.deviceStatus}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  ), [formData.deviceName, formData.location, formData.manufacturer, formData.deviceStatus, errors.deviceName, errors.location, errors.manufacturer, errors.deviceStatus, handleInputChange]);

  const renderStep2 = useCallback(() => (
    <div className="w-3/5 mx-auto h-3/4 flex flex-col justify-center animate-fadeIn">
      {/* Enhanced Header with Glassmorphism */}
      <div className="text-center mb-8 p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
        <div className="w-20 h-20 bg-gradient-to-br from-green-500 via-blue-600 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Bot className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">Connection Settings</h3>
        <p className="text-white/80 text-lg">Configure how your device will communicate</p>
      </div>

      {/* Form Container with Glassmorphism */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Connection Type *
            </label>
            <div className="grid grid-cols-3 gap-4">
              {(['MQTT', 'HTTP', 'COAP'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleInputChange('connectionType', type)}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    formData.connectionType === type
                      ? 'border-indigo-400 bg-indigo-500/20 text-white shadow-lg'
                      : 'border-white/30 hover:border-white/50 bg-white/10 text-white/80 hover:text-white'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg font-semibold">{type}</div>
                    <div className="text-xs text-white/60 mt-1">
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
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Broker URL *
              </label>
              <input
                type="text"
                value={formData.brokerUrl || ''}
                onChange={(e) => handleInputChange('brokerUrl', e.target.value)}
                className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all duration-300 bg-white/20 backdrop-blur-sm text-white placeholder-white/60 ${
                  errors.brokerUrl ? 'border-red-400' : 'border-white/30'
                }`}
                placeholder="e.g., mqtt://broker.example.com:1883"
              />
              {errors.brokerUrl && (
                <p className="text-red-300 text-sm mt-1">{errors.brokerUrl}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Topic *
              </label>
              <input
                type="text"
                value={formData.topic || ''}
                onChange={(e) => handleInputChange('topic', e.target.value)}
                className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all duration-300 bg-white/20 backdrop-blur-sm text-white placeholder-white/60 ${
                  errors.topic ? 'border-red-400' : 'border-white/30'
                }`}
                placeholder="e.g., device/sensor001/data"
              />
              {errors.topic && (
                <p className="text-red-300 text-sm mt-1">{errors.topic}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username || ''}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="w-full px-4 py-4 border-2 border-white/30 rounded-xl focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all duration-300 bg-white/20 backdrop-blur-sm text-white placeholder-white/60"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password || ''}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full px-4 py-4 border-2 border-white/30 rounded-xl focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all duration-300 bg-white/20 backdrop-blur-sm text-white placeholder-white/60"
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
    </div>
  ), [formData.connectionType, formData.brokerUrl, formData.topic, formData.username, formData.password, formData.httpEndpoint, formData.httpMethod, formData.httpHeaders, formData.coapHost, formData.coapPort, formData.coapPath, errors, handleInputChange]);

  const renderStep3 = useCallback(() => (
    <div className="w-3/5 mx-auto h-3/4 flex flex-col justify-center animate-fadeIn">
      {/* Enhanced Header with Glassmorphism */}
      <div className="text-center mb-8 p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-pink-600 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <FileText className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">Upload Device Documentation</h3>
        <p className="text-white/80 text-lg">Upload a PDF to automatically configure your device</p>
      </div>

      {/* Form Container with Glassmorphism */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-xl">
        <div className="border-2 border-dashed border-white/40 rounded-xl p-8 text-center hover:border-white/60 transition-all duration-300 bg-white/5">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="w-16 h-16 text-white/60 mx-auto mb-4" />
            <p className="text-xl font-semibold text-white mb-2">
              {uploadedFile ? uploadedFile.file.name : 'Click to upload PDF'}
            </p>
            <p className="text-white/70 text-lg">
              {uploadedFile ? 'File uploaded successfully' : 'Upload device manual, datasheet, or documentation'}
            </p>
          </label>
        </div>

        {uploadedFile && (
          <div className="mt-6 bg-green-500/20 border border-green-400/30 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center">
              <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
              <span className="text-green-100 font-semibold text-lg">File uploaded successfully</span>
            </div>
          </div>
        )}
      </div>
    </div>
  ), [uploadedFile, handleFileUpload]);

  const renderProgressBar = useCallback(() => (
    <div className="flex items-center justify-center mt-6">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
            currentStep >= step 
              ? 'bg-white/20 border-white/40 text-white shadow-lg' 
              : 'bg-white/10 border-white/20 text-white/60'
          }`}>
            {currentStep > step ? (
              <CheckCircle className="w-6 h-6" />
            ) : (
              <span className="text-sm font-bold">{step}</span>
            )}
          </div>
          {step < 3 && (
            <div className={`w-20 h-1 transition-all duration-300 rounded-full ${
              currentStep > step ? 'bg-white/60' : 'bg-white/20'
            }`} />
          )}
        </div>
      ))}
    </div>
  ), [currentStep]);

  // Render loading screen within the modal
  const renderLoadingContent = useCallback(() => (
    <div className="w-3/5 mx-auto h-3/4 flex items-center justify-center">
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
    <div className="w-3/5 mx-auto h-3/4 flex items-center justify-center">
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
      <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-3xl shadow-2xl w-1/2 h-1/2 overflow-hidden border border-white/30">
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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
        <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col border border-white/30">
          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white flex-shrink-0 rounded-t-3xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold drop-shadow-lg">
                  {showOnboardingLoader ? 'Processing Device...' : 
                   showSuccessMessage ? 'Onboarding Complete!' :
                   'Device Onboarding'}
                </h2>
                <p className="text-white/90 mt-2 text-lg">
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
                  className="p-3 hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-110"
                >
                  <span className="text-2xl font-bold">×</span>
                </button>
              )}
            </div>
            {renderProgressBar()}
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-8 min-h-0 bg-gradient-to-br from-gray-50/50 to-white/30">
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
            <div className="p-8 border-t border-white/20 bg-white/40 backdrop-blur-sm flex-shrink-0 rounded-b-3xl">
              <div className="flex justify-between items-center">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="flex items-center gap-3 px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:bg-white/20 rounded-xl font-medium"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Previous
                </button>
                
                <div className="flex gap-4">
                  <button
                    onClick={onCancel}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-all duration-300 hover:bg-white/20 rounded-xl font-medium"
                  >
                    Cancel
                  </button>
                  
                  <button
                    onClick={currentStep === 3 ? handleSubmit : nextStep}
                    disabled={isSubmitting || (currentStep === 3 && !uploadedFile)}
                    className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    {currentStep === 3 ? 'Complete Onboarding' : 'Next'}
                    <ArrowRight className="w-5 h-5" />
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
