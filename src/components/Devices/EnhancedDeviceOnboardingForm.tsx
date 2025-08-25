import React, { useState, useCallback, useEffect } from 'react';
import { Upload, FileText, Settings, Bot, CheckCircle, AlertTriangle, MessageSquare, Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import { unifiedOnboardingService, UnifiedOnboardingProgress } from '../../services/unifiedOnboardingService';
import { deviceAPI, ruleAPI, knowledgeAPI, userAPI } from '../../services/api';
import EnhancedOnboardingLoader from '../Loading/EnhancedOnboardingLoader';
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

  // Fetch users for assignment dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        logInfo('EnhancedDeviceOnboardingForm', 'Attempting to fetch users for device assignment');
        const response = await userAPI.getAll();
        setUsers(response.data);
        logInfo('EnhancedDeviceOnboardingForm', 'Users fetched successfully', { count: response.data.length });
      } catch (error: any) {
        logError('EnhancedDeviceOnboardingForm', 'Failed to fetch users', error instanceof Error ? error : new Error('Unknown error'));
        
        // Check if it's an authentication error
        if (error.response?.status === 401) {
          logWarn('EnhancedDeviceOnboardingForm', 'Authentication error when fetching users - user may not be logged in or token expired');
        }
        
        // Set some dummy users as fallback
        const fallbackUsers = [
          { id: 'user1', firstName: 'John', lastName: 'Doe', role: 'ADMIN' },
          { id: 'user2', firstName: 'Jane', lastName: 'Smith', role: 'USER' },
          { id: 'user3', firstName: 'Bob', lastName: 'Johnson', role: 'USER' }
        ];
        setUsers(fallbackUsers);
        logInfo('EnhancedDeviceOnboardingForm', 'Using fallback users due to fetch failure', { count: fallbackUsers.length });
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
        setCurrentStep(prev => (prev + 1) as Step);
      }
    }
  }, [currentStep, validateStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => (prev - 1) as Step);
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
          setProgress(progress.progress);
          setCurrentSubStage(progress.message);
          
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
              setCurrentProcess('rules');
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
              setCurrentProcess('rules');
              logInfo('Onboarding', 'Processing safety precautions stage', { progress: progress.progress });
              break;
            case 'complete':
              setCurrentProcess('knowledgebase');
              logInfo('Onboarding', 'Processing completion stage', { progress: progress.progress });
              break;
          }
          
          // Log detailed step information
          if (progress.stepDetails) {
            setStepDetails(progress.stepDetails);
            logInfo('Onboarding', `Step ${progress.stepDetails.currentStep}/${progress.stepDetails.totalSteps}: ${progress.stepDetails.stepName} - ${progress.message}`);
          }
        }
      );

      // Set success result with processing time
      const finalProcessingTime = result.processingTime || (Date.now() - onboardingStartTime);
      setOnboardingResult({
        ...result,
        processingTime: finalProcessingTime
      });

      logInfo('EnhancedDeviceOnboardingForm', 'Onboarding process completed successfully', {
        deviceId: result.deviceId,
        deviceName: result.deviceName,
        processingTime: finalProcessingTime,
        rulesGenerated: result.rulesGenerated,
        maintenanceItems: result.maintenanceItems,
        safetyPrecautions: result.safetyPrecautions
      });

      setTimeout(() => {
        setShowOnboardingLoader(false);
        setShowSuccessMessage(true);
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
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Step Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Basic Device Information</h3>
        <p className="text-gray-600">Enter the essential details about your device</p>
      </div>

      {/* Input Fields */}
      <div className="space-y-6">
        {/* First Row - Device Name and Location */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Device Name *
            </label>
            <input
              type="text"
              value={formData.deviceName}
              onChange={(e) => handleInputChange('deviceName', e.target.value)}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all duration-300 bg-white text-gray-800 placeholder-gray-500 ${
                errors.deviceName ? 'border-red-400' : 'border-gray-300'
              }`}
              placeholder="e.g., Temperature Sensor 001"
            />
            {errors.deviceName && (
              <p className="text-red-600 text-sm mt-1">{errors.deviceName}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Location *
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all duration-300 bg-white text-gray-800 placeholder-gray-500 ${
                errors.location ? 'border-red-400' : 'border-gray-300'
              }`}
              placeholder="e.g., Building A, Floor 2, Room 205"
            />
            {errors.location && (
              <p className="text-red-600 text-sm mt-1">{errors.location}</p>
            )}
          </div>
        </div>

        {/* Second Row - Manufacturer and Device Status */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Manufacturer *
            </label>
            <input
              type="text"
              value={formData.manufacturer}
              onChange={(e) => handleInputChange('manufacturer', e.target.value)}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all duration-300 bg-white text-gray-800 placeholder-gray-500 ${
                errors.manufacturer ? 'border-red-400' : 'border-gray-300'
              }`}
              placeholder="e.g., Siemens, Schneider Electric"
            />
            {errors.manufacturer && (
              <p className="text-red-600 text-sm mt-1">{errors.manufacturer}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Assign to User {currentUser && !formData.assignedUserId && (
                <span className="text-xs text-indigo-600 font-normal">(will auto-assign to you)</span>
              )}
            </label>
            <select
              value={formData.assignedUserId || ''}
              onChange={(e) => handleInputChange('assignedUserId', e.target.value)}
              disabled={loadingUsers}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all duration-300 bg-white text-gray-800 ${
                errors.assignedUserId ? 'border-red-400' : 'border-gray-300'
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
              <p className="text-indigo-600 text-sm mt-1">
                💡 Device will be automatically assigned to you ({currentUser.firstName} {currentUser.lastName})
              </p>
            )}
            {errors.assignedUserId && (
              <p className="text-red-600 text-sm mt-1">{errors.assignedUserId}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  ), [formData.deviceName, formData.location, formData.manufacturer, formData.assignedUserId, errors.deviceName, errors.location, errors.manufacturer, errors.assignedUserId, handleInputChange, currentUser]);

    const renderStep2 = useCallback(() => (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Step Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Connection Settings</h3>
        <p className="text-gray-600">Configure how your device will communicate</p>
      </div>

      {/* Input Fields */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Connection Type *
          </label>
          <div className="grid grid-cols-3 gap-4">
            {(['MQTT', 'HTTP', 'COAP'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleInputChange('connectionType', type)}
                className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                  formData.connectionType === type
                    ? 'border-indigo-400 bg-indigo-500/20 text-indigo-700 shadow-lg'
                    : 'border-gray-300 hover:border-gray-400 bg-white text-gray-700 hover:text-gray-900'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg font-semibold">{type}</div>
                  <div className="text-xs text-gray-500 mt-1">
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
              <label className="block text-sm font-semibold text-gray-700">
                Broker URL *
              </label>
              <input
                type="text"
                value={formData.brokerUrl || ''}
                onChange={(e) => handleInputChange('brokerUrl', e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all duration-300 bg-white text-gray-800 placeholder-gray-500 ${
                  errors.brokerUrl ? 'border-red-400' : 'border-gray-300'
                }`}
                placeholder="e.g., mqtt://broker.example.com:1883"
              />
              {errors.brokerUrl && (
                <p className="text-red-600 text-sm mt-1">{errors.brokerUrl}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Topic *
              </label>
              <input
                type="text"
                value={formData.topic || ''}
                onChange={(e) => handleInputChange('topic', e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all duration-300 bg-white text-gray-800 placeholder-gray-500 ${
                  errors.topic ? 'border-red-400' : 'border-gray-300'
                }`}
                placeholder="e.g., device/sensor001/data"
              />
              {errors.topic && (
                <p className="text-red-600 text-sm mt-1">{errors.topic}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username || ''}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all duration-300 bg-white text-gray-800 placeholder-gray-500"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password || ''}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all duration-300 bg-white text-gray-800 placeholder-gray-500"
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
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Step Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Upload Device Documentation</h3>
        <p className="text-gray-600">Upload a PDF to automatically configure your device</p>
      </div>

      {/* Input Fields */}
      <div className="space-y-6">
        <div className="border-2 border-dashed border-gray-400 rounded-lg p-8 text-center hover:border-gray-500 transition-all duration-300 bg-gray-50">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-800 mb-2">
              {uploadedFile ? uploadedFile.file.name : 'Click to upload PDF'}
            </p>
            <p className="text-gray-600">
              {uploadedFile ? 'File uploaded successfully' : 'Upload device manual, datasheet, or documentation'}
            </p>
          </label>
        </div>

        {uploadedFile && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
              <span className="text-green-800 font-semibold">File uploaded successfully</span>
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
    <div className="w-full max-w-4xl mx-auto flex items-center justify-center">
      <EnhancedOnboardingLoader
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
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Success Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">✨ AI Machine Ready!</h3>
        <p className="text-gray-600">You can now chat with {formData.deviceName} like a human!</p>
      </div>

      {/* Device Info */}
      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-green-600 font-medium">Device:</span>
            <p className="text-green-800 font-semibold">{formData.deviceName}</p>
          </div>
          <div>
            <span className="text-green-600 font-medium">Processing Time:</span>
            <p className="text-green-800 font-semibold">{onboardingResult?.processingTime ? Math.round(onboardingResult.processingTime / 1000) : 0}s</p>
          </div>
          <div>
            <span className="text-green-600 font-medium">AI Rules:</span>
            <p className="text-green-800 font-semibold">{onboardingResult?.rulesGenerated || 5}</p>
          </div>
          <div>
            <span className="text-green-600 font-medium">Maintenance:</span>
            <p className="text-green-800 font-semibold">{onboardingResult?.maintenanceItems || 3}</p>
          </div>
        </div>
      </div>

      {/* Integrated Chat Interface */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-96">
        <DeviceChatInterface
          deviceName={formData.deviceName}
          deviceId={onboardingResult?.deviceId || 'unknown'}
          pdfFileName={uploadedFile?.file.name || 'device_documentation.pdf'}
          onClose={handleSuccessClose}
          onContinue={handleSuccessClose}
        />
      </div>
    </div>
  ), [onboardingResult, formData.deviceName, onboardingStartTime, uploadedFile?.file.name, handleSuccessClose]);

  // Chat interface is now integrated into success screen

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
        <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col border border-white/30">
          {/* Header - Hidden during loading */}
          {!showOnboardingLoader && (
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white flex-shrink-0 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold drop-shadow-lg">
                    {showSuccessMessage ? 'Onboarding Complete!' : 'Device Onboarding'}
                  </h2>
                  <p className="text-white/90 mt-2 text-lg">
                    {showSuccessMessage
                      ? 'Your device has been successfully onboarded'
                      : 'Enter basic device information and specifications'
                    }
                  </p>
                </div>
                {!showSuccessMessage && (
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
          )}

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
                  
                  {currentStep === 2 && (
                    <button
                      onClick={handleSkipStep2}
                      className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-800 transition-all duration-300 hover:bg-white/20 rounded-xl font-medium"
                    >
                      <span>⏭️</span>
                      Skip
                    </button>
                  )}
                  
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

      {/* Chat Interface Modal - No longer needed as it's integrated into success screen */}
    </>
  );
};
