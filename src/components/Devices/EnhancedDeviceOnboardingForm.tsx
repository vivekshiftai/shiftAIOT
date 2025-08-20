import React, { useState, useCallback, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Upload, FileText, Settings, Wifi, Database, Bot, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { pdfProcessingService } from '../../services/pdfprocess';
import { EnhancedOnboardingLoader } from '../Loading/EnhancedOnboardingLoader';
import { DeviceChatInterface } from './DeviceChatInterface';



interface DeviceFormData {
  deviceId: string;
  deviceName: string;
  productId: string;
  serialNumber: string;
  authenticationCredential: string;
  connectionProtocol: 'MQTT' | 'HTTP' | 'COAP' | 'TCP' | 'UDP';
  networkConfig: string;
  location: string;
  metadata: string;
  manufacturer?: string;
  model?: string;
  description?: string;
  ipAddress?: string;
  port?: number;
  firmware?: string;
  powerSource?: string;
  powerConsumption?: number;
  operatingTemperatureMin?: number;
  operatingTemperatureMax?: number;
  operatingHumidityMin?: number;
  operatingHumidityMax?: number;
  wifiSsid?: string;
  mqttBroker?: string;
  mqttTopic?: string;
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
    deviceId: '',
    deviceName: '',
    productId: '',
    serialNumber: '',
    authenticationCredential: '',
    connectionProtocol: 'MQTT',
    networkConfig: '',
    location: '',
    metadata: '',
    manufacturer: '',
    model: '',
    description: '',
    ipAddress: '',
    port: 8100,
    firmware: '',
    powerSource: '',
    powerConsumption: 0,
    operatingTemperatureMin: 0,
    operatingTemperatureMax: 50,
    operatingHumidityMin: 0,
    operatingHumidityMax: 100,
    wifiSsid: '',
    mqttBroker: '',
    mqttTopic: ''
  });

  const [uploadedFile, setUploadedFile] = useState<FileUpload | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isStepLoading, setIsStepLoading] = useState(false);
  const [stepLoadingMessage, setStepLoadingMessage] = useState('');
  const [showOnboardingLoader, setShowOnboardingLoader] = useState(false);
  const [showChatInterface, setShowChatInterface] = useState(false);

  const [fieldValidation, setFieldValidation] = useState<Record<string, { isValid: boolean; message: string }>>({});
  
  // Progress tracking states
  const [currentProcess, setCurrentProcess] = useState<'pdf' | 'rules' | 'knowledgebase'>('pdf');
  const [progress, setProgress] = useState(0);
  const [currentSubStage, setCurrentSubStage] = useState('');

  // Debug progress updates
  useEffect(() => {
    if (showOnboardingLoader) {
      console.log('Progress updated:', progress, 'SubStage:', currentSubStage);
    }
  }, [progress, currentSubStage, showOnboardingLoader]);

  // Real-time validation
  const validateField = useCallback((field: keyof DeviceFormData, value: any) => {
    const validations: Record<string, { isValid: boolean; message: string }> = {};
    
    switch (field) {
      case 'deviceId':
        if (!value.trim()) {
          validations[field] = { isValid: false, message: 'Device ID is required' };
        } else if (value.length < 3) {
          validations[field] = { isValid: false, message: 'Device ID must be at least 3 characters' };
        } else if (!/^[A-Za-z0-9-_]+$/.test(value)) {
          validations[field] = { isValid: false, message: 'Device ID can only contain letters, numbers, hyphens, and underscores' };
        } else {
          validations[field] = { isValid: true, message: '' };
        }
        break;
        
      case 'deviceName':
        if (!value.trim()) {
          validations[field] = { isValid: false, message: 'Device name is required' };
        } else if (value.length < 2) {
          validations[field] = { isValid: false, message: 'Device name must be at least 2 characters' };
        } else {
          validations[field] = { isValid: true, message: '' };
        }
        break;
        
      case 'productId':
        if (!value.trim()) {
          validations[field] = { isValid: false, message: 'Product ID is required' };
        } else {
          validations[field] = { isValid: true, message: '' };
        }
        break;
        
      case 'serialNumber':
        if (!value.trim()) {
          validations[field] = { isValid: false, message: 'Serial number is required' };
        } else {
          validations[field] = { isValid: true, message: '' };
        }
        break;
        
      case 'authenticationCredential':
        if (!value.trim()) {
          validations[field] = { isValid: false, message: 'Authentication credential is required' };
        } else if (value.length < 6) {
          validations[field] = { isValid: false, message: 'Credential must be at least 6 characters' };
        } else {
          validations[field] = { isValid: true, message: '' };
        }
        break;
        
      case 'networkConfig':
        if (!value.trim()) {
          validations[field] = { isValid: false, message: 'Network configuration is required' };
        } else {
          validations[field] = { isValid: true, message: '' };
        }
        break;
        
      case 'ipAddress':
        if (value && !/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(value)) {
          validations[field] = { isValid: false, message: 'Please enter a valid IP address' };
        } else {
          validations[field] = { isValid: true, message: '' };
        }
        break;
        
      case 'port':
        if (value && (value < 1 || value > 65535)) {
          validations[field] = { isValid: false, message: 'Port must be between 1 and 65535' };
        } else {
          validations[field] = { isValid: true, message: '' };
        }
        break;
        
      default:
        validations[field] = { isValid: true, message: '' };
    }
    
    return validations[field];
  }, []);

  const handleInputChange = useCallback((field: keyof DeviceFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Real-time validation
    const validation = validateField(field, value);
    setFieldValidation(prev => ({ ...prev, [field]: validation }));
    
    // Clear error if field becomes valid
    if (validation.isValid && errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors, validateField]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, file: 'Only PDF files are allowed' }));
      return;
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB limit for UI feedback only
      setErrors(prev => ({ ...prev, file: 'File size must be less than 100MB' }));
      return;
    }

    const newFileUpload: FileUpload = {
      file,
      status: 'uploading'
    };

    setUploadedFile(newFileUpload);
    setErrors(prev => ({ ...prev, file: '' }));

    try {
      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUploadedFile({ file, status: 'success' });
    } catch (error: any) {
      setUploadedFile({ file, status: 'error', error: 'Upload failed' });
    }
  }, []);

  const removeFile = useCallback(() => {
    setUploadedFile(null);
  }, []);

  const validateCurrentStep = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 1:
        if (!formData.deviceId.trim()) newErrors.deviceId = 'Device ID is required';
        if (!formData.deviceName.trim()) newErrors.deviceName = 'Device Name is required';
        if (!formData.productId.trim()) newErrors.productId = 'Product ID/Model is required';
        if (!formData.serialNumber.trim()) newErrors.serialNumber = 'Serial Number is required';
        break;
      case 2:
        if (!formData.authenticationCredential.trim()) newErrors.authenticationCredential = 'Authentication Credential is required';
        if (!formData.connectionProtocol) newErrors.connectionProtocol = 'Connection Protocol is required';
        if (!formData.networkConfig.trim()) newErrors.networkConfig = 'Network Config is required';
        break;
      case 3:
        if (!uploadedFile) newErrors.file = 'Please upload a PDF documentation file';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [currentStep, formData, uploadedFile]);

  const nextStep = useCallback(async () => {
    if (validateCurrentStep()) {
      setIsStepLoading(true);
      
      if (currentStep === 2) {
        setStepLoadingMessage('Preparing AI analysis system...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStepLoadingMessage('Loading documentation upload interface...');
        await new Promise(resolve => setTimeout(resolve, 800));
      } else {
        setStepLoadingMessage('Preparing next step...');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setIsStepLoading(false);
      setStepLoadingMessage('');
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  }, [validateCurrentStep, currentStep]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => (prev - 1) as Step);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!validateCurrentStep()) {
      return;
    }

    setIsSubmitting(true);
    setShowOnboardingLoader(true);
    setProgress(0);
    setCurrentProcess('pdf');
    setCurrentSubStage('Initializing PDF processing...');

    try {
      let pdfId = '';
      let pdfFilename = '';
      let externalPdfName = '';

      // Step 1: Upload PDF and wait for success
      if (uploadedFile?.file) {
        setCurrentSubStage('Preparing PDF upload...');
        setProgress(10);

        // Small delay to show initial progress
        await new Promise(resolve => setTimeout(resolve, 500));

        setCurrentSubStage('Uploading PDF to backend...');
        setProgress(20);

        try {
          console.log('Attempting to upload PDF:', {
            fileName: uploadedFile.file.name,
            fileSize: uploadedFile.file.size,
            deviceId: formData.deviceId,
            deviceName: formData.deviceName
          });

          // Upload directly to MinerU processing service (bypass backend for now)
          setCurrentSubStage('Uploading PDF to MinerU processing service...');
          setProgress(30);

          const externalUploadResponse = await pdfProcessingService.uploadPDF(uploadedFile.file);
          externalPdfName = externalUploadResponse.pdf_name;
          pdfFilename = uploadedFile.file.name; // Use original filename
          console.log('PDF uploaded to MinerU successfully:', externalUploadResponse);

          setCurrentSubStage('Processing PDF content with MinerU...');
          setProgress(50);

          // Step 2: PDF processing is handled by MinerU service
          setCurrentSubStage('PDF uploaded and processing started...');
          setProgress(80);
          
          // Wait a moment for processing to start
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error: any) {
          console.error('PDF upload/processing failed:', error);

          // Check if it's a network/connection error
          if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') || error.message?.includes('Connection')) {
            console.log('Backend server not available');
            throw new Error('Backend server is not available. Please ensure the backend server is running and try again.');
          } else {
            // Try to get specific error message from backend response
            const errorMessage = error.response?.data?.error || error.message || 'Failed to upload/process PDF document';
            throw new Error(errorMessage);
          }
        }
      }

      // Step 3: Generate Rules and Maintenance from PDF
      setCurrentSubStage('Generating monitoring rules...');
      setProgress(70);

      let generatedRules: any[] = [];
      let generatedMaintenance: any[] = [];
      let generatedSafety: any[] = [];

      try {
        // Generate IoT monitoring rules
        setCurrentSubStage('Generating IoT monitoring rules...');
        const rulesResponse = await pdfProcessingService.generateRules(externalPdfName);
        generatedRules = rulesResponse.rules;
        console.log('Rules generated successfully:', rulesResponse);

        setCurrentSubStage('Generating maintenance schedule...');
        setProgress(80);

        // Generate maintenance schedule
        const maintenanceResponse = await pdfProcessingService.generateMaintenance(externalPdfName);
        generatedMaintenance = maintenanceResponse.maintenance_tasks;
        console.log('Maintenance schedule generated successfully:', maintenanceResponse);

        setCurrentSubStage('Generating safety information...');
        setProgress(85);

        // Generate safety information
        const safetyResponse = await pdfProcessingService.generateSafety(externalPdfName);
        generatedSafety = safetyResponse.safety_information;
        console.log('Safety information generated successfully:', safetyResponse);

      } catch (error: any) {
        console.warn('Rules/Maintenance generation failed, continuing with device creation:', error);
        // Continue without rules/maintenance if generation fails
        // Set default values if generation fails
        generatedRules = [];
        generatedMaintenance = [];
        generatedSafety = [];
      }

      // Step 4: Create Device in Backend
      setCurrentSubStage('Creating device in database...');
      setProgress(90);

      try {
        const deviceData = {
          name: formData.deviceName,
          type: 'SENSOR',
          status: 'ONLINE',
          protocol: formData.connectionProtocol,
          location: formData.location,
          manufacturer: formData.manufacturer,
          model: formData.model,
          productId: formData.productId,
          serialNumber: formData.serialNumber,
          description: `Device onboarded with PDF: ${pdfFilename}`,
          organizationId: 'public',
          // Add generated data to device
          rules: generatedRules,
          maintenance: generatedMaintenance,
          safety: generatedSafety,
          pdfName: externalPdfName
        };

        // Create device in backend
        const response = await fetch('/api/devices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(deviceData),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to create device: ${response.statusText}`);
        }
        
        const createdDevice = await response.json();
        console.log('Device created successfully:', createdDevice);
        console.log('Generated Rules:', generatedRules);
        console.log('Generated Maintenance:', generatedMaintenance);
        console.log('Generated Safety Info:', generatedSafety);
        
        setCurrentSubStage('Device created successfully!');
        setProgress(95);
        
        // Store device info for chat interface
        localStorage.setItem('lastCreatedDevice', JSON.stringify({
          id: createdDevice.id,
          name: createdDevice.name,
          pdfName: externalPdfName
        }));

      } catch (error: any) {
        console.error('Device creation failed:', error);
        throw new Error('Failed to create device in database');
      }

      // Step 5: Complete onboarding and show chat
      setCurrentSubStage('Setting up AI assistant...');
      setProgress(100);

      // Call onSubmit to add device to list with onboarding state and generated data
      const enhancedFormData = {
        ...formData,
        rules: generatedRules,
        maintenance: generatedMaintenance,
        safety: generatedSafety,
        pdfName: externalPdfName
      };
      await onSubmit(enhancedFormData, uploadedFile);

      // Show chat interface instead of closing the form
      setShowChatInterface(true);
      setShowOnboardingLoader(false);

    } catch (error) {
      console.error('Error during onboarding process:', error);
      setShowOnboardingLoader(false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Detailed error:', error);
      alert(`Failed to complete onboarding: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [validateCurrentStep, formData, uploadedFile, onSubmit, onCancel]);

  const getStepTitle = useCallback((step: Step): string => {
    switch (step) {
      case 1: return 'Device Information';
      case 2: return 'Connection Settings';
      case 3: return 'Documentation Upload';
    }
  }, []);

  const getStepDescription = useCallback((step: Step): string => {
    switch (step) {
      case 1: return 'Enter basic device information and specifications';
      case 2: return 'Configure network connection and authentication';
      case 3: return 'Upload device documentation for AI analysis';
    }
  }, []);

  const getStepIcon = useCallback((step: Step) => {
    switch (step) {
      case 1: return <Bot className="w-6 h-6" />;
      case 2: return <MessageSquare className="w-6 h-6" />;
      case 3: return <FileText className="w-6 h-6" />;
    }
  }, []);

  const renderStepContent = useCallback(() => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Device ID *
                </label>
                <input
                  type="text"
                  value={formData.deviceId}
                  onChange={(e) => handleInputChange('deviceId', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    fieldValidation.deviceId?.isValid === false ? 'border-red-500' : 
                    fieldValidation.deviceId?.isValid === true ? 'border-green-500' : 'border-slate-300'
                  }`}
                  placeholder="e.g., DEV-001"
                />
                {fieldValidation.deviceId?.isValid === false && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {fieldValidation.deviceId.message}
                  </p>
                )}
                {fieldValidation.deviceId?.isValid === true && (
                  <p className="text-green-500 text-sm mt-1 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Valid device ID
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Device Name *
                </label>
                <input
                  type="text"
                  value={formData.deviceName}
                  onChange={(e) => handleInputChange('deviceName', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    fieldValidation.deviceName?.isValid === false ? 'border-red-500' : 
                    fieldValidation.deviceName?.isValid === true ? 'border-green-500' : 'border-slate-300'
                  }`}
                  placeholder="e.g., Temperature Sensor 001"
                />
                {fieldValidation.deviceName?.isValid === false && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {fieldValidation.deviceName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Product ID / Model *
                </label>
                <input
                  type="text"
                  value={formData.productId}
                  onChange={(e) => handleInputChange('productId', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    fieldValidation.productId?.isValid === false ? 'border-red-500' : 
                    fieldValidation.productId?.isValid === true ? 'border-green-500' : 'border-slate-300'
                  }`}
                  placeholder="e.g., ST-2000"
                />
                {fieldValidation.productId?.isValid === false && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {fieldValidation.productId.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Serial Number *
                </label>
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    fieldValidation.serialNumber?.isValid === false ? 'border-red-500' : 
                    fieldValidation.serialNumber?.isValid === true ? 'border-green-500' : 'border-slate-300'
                  }`}
                  placeholder="e.g., SN123456789"
                />
                {fieldValidation.serialNumber?.isValid === false && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {fieldValidation.serialNumber.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Manufacturer
                </label>
                <input
                  type="text"
                  value={formData.manufacturer || ''}
                  onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g., Siemens, Schneider Electric"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Model
                </label>
                <input
                  type="text"
                  value={formData.model || ''}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g., SIMATIC S7-1200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Location
                </label>
                <div className="relative">
                  <AlertCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="e.g., Building A, Floor 2, Room 205"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tags
                </label>
                <div className="relative">
                  <AlertCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    value={formData.metadata}
                    onChange={(e) => handleInputChange('metadata', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="e.g., temperature, sensor, industrial"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  rows={3}
                  placeholder="Brief description of the device and its purpose..."
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Authentication Credential *
                </label>
                <div className="relative">
                  <AlertCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="password"
                    value={formData.authenticationCredential}
                    onChange={(e) => handleInputChange('authenticationCredential', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      fieldValidation.authenticationCredential?.isValid === false ? 'border-red-500' : 
                      fieldValidation.authenticationCredential?.isValid === true ? 'border-green-500' : 'border-slate-300'
                    }`}
                    placeholder="Enter authentication key or token"
                  />
                </div>
                {fieldValidation.authenticationCredential?.isValid === false && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {fieldValidation.authenticationCredential.message}
                  </p>
                )}
                {fieldValidation.authenticationCredential?.isValid === true && (
                  <p className="text-green-500 text-sm mt-1 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Valid credential
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Connection Protocol *
                </label>
                <div className="relative">
                  <AlertCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <select
                    value={formData.connectionProtocol}
                    onChange={(e) => handleInputChange('connectionProtocol', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="MQTT">MQTT</option>
                    <option value="HTTP">HTTP</option>
                    <option value="COAP">COAP</option>
                    <option value="TCP">TCP</option>
                    <option value="UDP">UDP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  IP Address
                </label>
                <input
                  type="text"
                  value={formData.ipAddress || ''}
                  onChange={(e) => handleInputChange('ipAddress', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    fieldValidation.ipAddress?.isValid === false ? 'border-red-500' : 
                    fieldValidation.ipAddress?.isValid === true ? 'border-green-500' : 'border-slate-300'
                  }`}
                  placeholder="e.g., 192.168.1.100"
                />
                {fieldValidation.ipAddress?.isValid === false && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {fieldValidation.ipAddress.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Port
                </label>
                <input
                  type="number"
                  value={formData.port || ''}
                  onChange={(e) => handleInputChange('port', parseInt(e.target.value) || 8100)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    fieldValidation.port?.isValid === false ? 'border-red-500' : 
                    fieldValidation.port?.isValid === true ? 'border-green-500' : 'border-slate-300'
                  }`}
                  placeholder="e.g., 8100"
                />
                {fieldValidation.port?.isValid === false && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {fieldValidation.port.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  MQTT Broker
                </label>
                <input
                  type="text"
                  value={formData.mqttBroker || ''}
                  onChange={(e) => handleInputChange('mqttBroker', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g., mqtt.broker.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  MQTT Topic
                </label>
                <input
                  type="text"
                  value={formData.mqttTopic || ''}
                  onChange={(e) => handleInputChange('mqttTopic', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g., devices/temperature/001"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Network Configuration *
                </label>
                <textarea
                  value={formData.networkConfig}
                  onChange={(e) => handleInputChange('networkConfig', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    fieldValidation.networkConfig?.isValid === false ? 'border-red-500' : 
                    fieldValidation.networkConfig?.isValid === true ? 'border-green-500' : 'border-slate-300'
                  }`}
                  rows={4}
                  placeholder="Enter detailed network configuration (broker URL, credentials, SSL settings, etc.)"
                />
                {fieldValidation.networkConfig?.isValid === false && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {fieldValidation.networkConfig.message}
                  </p>
                )}
                {fieldValidation.networkConfig?.isValid === true && (
                  <p className="text-green-500 text-sm mt-1 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Valid configuration
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Upload Device Documentation</h3>
              <p className="text-slate-600">Upload your device manual or specifications for AI-powered analysis and rule generation</p>
            </div>

            {!uploadedFile ? (
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept=".pdf"
                  className="hidden"
                  id="device-documentation"
                />
                <label
                  htmlFor="device-documentation"
                  className="flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 rounded-lg transition-colors p-6"
                >
                  <Upload className="w-12 h-12 text-slate-400 mb-4" />
                  <span className="text-lg font-medium text-slate-700 mb-2">Click to upload PDF</span>
                  <span className="text-sm text-slate-500">Device manual, datasheet, or specifications</span>
                  <span className="text-xs text-slate-400 mt-1">Maximum file size: 100MB</span>
                </label>
                {errors.file && (
                  <p className="text-red-500 text-sm mt-2 text-center">{errors.file}</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`border rounded-lg p-4 ${
                  uploadedFile.status === 'success' 
                    ? 'bg-green-50 border-green-200' 
                    : uploadedFile.status === 'error'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {uploadedFile.status === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : uploadedFile.status === 'error' ? (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-blue-600 animate-spin" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-800">{uploadedFile.file.name}</p>
                        <p className="text-xs text-slate-600">
                          {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        {uploadedFile.status === 'success' && (
                          <p className="text-xs text-green-600 mt-1">✓ Successfully uploaded</p>
                        )}
                        {uploadedFile.status === 'error' && (
                          <p className="text-xs text-red-600 mt-1">✗ {uploadedFile.error}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-1 hover:bg-slate-100 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">AI Analysis</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Our AI will analyze your documentation to automatically generate monitoring rules, 
                    maintenance schedules, and performance recommendations for your device.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Bot className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Ready to Complete Onboarding</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Your device is ready to be added to the system. Click "Complete Onboarding" to create your device with AI-generated rules and maintenance schedules.
                  </p>
                </div>
              </div>
            )}
          </div>
        );
    }
  }, [currentStep, formData, uploadedFile, handleInputChange, removeFile, handleFileUpload, errors, fieldValidation]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Device Onboarding</h2>
              <p className="text-slate-600 mt-1">{getStepDescription(currentStep)}</p>
              {/* Removed demo mode indicator */}
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                  step === currentStep
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : step < currentStep
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-slate-300 text-slate-400'
                }`}>
                  {step < currentStep ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <span className="text-sm font-medium">{step}</span>
                  )}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-0.5 mx-2 transition-colors ${
                    step < currentStep ? 'bg-green-500' : 'bg-slate-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Show chat interface after completion */}
          {showChatInterface ? (
            <DeviceChatInterface
              deviceName={formData.deviceName}
              pdfFileName={uploadedFile?.file.name || 'unknown.pdf'}
              onClose={onCancel}
              onContinue={onCancel}
            />
          ) : showOnboardingLoader ? (
            <div className="min-h-[400px] flex items-center justify-center">
              <EnhancedOnboardingLoader
                key={`loader-${progress}-${currentSubStage}`}
                isProcessing={true}
                currentProcess={currentProcess}
                progress={progress}
                onComplete={() => setShowOnboardingLoader(false)}
                pdfFileName={uploadedFile?.file.name}
                currentSubStage={currentSubStage}
              />
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-blue-600">
                    {getStepIcon(currentStep)}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">{getStepTitle(currentStep)}</h3>
                </div>
              </div>

              {/* Loading Screen */}
              {isStepLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                  <p className="text-slate-600 text-center">{stepLoadingMessage}</p>
                </div>
              )}

              {/* Main Content */}
              {!isStepLoading && renderStepContent()}
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <X className="w-4 h-4" />
            Previous
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>

            {currentStep === 3 ? (
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <X className="w-4 h-4 animate-spin" />
                    Starting Onboarding...
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4" />
                    Complete Onboarding
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={nextStep}
                disabled={isStepLoading}
                className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isStepLoading ? (
                  <>
                    <X className="w-4 h-4 animate-spin" />
                    {stepLoadingMessage}
                  </>
                ) : (
                  <>
                    Next
                    <X className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
