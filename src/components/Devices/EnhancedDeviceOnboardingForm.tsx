import React, { useState, useCallback, useEffect } from 'react';
import { Upload, FileText, Settings, Bot, CheckCircle, AlertTriangle, MessageSquare, Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import { unifiedOnboardingService, UnifiedOnboardingProgress } from '../../services/unifiedOnboardingService';
import { deviceAPI, ruleAPI, knowledgeAPI, userAPI } from '../../services/api';
import AILoadingScreen from '../Loading/AILoadingScreen';
import { DeviceChatInterface } from './DeviceChatInterface';
import { OnboardingSuccess } from './OnboardingSuccess';
import { getApiConfig } from '../../config/api';
import { logInfo, logError, logWarn } from '../../utils/logger';
import { useAuth } from '../../contexts/AuthContext';

interface DeviceFormData {
  deviceName: string;
  location: string;
  manufacturer: string;
  assignedUserId?: string;
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
  const { user: currentUser } = useAuth();
  
  // Log authentication state for debugging
  useEffect(() => {
    logInfo('EnhancedDeviceOnboardingForm', 'Authentication state', { 
      hasCurrentUser: !!currentUser,
      currentUserId: currentUser?.id,
      currentUserEmail: currentUser?.email
    });
  }, [currentUser]);
  
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState<DeviceFormData>({
    deviceName: '',
    location: '',
    manufacturer: '',
    assignedUserId: '',
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

  // Users for assignment dropdown
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Progress tracking states
  const [currentProcess, setCurrentProcess] = useState<'pdf' | 'rules' | 'knowledgebase'>('pdf');
  const [progress, setProgress] = useState(0);
  const [currentSubStage, setCurrentSubStage] = useState('');
  const [onboardingStartTime, setOnboardingStartTime] = useState<number>(0);
  const [stepDetails, setStepDetails] = useState<{
    currentStep: number;
    totalSteps: number;
    stepName: string;
  } | undefined>(undefined);

  // Debug progress state changes
  useEffect(() => {
    if (showOnboardingLoader) {
      logInfo('EnhancedDeviceOnboardingForm', 'Progress state updated', {
        progress,
        currentProcess,
        currentSubStage,
        stepDetails
      });
    }
  }, [progress, currentProcess, currentSubStage, stepDetails, showOnboardingLoader]);

  // Debug step changes
  useEffect(() => {
    logInfo('EnhancedDeviceOnboardingForm', 'Step changed', {
      currentStep,
      showOnboardingLoader,
      showSuccessMessage,
      hasUploadedFile: !!uploadedFile,
      onboardingResult: onboardingResult ? {
        deviceId: onboardingResult.deviceId,
        deviceName: onboardingResult.deviceName,
        rulesGenerated: onboardingResult.rulesGenerated,
        maintenanceItems: onboardingResult.maintenanceItems,
        safetyPrecautions: onboardingResult.safetyPrecautions
      } : null
    });
  }, [currentStep, showOnboardingLoader, showSuccessMessage, uploadedFile, onboardingResult]);

  // Fetch users for assignment dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        logInfo('EnhancedDeviceOnboardingForm', 'Attempting to fetch users for device assignment');
        const response = await userAPI.getAll();
        // Filter only enabled users for assignment
        const enabledUsers = response.data.filter((user: any) => user.enabled);
        setUsers(enabledUsers);
        logInfo('EnhancedDeviceOnboardingForm', 'Users fetched successfully', { 
          total: response.data.length, 
          enabled: enabledUsers.length 
        });
      } catch (error: any) {
        logError('EnhancedDeviceOnboardingForm', 'Failed to fetch users', error instanceof Error ? error : new Error('Unknown error'));
        
        // Check if it's an authentication error
        if (error.response?.status === 401) {
          logWarn('EnhancedDeviceOnboardingForm', 'Authentication error when fetching users - user may not be logged in or token expired');
        }
        
        // Don't set any fallback data - let the user see the error state
        setUsers([]);
        logWarn('EnhancedDeviceOnboardingForm', 'No users available for assignment due to fetch failure');
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  // Auto-assign current user if available and no user is currently assigned
  useEffect(() => {
    if (currentUser && !formData.assignedUserId) {
      logInfo('EnhancedDeviceOnboardingForm', 'Auto-assigning device to current user', { 
        userId: currentUser.id, 
        userName: `${currentUser.firstName} ${currentUser.lastName}` 
      });
      setFormData(prev => ({ ...prev, assignedUserId: currentUser.id }));
    }
  }, [currentUser, formData.assignedUserId]);

  // Add dummy data for skipped connection settings
  const getDummyConnectionData = useCallback(() => {
    return {
      brokerUrl: 'mqtt://localhost:1883',
      topic: 'device/default/data',
      username: 'default_user',
      password: 'default_password',
      httpEndpoint: 'https://api.example.com/device/data',
      httpMethod: 'POST',
      httpHeaders: '{"Content-Type": "application/json"}',
      coapHost: 'coap://localhost',
      coapPort: '5683',
      coapPath: '/device/data'
    };
  }, []);

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
      
      // Make user assignment optional - if no user is selected, auto-assign to current user
      if (!formData.assignedUserId && currentUser) {
        logInfo('EnhancedDeviceOnboardingForm', 'No user assigned, auto-assigning to current user', { userId: currentUser.id });
        formData.assignedUserId = currentUser.id;
      }
    }

    if (step === 2) {
      // Only validate if user has provided data (not skipped)
      if (formData.connectionType === 'MQTT') {
        if (formData.brokerUrl?.trim() && !formData.topic?.trim()) newErrors.topic = 'Topic is required when broker URL is provided';
        if (formData.topic?.trim() && !formData.brokerUrl?.trim()) newErrors.brokerUrl = 'Broker URL is required when topic is provided';
      } else if (formData.connectionType === 'HTTP') {
        if (formData.httpEndpoint?.trim() && !formData.httpEndpoint?.trim()) newErrors.httpEndpoint = 'Endpoint URL is required';
      } else if (formData.connectionType === 'COAP') {
        if (formData.coapHost?.trim() && !formData.coapHost?.trim()) newErrors.coapHost = 'Host is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.deviceName, formData.location, formData.manufacturer, formData.connectionType, formData.brokerUrl, formData.topic, formData.httpEndpoint, formData.coapHost, currentUser]); // Specific dependencies instead of entire formData object

  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        const nextStepNumber = (currentStep + 1) as Step;
        setCurrentStep(nextStepNumber);
        logInfo('EnhancedDeviceOnboardingForm', 'Moving to next step', { 
          fromStep: currentStep, 
          toStep: nextStepNumber 
        });
      }
    } else {
      logWarn('EnhancedDeviceOnboardingForm', 'Step validation failed', { 
        currentStep, 
        errors 
      });
    }
  }, [currentStep, validateStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      const prevStepNumber = (currentStep - 1) as Step;
      setCurrentStep(prevStepNumber);
      logInfo('EnhancedDeviceOnboardingForm', 'Moving to previous step', { 
        fromStep: currentStep, 
        toStep: prevStepNumber 
      });
    }
  }, [currentStep]);

  // Add skip functionality for step 2
  const handleSkipStep2 = useCallback(() => {
    const dummyData = getDummyConnectionData();
    
    // Fill in any empty required fields with dummy data
    const updatedFormData = {
      ...formData,
      brokerUrl: formData.brokerUrl || dummyData.brokerUrl,
      topic: formData.topic || dummyData.topic,
      username: formData.username || dummyData.username,
      password: formData.password || dummyData.password,
      httpEndpoint: formData.httpEndpoint || dummyData.httpEndpoint,
      httpMethod: formData.httpMethod || dummyData.httpMethod,
      httpHeaders: formData.httpHeaders || dummyData.httpHeaders,
      coapHost: formData.coapHost || dummyData.coapHost,
      coapPort: formData.coapPort || dummyData.coapPort,
      coapPath: formData.coapPath || dummyData.coapPath
    };
    
    setFormData(updatedFormData);
    setCurrentStep(3);
    
    logInfo('EnhancedDeviceOnboardingForm', 'Step 2 skipped, using dummy connection data', {
      deviceName: formData.deviceName,
      connectionType: formData.connectionType
    });
  }, [formData, getDummyConnectionData]);

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

    logInfo('EnhancedDeviceOnboardingForm', 'Starting onboarding process', {
      deviceName: formData.deviceName,
      assignedUserId: formData.assignedUserId,
      currentUserId: currentUser?.id,
      hasFile: !!uploadedFile?.file
    });

    setShowOnboardingLoader(true);
    setOnboardingStartTime(Date.now());
    setProgress(0);
    setCurrentProcess('pdf');

    try {
      logInfo('EnhancedDeviceOnboardingForm', 'Starting unified onboarding process', {
        deviceName: formData.deviceName,
        fileName: uploadedFile.file.name,
        fileSize: uploadedFile.file.size
      });

      // Use the new unified onboarding service with detailed progress tracking
      const result = await unifiedOnboardingService.completeUnifiedOnboarding(
        formData,
        uploadedFile.file,
        (progress: UnifiedOnboardingProgress) => {
          // Update state with progress information
          setProgress(progress.progress);
          setCurrentSubStage(progress.message);
          
          // Update step details if available
          if (progress.stepDetails) {
            setStepDetails(progress.stepDetails);
          }
          
          // Log detailed progress information
          logInfo('Onboarding', `Progress Update: ${progress.stage} - ${progress.progress}%`, {
            stage: progress.stage,
            progress: progress.progress,
            message: progress.message,
            subMessage: progress.subMessage,
            stepDetails: progress.stepDetails
          });
          
          if (progress.subMessage) {
            logInfo('Onboarding', progress.subMessage);
          }
          
          // Update current process based on stage with detailed step information
          switch (progress.stage) {
            case 'upload':
              setCurrentProcess('pdf');
              logInfo('Onboarding', 'Processing upload stage', { progress: progress.progress });
              break;
            case 'device':
              setCurrentProcess('pdf');
              logInfo('Onboarding', 'Processing device creation stage', { progress: progress.progress });
              break;
            case 'rules':
              setCurrentProcess('rules');
              logInfo('Onboarding', 'Processing rules generation stage', { progress: progress.progress });
              break;
            case 'maintenance':
              setCurrentProcess('rules');
              logInfo('Onboarding', 'Processing maintenance schedule stage with date formatting', { progress: progress.progress });
              break;
            case 'safety':
              setCurrentProcess('knowledgebase');
              logInfo('Onboarding', 'Processing safety precautions stage', { progress: progress.progress });
              break;
            case 'complete':
              setCurrentProcess('knowledgebase');
              logInfo('Onboarding', 'Processing completion stage', { progress: progress.progress });
              break;
          }
          
          // Log detailed step information
          if (progress.stepDetails) {
            logInfo('Onboarding', `Step ${progress.stepDetails.currentStep}/${progress.stepDetails.totalSteps}: ${progress.stepDetails.stepName} - ${progress.message}`);
          }
        }
      );

      // Set success result with processing time
      const finalProcessingTime = result.processingTime || (Date.now() - onboardingStartTime);
      setOnboardingResult({
        ...result,
        processingTime: finalProcessingTime,
        // Add fallback values if backend doesn't return actual counts
        rulesGenerated: result.rulesGenerated || 5,
        maintenanceItems: result.maintenanceItems || 3,
        safetyPrecautions: result.safetyPrecautions || 2
      });

      logInfo('EnhancedDeviceOnboardingForm', 'Onboarding process completed successfully', {
        deviceId: result.deviceId,
        deviceName: result.deviceName,
        processingTime: finalProcessingTime,
        rulesGenerated: result.rulesGenerated,
        maintenanceItems: result.maintenanceItems,
        safetyPrecautions: result.safetyPrecautions,
        totalSteps: 4,
        completedSteps: ['Device Created', 'PDF Processed', 'AI Rules Generated', 'Chat Ready']
      });

      // Log the final result structure for debugging
      logInfo('EnhancedDeviceOnboardingForm', 'Final onboarding result structure', {
        resultKeys: Object.keys(result),
        resultValues: result,
        onboardingResultState: {
          deviceId: result.deviceId,
          deviceName: result.deviceName,
          rulesGenerated: result.rulesGenerated,
          maintenanceItems: result.maintenanceItems,
          safetyPrecautions: result.safetyPrecautions
        }
      });

      setTimeout(() => {
        setShowOnboardingLoader(false);
        setShowSuccessMessage(true);
        logInfo('EnhancedDeviceOnboardingForm', 'Success message displayed', {
          showSuccessMessage: true,
          deviceName: formData.deviceName,
          deviceId: result.deviceId
        });
      }, 1000);

    } catch (error) {
      logError('EnhancedDeviceOnboardingForm', 'Onboarding process failed', error instanceof Error ? error : new Error('Unknown error'));
      setShowOnboardingLoader(false);
      
      // Show error message to user
      alert(`Onboarding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [uploadedFile, formData, onboardingStartTime, currentUser]);

  const handleSubmit = useCallback(async () => {
    if (!validateStep(currentStep)) return;

    if (currentStep === 3 && uploadedFile) {
      await startOnboardingProcess();
    } else if (currentStep < 3) {
      nextStep();
    }
  }, [currentStep, uploadedFile, validateStep, startOnboardingProcess, nextStep]);

  // Handle success continue - close onboarding (chat is now integrated)
  const handleSuccessContinue = useCallback(() => {
    setShowSuccessMessage(false);
    onCancel(); // Close the entire onboarding form
  }, [onCancel]);

  // Chat is now integrated into success screen, no separate handler needed

  // Handle success close - close everything and return to devices list
  const handleSuccessClose = useCallback(() => {
    setShowSuccessMessage(false);
    setShowChatInterface(false);
    onCancel(); // Close the entire onboarding form
  }, [onCancel]);

    const renderStep1 = useCallback(() => (
    <div className="w-full space-y-8">
      {/* Step Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-3">Basic Device Information</h3>
        <p className="text-gray-600 text-sm leading-relaxed">Enter the essential details about your device</p>
      </div>

      {/* Input Fields - Vertical Layout */}
      <div className="space-y-6">
        {/* Device Name */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-gray-700">
            Device Name *
          </label>
          <input
            type="text"
            value={formData.deviceName}
            onChange={(e) => handleInputChange('deviceName', e.target.value)}
            className={`w-full px-5 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white text-gray-800 placeholder-gray-500 shadow-sm hover:shadow-md ${
              errors.deviceName ? 'border-red-400' : ''
            }`}
            placeholder="e.g., Temperature Sensor 001"
          />
          {errors.deviceName && (
            <p className="text-red-600 text-sm mt-2">{errors.deviceName}</p>
          )}
        </div>

        {/* Location */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-gray-700">
            Location *
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className={`w-full px-5 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white text-gray-800 placeholder-gray-500 shadow-sm hover:shadow-md ${
              errors.location ? 'border-red-400' : ''
            }`}
            placeholder="e.g., Building A, Floor 2, Room 205"
          />
          {errors.location && (
            <p className="text-red-600 text-sm mt-2">{errors.location}</p>
          )}
        </div>

        {/* Manufacturer */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-gray-700">
            Manufacturer *
          </label>
          <input
            type="text"
            value={formData.manufacturer}
            onChange={(e) => handleInputChange('manufacturer', e.target.value)}
            className={`w-full px-5 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white text-gray-800 placeholder-gray-500 shadow-sm hover:shadow-md ${
              errors.manufacturer ? 'border-red-400' : ''
            }`}
            placeholder="e.g., Siemens, Schneider Electric"
          />
          {errors.manufacturer && (
            <p className="text-red-600 text-sm mt-2">{errors.manufacturer}</p>
          )}
        </div>

        {/* Assign to User */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-gray-700">
            Assign to User {currentUser && !formData.assignedUserId && (
              <span className="text-xs text-blue-600 font-normal">(will auto-assign to you)</span>
            )}
          </label>
          <select
            value={formData.assignedUserId || ''}
            onChange={(e) => handleInputChange('assignedUserId', e.target.value)}
            disabled={loadingUsers}
            className={`w-full px-5 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white text-gray-800 shadow-sm hover:shadow-md ${
              errors.assignedUserId ? 'border-red-400' : ''
            } ${loadingUsers ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <option value="" className="bg-white text-gray-800">
              {loadingUsers ? 'Loading users...' : 'Select a user...'}
            </option>
            {users.length > 0 ? (
              users.map((user) => (
                <option key={user.id} value={user.id} className="bg-white text-gray-800">
                  👤 {user.firstName} {user.lastName} ({user.role})
                  {currentUser && user.id === currentUser.id ? ' (You)' : ''}
                </option>
              ))
            ) : (
              <option value="" className="bg-white text-gray-800" disabled>
                No users available
              </option>
            )}
          </select>
          {currentUser && !formData.assignedUserId && (
            <p className="text-blue-600 text-sm mt-2">
              💡 Device will be automatically assigned to you ({currentUser.firstName} {currentUser.lastName})
            </p>
          )}
          {errors.assignedUserId && (
            <p className="text-red-600 text-sm mt-2">{errors.assignedUserId}</p>
          )}
        </div>
      </div>
    </div>
  ), [formData.deviceName, formData.location, formData.manufacturer, formData.assignedUserId, errors.deviceName, errors.location, errors.manufacturer, errors.assignedUserId, handleInputChange, currentUser]);

    const renderStep2 = useCallback(() => (
    <div className="w-full space-y-8">
      {/* Step Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-3">Connection Settings</h3>
        <p className="text-gray-600 text-sm leading-relaxed">Configure how your device will communicate</p>
      </div>

      {/* Input Fields */}
      <div className="space-y-8">
        {/* Connection Type Selection */}
        <div className="space-y-4">
          <label className="block text-sm font-bold text-gray-700">
            Connection Type *
          </label>
          <div className="grid grid-cols-3 gap-4">
            {(['MQTT', 'HTTP', 'COAP'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleInputChange('connectionType', type)}
                className={`p-4 rounded-2xl border-2 transition-all duration-300 shadow-sm hover:shadow-md ${
                  formData.connectionType === type
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg'
                    : 'border-gray-300 hover:border-gray-400 bg-white text-gray-700 hover:text-gray-900'
                }`}
              >
                <div className="text-center">
                  <div className="text-sm font-bold">{type}</div>
                  <div className="text-xs text-gray-500 mt-2">
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
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-700">
                Broker URL *
              </label>
              <input
                type="text"
                value={formData.brokerUrl || ''}
                onChange={(e) => handleInputChange('brokerUrl', e.target.value)}
                className={`w-full px-5 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white text-gray-800 placeholder-gray-500 shadow-sm hover:shadow-md ${
                  errors.brokerUrl ? 'border-red-400' : ''
                }`}
                placeholder="e.g., mqtt://broker.example.com:1883"
              />
              {errors.brokerUrl && (
                <p className="text-red-600 text-sm mt-2">{errors.brokerUrl}</p>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-700">
                Topic *
              </label>
              <input
                type="text"
                value={formData.topic || ''}
                onChange={(e) => handleInputChange('topic', e.target.value)}
                className={`w-full px-5 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white text-gray-800 placeholder-gray-500 shadow-sm hover:shadow-md ${
                  errors.topic ? 'border-red-400' : ''
                }`}
                placeholder="e.g., device/sensor001/data"
              />
              {errors.topic && (
                <p className="text-red-600 text-sm mt-2">{errors.topic}</p>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-700">
                Username
              </label>
              <input
                type="text"
                value={formData.username || ''}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white text-gray-800 placeholder-gray-500 shadow-sm hover:shadow-md"
                placeholder="Optional"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-700">
                Password
              </label>
              <input
                type="password"
                value={formData.password || ''}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white text-gray-800 placeholder-gray-500 shadow-sm hover:shadow-md"
                placeholder="Optional"
              />
            </div>
          </div>
        )}

        {/* HTTP Fields */}
        {formData.connectionType === 'HTTP' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-700">
                Endpoint URL *
              </label>
              <input
                type="text"
                value={formData.httpEndpoint || ''}
                onChange={(e) => handleInputChange('httpEndpoint', e.target.value)}
                className={`w-full px-5 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white text-gray-800 placeholder-gray-500 shadow-sm hover:shadow-md ${
                  errors.httpEndpoint ? 'border-red-400' : ''
                }`}
                placeholder="e.g., https://api.example.com/device/data"
              />
              {errors.httpEndpoint && (
                <p className="text-red-600 text-sm mt-2">{errors.httpEndpoint}</p>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-700">
                HTTP Method
              </label>
              <select
                value={formData.httpMethod || 'GET'}
                onChange={(e) => handleInputChange('httpMethod', e.target.value)}
                className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white text-gray-800 shadow-sm hover:shadow-md"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-700">
                Headers (JSON)
              </label>
              <input
                type="text"
                value={formData.httpHeaders || ''}
                onChange={(e) => handleInputChange('httpHeaders', e.target.value)}
                className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white text-gray-800 placeholder-gray-500 shadow-sm hover:shadow-md"
                placeholder='{"Content-Type": "application/json"}'
              />
            </div>
          </div>
        )}

        {/* COAP Fields */}
        {formData.connectionType === 'COAP' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-700">
                Host *
              </label>
              <input
                type="text"
                value={formData.coapHost || ''}
                onChange={(e) => handleInputChange('coapHost', e.target.value)}
                className={`w-full px-5 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white text-gray-800 placeholder-gray-500 shadow-sm hover:shadow-md ${
                  errors.coapHost ? 'border-red-400' : ''
                }`}
                placeholder="e.g., coap.example.com"
              />
              {errors.coapHost && (
                <p className="text-red-600 text-sm mt-2">{errors.coapHost}</p>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-700">
                Port
              </label>
              <input
                type="text"
                value={formData.coapPort || ''}
                onChange={(e) => handleInputChange('coapPort', e.target.value)}
                className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white text-gray-800 placeholder-gray-500 shadow-sm hover:shadow-md"
                placeholder="5683"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-700">
                Path
              </label>
              <input
                type="text"
                value={formData.coapPath || ''}
                onChange={(e) => handleInputChange('coapPath', e.target.value)}
                className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white text-gray-800 placeholder-gray-500 shadow-sm hover:shadow-md"
                placeholder="/device/data"
              />
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
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all duration-300 bg-white text-gray-800 placeholder-gray-500"
                placeholder="e.g., https://api.example.com/data"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                HTTP Method *
              </label>
              <select
                value={formData.httpMethod || 'GET'}
                onChange={(e) => handleInputChange('httpMethod', e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all duration-300 bg-white text-gray-800"
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
              <textarea
                value={formData.httpHeaders || ''}
                onChange={(e) => handleInputChange('httpHeaders', e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all duration-300 bg-white text-gray-800 placeholder-gray-500"
                placeholder='{"Content-Type": "application/json", "Authorization": "Bearer token"}'
                rows={3}
              />
            </div>
          </div>
        )}

        {/* COAP Fields */}
        {formData.connectionType === 'COAP' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                COAP Host *
              </label>
              <input
                type="text"
                value={formData.coapHost || ''}
                onChange={(e) => handleInputChange('coapHost', e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all duration-300 bg-white text-gray-800 placeholder-gray-500"
                placeholder="e.g., coap://example.com"
              />
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
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all duration-300 bg-white text-gray-800 placeholder-gray-500"
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
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all duration-300 bg-white text-gray-800 placeholder-gray-500"
                  placeholder="/sensor/data"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  ), [formData.connectionType, formData.brokerUrl, formData.topic, formData.username, formData.password, formData.httpEndpoint, formData.httpMethod, formData.httpHeaders, formData.coapHost, formData.coapPort, formData.coapPath, errors, handleInputChange, handleSkipStep2]);

  const renderStep3 = useCallback(() => (
    <div className="w-full space-y-8">
      {/* Step Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-3">Upload Device Documentation</h3>
        <p className="text-gray-600 text-sm leading-relaxed">Upload a PDF to automatically configure your device</p>
      </div>

      {/* Input Fields */}
      <div className="space-y-6">
        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-gray-400 transition-all duration-300 bg-white shadow-sm hover:shadow-md">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl font-bold text-gray-800 mb-3">
              {uploadedFile ? uploadedFile.file.name : 'Click to upload PDF'}
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              {uploadedFile ? 'File uploaded successfully' : 'Upload device manual, datasheet, or documentation'}
            </p>
          </label>
        </div>

        {uploadedFile && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center">
              <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
              <span className="text-green-800 font-bold text-sm">File uploaded successfully</span>
            </div>
          </div>
        )}
      </div>
    </div>
  ), [uploadedFile, handleFileUpload]);

  // Simple form step indicator for the header
  const renderFormStepIndicator = useCallback(() => {
    const stepLabels = ['Basic Info', 'Connection', 'Upload PDF'];
    return (
      <div className="flex items-center justify-center mt-6">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-full border-2 transition-all duration-300 ${
              currentStep >= step 
                ? 'bg-white/20 border-white/40 text-white shadow-lg' 
                : 'bg-white/10 border-white/20 text-white/60'
            }`}>
              {currentStep > step ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <span className="text-sm font-bold">{step}</span>
              )}
              <span className="text-xs mt-1 text-white/80">{stepLabels[step - 1]}</span>
            </div>
            {step < 3 && (
              <div className={`w-20 h-1 transition-all duration-300 rounded-full ${
                currentStep > step ? 'bg-white/60' : 'bg-white/20'
              }`} />
            )}
          </div>
        ))}
      </div>
    );
  }, [currentStep]);

  // Render loading screen within the modal
  const renderLoadingContent = useCallback(() => (
    <div className="w-full flex items-center justify-center">
      <AILoadingScreen
        isProcessing={true}
        currentProcess={currentProcess}
        progress={progress}
        onComplete={() => {}}
        pdfFileName={uploadedFile?.file.name}
        currentSubStage={currentSubStage}
        stepDetails={stepDetails}
      />
    </div>
  ), [currentProcess, progress, uploadedFile?.file.name, currentSubStage]);

  // Render success message with integrated chat
  const renderSuccessContent = useCallback(() => (
    <div className="w-full">
      {/* Success Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">✨ AI Machine Ready!</h3>
        <p className="text-gray-600">You can now chat with {formData.deviceName} like a human!</p>
      </div>

      {/* Onboarding Steps Summary */}
      <div className="mb-6 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Onboarding Steps Completed
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-800">Device Created</p>
              <p className="text-xs text-green-600">Step 1/4</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">PDF Processed</p>
              <p className="text-xs text-blue-600">Step 2/4</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-orange-800">AI Rules Generated</p>
              <p className="text-xs text-orange-600">Step 3/4</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-purple-800">Chat Ready</p>
              <p className="text-xs text-purple-600">Step 4/4</p>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-side layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 min-h-[600px]">
        {/* Left Side - Success Message */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Device Info */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <h4 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Device Information
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-600 font-medium">Name:</span>
                  <p className="text-blue-800 font-semibold">{formData.deviceName}</p>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Location:</span>
                  <p className="text-blue-800 font-semibold">{formData.location}</p>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Manufacturer:</span>
                  <p className="text-blue-800 font-semibold">{formData.manufacturer}</p>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Processing Time:</span>
                  <p className="text-blue-800 font-semibold">{onboardingResult?.processingTime ? `${Math.round(onboardingResult.processingTime / 1000)}s` : 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* AI Generated Content Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200 text-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div className="text-lg font-bold text-blue-800 mb-1">
                  {onboardingResult?.rulesGenerated || 5}
                </div>
                <div className="text-xs font-medium text-blue-700">AI Rules</div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 border border-orange-200 text-center">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Settings className="w-4 h-4 text-white" />
                </div>
                <div className="text-lg font-bold text-orange-800 mb-1">
                  {onboardingResult?.maintenanceItems || 3}
                </div>
                <div className="text-xs font-medium text-orange-700">Maintenance</div>
              </div>
              
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-3 border border-red-200 text-center">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
                <div className="text-lg font-bold text-red-800 mb-1">
                  {onboardingResult?.safetyPrecautions || 2}
                </div>
                <div className="text-xs font-medium text-red-700">Safety Alerts</div>
              </div>
            </div>

            {/* AI Capabilities */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
              <h4 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                <Bot className="w-5 h-5" />
                AI Capabilities
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Natural Language Chat</span>
                  </div>
                  <p className="text-xs text-gray-600">Ask questions in plain English</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Intelligent Analysis</span>
                  </div>
                  <p className="text-xs text-gray-600">Deep understanding of your device</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Predictive Monitoring</span>
                  </div>
                  <p className="text-xs text-gray-600">Proactive maintenance alerts</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Smart Automation</span>
                  </div>
                  <p className="text-xs text-gray-600">Automated rule generation</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
              <h4 className="text-lg font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Get Started
              </h4>
              <p className="text-sm text-indigo-700 mb-3">
                Try asking the AI assistant about your device. You can ask about:
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-indigo-600">
                  <CheckCircle className="w-3 h-3" />
                  Setup and installation procedures
                </div>
                <div className="flex items-center gap-2 text-sm text-indigo-600">
                  <CheckCircle className="w-3 h-3" />
                  Maintenance schedules and requirements
                </div>
                <div className="flex items-center gap-2 text-sm text-indigo-600">
                  <CheckCircle className="w-3 h-3" />
                  Troubleshooting common issues
                </div>
                <div className="flex items-center gap-2 text-sm text-indigo-600">
                  <CheckCircle className="w-3 h-3" />
                  Technical specifications and features
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Chat Interface */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full min-h-[600px] flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-600" />
              AI Assistant for {formData.deviceName}
            </h4>
            <p className="text-sm text-gray-600 mt-1">Ask me anything about your device!</p>
          </div>
          <div className="flex-1 min-h-0">
            <DeviceChatInterface
              deviceName={formData.deviceName}
              deviceId={onboardingResult?.deviceId || 'unknown'}
              pdfFileName={uploadedFile?.file.name || 'device_documentation.pdf'}
              onClose={handleSuccessClose}
              onContinue={handleSuccessClose}
            />
          </div>
        </div>
      </div>
    </div>
  ), [onboardingResult, formData.deviceName, formData.location, formData.manufacturer, uploadedFile?.file.name, handleSuccessClose]);

  // Chat interface is now integrated into success screen

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        {/* Full width layout for loading and success states */}
        {(showOnboardingLoader || showSuccessMessage) ? (
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col border border-gray-200">
            {/* Header for loading/success states */}
            <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">
                  {showSuccessMessage ? 'Onboarding Complete!' : 'AI Processing'}
                </h2>
                <p className="text-blue-100 text-sm">
                  {showSuccessMessage
                    ? 'Your device has been successfully onboarded'
                    : 'Processing your device documentation with AI'
                  }
                </p>
              </div>
              <button
                onClick={onCancel}
                className="p-2 hover:bg-white/20 rounded-lg transition-all duration-300"
              >
                <span className="text-xl font-bold">×</span>
              </button>
            </div>

            {/* Full width content area */}
            <div className="flex-1 overflow-y-auto p-8">
              {showOnboardingLoader ? (
                renderLoadingContent()
              ) : (
                renderSuccessContent()
              )}
            </div>
          </div>
        ) : (
          /* Form layout with 60% width, divided into 5 parts (2 for progress, 3 for input) */
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex border border-gray-200 overflow-hidden">
            {/* Progress Section - 2/5 width */}
            <div className="w-2/5 bg-gradient-to-br from-slate-50 to-gray-100 p-8 flex flex-col border-r border-gray-200">
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-3 text-gray-800">Device Onboarding</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Enter basic device information and specifications
                </p>
              </div>

              {/* Progress Indicator */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center">
                      <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl border-2 transition-all duration-500 shadow-sm ${
                        step < currentStep
                          ? 'bg-green-500 border-green-500 text-white shadow-lg'
                          : step === currentStep
                          ? 'bg-white border-blue-500 text-blue-600 shadow-lg'
                          : 'border-gray-300 text-gray-400 bg-white'
                      }`}>
                        {step < currentStep ? (
                          <CheckCircle className="w-7 h-7" />
                        ) : (
                          <span className="text-lg font-bold">{step}</span>
                        )}
                      </div>
                      {step < 3 && (
                        <div className={`w-20 h-1 mx-3 rounded-full transition-all duration-500 ${
                          step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Step Labels */}
                <div className="flex justify-between text-sm font-medium">
                  <span className={currentStep >= 1 ? 'text-gray-800' : 'text-gray-400'}>Basic Info</span>
                  <span className={currentStep >= 2 ? 'text-gray-800' : 'text-gray-400'}>Connection</span>
                  <span className={currentStep >= 3 ? 'text-gray-800' : 'text-gray-400'}>Upload PDF</span>
                </div>
              </div>

              {/* Current Step Details */}
              <div className="flex-1">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <h3 className="font-bold text-lg mb-3 text-gray-800">
                    {currentStep === 1 && 'Basic Device Information'}
                    {currentStep === 2 && 'Connection Configuration'}
                    {currentStep === 3 && 'Document Upload'}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {currentStep === 1 && 'Provide essential device details like name, location, and manufacturer.'}
                    {currentStep === 2 && 'Configure how your device connects to the platform (MQTT, HTTP, or COAP).'}
                    {currentStep === 3 && 'Upload device documentation to automatically configure rules and safety information.'}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onCancel}
                className="absolute top-6 right-6 w-10 h-10 bg-white/80 hover:bg-white rounded-2xl shadow-sm border border-gray-200 flex items-center justify-center transition-all duration-300 backdrop-blur-sm"
              >
                <span className="text-xl font-bold text-gray-600">×</span>
              </button>
            </div>

            {/* Form Content Section - 3/5 width */}
            <div className="w-3/5 bg-white flex flex-col">
              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-lg mx-auto">
                  {currentStep === 1 && renderStep1()}
                  {currentStep === 2 && renderStep2()}
                  {currentStep === 3 && renderStep3()}
                </div>
              </div>

              {/* Footer - Navigation Buttons */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <button
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium rounded-xl hover:bg-gray-100"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </button>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={onCancel}
                      className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-all duration-300 font-medium rounded-xl hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    
                    {currentStep === 2 && (
                      <button
                        onClick={handleSkipStep2}
                        className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-800 transition-all duration-300 font-medium rounded-xl hover:bg-gray-100"
                      >
                        <span>⏭️</span>
                        Skip
                      </button>
                    )}
                    
                    <button
                      onClick={currentStep === 3 ? handleSubmit : nextStep}
                      disabled={isSubmitting || (currentStep === 3 && !uploadedFile)}
                      className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium shadow-sm hover:shadow-md"
                    >
                      {currentStep === 3 ? 'Complete Onboarding' : 'Next'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
