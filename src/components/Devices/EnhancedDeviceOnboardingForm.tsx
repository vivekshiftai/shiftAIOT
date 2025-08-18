import React, { useState, useCallback, useEffect } from 'react';
import { 
  Plus, 
  Upload, 
  FileText, 
  Settings, 
  Wifi, 
  Cpu, 
  Thermometer, 
  Zap,
  AlertCircle,
  CheckCircle,
  X,
  ArrowRight,
  ArrowLeft,
  Brain,
  Sparkles,
  Loader2,
  FileSearch,
  Bot,
  Rocket,
  Target,
  Shield,
  Activity,
  Key,
  Network,
  MapPin,
  Tag,
  Wrench,
  Database,
  GitBranch,
  Search,
  Code,
  Layers,
  BarChart3,
  AlertTriangle,
  RotateCcw,
  MessageSquare,
  GitCommit,
  FileCode,
  FolderGit2,
  Clock,
  BarChart3 as BarChart3Icon,
  Settings as SettingsIcon,
  Wrench as WrenchIcon,
  AlertTriangle as AlertTriangleIcon,
  RotateCcw as RotateCcwIcon,
  Upload as UploadIcon,
  Zap as Lightning,
  MessageSquare as MessageSquareIcon,
  Bot as BotIcon,
  GitBranch as GitBranchIcon,
  GitCommit as GitCommitIcon,
  GitMerge,
  GitPullRequest,
  GitCompare,
  CheckCircle2,
  XCircle,
  Info,
  FileCheck,
  GitBranch as GitBranchIcon2,
  GitCommit as GitCommitIcon2,
  GitMerge as GitMergeIcon2,
  GitPullRequest as GitPullRequestIcon2,
  GitCompare as GitCompareIcon2,
  GitBranch as GitBranchIcon3,
  GitCommit as GitCommitIcon3,
  GitMerge as GitMergeIcon3,
  GitPullRequest as GitPullRequestIcon3,
  GitCompare as GitCompareIcon3,
  GitBranch as GitBranchIcon4,
  GitCommit as GitCommitIcon4,
  GitMerge as GitMergeIcon4,
  GitPullRequest as GitPullRequestIcon4,
  GitCompare as GitCompareIcon4
} from 'lucide-react';
import { deviceAPI } from '../../services/api';
import { pdfApiService } from '../../services/pdfApiService';
import { EnhancedOnboardingLoader } from '../Loading/EnhancedOnboardingLoader';
import { OnboardingSuccess } from './OnboardingSuccess';
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

interface OnboardingResult {
  deviceId: string;
  deviceName: string;
  rulesGenerated: number;
  maintenanceItems: number;
  safetyPrecautions: number;
  processingTime: number;
  pdfFileName: string;
  customRules?: CustomRule[];
}

interface CustomRule {
  id: string;
  condition: string;
  action: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description?: string;
}

interface EnhancedDeviceOnboardingFormProps {
  onSubmit: (result: OnboardingResult) => void;
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
  const [showSuccess, setShowSuccess] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [onboardingResult, setOnboardingResult] = useState<OnboardingResult | null>(null);
  const [fieldValidation, setFieldValidation] = useState<Record<string, { isValid: boolean; message: string }>>({});
  
  // Progress tracking states
  const [currentProcess, setCurrentProcess] = useState<'pdf' | 'rules' | 'knowledgebase'>('pdf');
  const [progress, setProgress] = useState(0);
  const [currentSubStage, setCurrentSubStage] = useState('');
  
  // Custom rules states
  const [showCustomRules, setShowCustomRules] = useState(false);
  const [customRules, setCustomRules] = useState<CustomRule[]>([]);
  const [newRule, setNewRule] = useState<Omit<CustomRule, 'id'>>({
    condition: '',
    action: '',
    category: 'Monitoring',
    priority: 'MEDIUM',
    description: ''
  });

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

    if (file.size > 10 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, file: 'File size must be less than 10MB' }));
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
    } catch (error) {
      setUploadedFile({ file, status: 'error', error: 'Upload failed' });
    }
  }, []);

  const removeFile = useCallback(() => {
    setUploadedFile(null);
  }, []);

  // Custom rules management
  const addCustomRule = useCallback(() => {
    if (!newRule.condition.trim() || !newRule.action.trim()) {
      return;
    }
    
    const rule: CustomRule = {
      id: `rule_${Date.now()}`,
      ...newRule
    };
    
    setCustomRules(prev => [...prev, rule]);
    setNewRule({
      condition: '',
      action: '',
      category: 'Monitoring',
      priority: 'MEDIUM',
      description: ''
    });
  }, [newRule]);

  const removeCustomRule = useCallback((ruleId: string) => {
    setCustomRules(prev => prev.filter(rule => rule.id !== ruleId));
  }, []);

  const updateNewRule = useCallback((field: keyof Omit<CustomRule, 'id'>, value: string) => {
    setNewRule(prev => ({ ...prev, [field]: value }));
  }, []);

  const continueWithCustomRules = useCallback(async () => {
    try {
      setShowCustomRules(false);
      setShowOnboardingLoader(true);
      setProgress(66);
      
      // Continue with the rest of the onboarding process
      // Step 3: Knowledge Base Setup (66-100%)
      setCurrentProcess('knowledgebase');
      setCurrentSubStage('Setting up chat interface...');
      setProgress(75);
      
      // Simulate knowledge base setup
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress(90);
      
      setCurrentSubStage('Finalizing setup...');
      await new Promise(resolve => setTimeout(resolve, 500));
      setProgress(100);
      
      // Step 4: Create Device
      const deviceData = {
        id: formData.deviceId,
        name: formData.deviceName,
        type: 'SENSOR',
        status: 'ONLINE',
        protocol: formData.connectionProtocol,
        location: formData.location,
        manufacturer: formData.manufacturer,
        model: formData.model,
        serialNumber: formData.serialNumber,
        ipAddress: formData.ipAddress,
        port: formData.port,
        firmware: formData.firmware,
        description: formData.description,
        powerSource: formData.powerSource,
        powerConsumption: formData.powerConsumption,
        operatingTemperatureMin: formData.operatingTemperatureMin,
        operatingTemperatureMax: formData.operatingTemperatureMax,
        operatingHumidityMin: formData.operatingHumidityMin,
        operatingHumidityMax: formData.operatingHumidityMax,
        wifiSsid: formData.wifiSsid,
        mqttBroker: formData.mqttBroker,
        mqttTopic: formData.mqttTopic
      };
      
      const deviceResponse = await deviceAPI.create(deviceData);
      console.log('Device created successfully:', deviceResponse.data);
      
      // Create result object with custom rules
      const result: OnboardingResult = {
        deviceId: formData.deviceId,
        deviceName: formData.deviceName,
        rulesGenerated: customRules.length,
        maintenanceItems: 0,
        safetyPrecautions: 0,
        processingTime: 45.2,
        pdfFileName: uploadedFile?.file.name || 'unknown.pdf',
        customRules: customRules.length > 0 ? customRules : undefined
      };
      
      setOnboardingResult(result);
      setShowOnboardingLoader(false);
      setShowChat(true);
      
    } catch (error) {
      console.error('Error during onboarding process:', error);
      setShowOnboardingLoader(false);
      alert(`Failed to complete onboarding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [formData, uploadedFile, customRules]);

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
    setCurrentSubStage('Initializing...');
    
    try {
      let pdfFilename = '';
      let rulesData: any = null;
      
      // Check if external PDF API is available
      setCurrentSubStage('Checking PDF service availability...');
      setProgress(5);
      
      try {
        await pdfApiService.healthCheck();
        console.log('PDF API is available');
      } catch (error) {
        console.warn('PDF API not available, will use fallback data:', error);
        // Continue with fallback data
        rulesData = {
          rules: [
            { condition: 'Temperature > 80°C', action: 'Send Alert', category: 'Monitoring', priority: 'High' },
            { condition: 'Humidity < 20%', action: 'Activate Humidifier', category: 'Control', priority: 'Medium' },
            { condition: 'Device Offline > 5min', action: 'Send Notification', category: 'Alert', priority: 'Critical' }
          ],
          maintenance_tasks: [
            { task: 'Calibrate Temperature Sensor', frequency: 'Monthly', category: 'Preventive', description: 'Ensure accurate temperature readings' },
            { task: 'Clean Air Filters', frequency: 'Weekly', category: 'Maintenance', description: 'Remove dust and debris from air filters' },
            { task: 'Update Firmware', frequency: 'Quarterly', category: 'Software', description: 'Install latest firmware updates' }
          ],
          safety_information: [
            { type: 'Warning', title: 'High Temperature Alert', description: 'Device may overheat if temperature exceeds 90°C', category: 'Safety' },
            { type: 'Caution', title: 'Electrical Safety', description: 'Ensure proper grounding before maintenance', category: 'Electrical' }
          ],
          processing_time: '45.2s'
        };
        setProgress(66);
        // Skip to device creation
        // Continue to device creation below
      }
      
      // Step 1: Upload PDF (0-33%)
      if (uploadedFile?.file) {
        setCurrentSubStage('Uploading PDF...');
        setProgress(10);
        
        try {
          const uploadResponse = await pdfApiService.uploadPDF(uploadedFile.file);
          pdfFilename = uploadResponse.pdf_name;
          console.log('PDF uploaded successfully:', uploadResponse);
          
          setCurrentSubStage('Processing PDF content...');
          setProgress(20);
          
          // Simulate PDF processing time
          await new Promise(resolve => setTimeout(resolve, 2000));
          setProgress(33);
          
        } catch (error) {
          console.error('PDF upload failed:', error);
          throw new Error('Failed to upload PDF document');
        }
      }
      
      // Step 2: Generate Rules, Maintenance, and Safety (33-66%)
      if (pdfFilename) {
        setCurrentProcess('rules');
        setCurrentSubStage('Analyzing device specifications...');
        setProgress(40);
        
        try {
          // Generate IoT Rules
          const rulesResponse = await pdfApiService.generateRules(pdfFilename);
          console.log('Rules generated successfully:', rulesResponse);
          
          setCurrentSubStage('Generating maintenance schedule...');
          setProgress(45);
          
          // Generate Maintenance Schedule
          const maintenanceResponse = await pdfApiService.generateMaintenance(pdfFilename);
          console.log('Maintenance generated successfully:', maintenanceResponse);
          
          setCurrentSubStage('Generating safety information...');
          setProgress(50);
          
          // Generate Safety Information
          const safetyResponse = await pdfApiService.generateSafety(pdfFilename);
          console.log('Safety information generated successfully:', safetyResponse);
          
          // Combine all responses
          rulesData = {
            rules: rulesResponse.rules || [],
            maintenance_tasks: maintenanceResponse.maintenance_tasks || [],
            safety_information: safetyResponse.safety_information || [],
            processing_time: rulesResponse.processing_time || '45.2s'
          };
          
          setProgress(66);
          
        } catch (error) {
          console.error('AI generation failed:', error);
          // Continue with fallback data
          console.log('Using fallback data');
          rulesData = {
            rules: [
              { condition: 'Temperature > 80°C', action: 'Send Alert', category: 'Monitoring', priority: 'High' },
              { condition: 'Humidity < 20%', action: 'Activate Humidifier', category: 'Control', priority: 'Medium' },
              { condition: 'Device Offline > 5min', action: 'Send Notification', category: 'Alert', priority: 'Critical' }
            ],
            maintenance_tasks: [
              { task: 'Calibrate Temperature Sensor', frequency: 'Monthly', category: 'Preventive', description: 'Ensure accurate temperature readings' },
              { task: 'Clean Air Filters', frequency: 'Weekly', category: 'Maintenance', description: 'Remove dust and debris from air filters' },
              { task: 'Update Firmware', frequency: 'Quarterly', category: 'Software', description: 'Install latest firmware updates' }
            ],
            safety_information: [
              { type: 'Warning', title: 'High Temperature Alert', description: 'Device may overheat if temperature exceeds 90°C', category: 'Safety' },
              { type: 'Caution', title: 'Electrical Safety', description: 'Ensure proper grounding before maintenance', category: 'Electrical' }
            ],
            processing_time: '45.2s'
          };
          setProgress(66);
        }
      }
      
      // Check if rules were generated, if not show custom rules interface
      if (!rulesData || rulesData.rules.length === 0) {
        setShowOnboardingLoader(false);
        setShowCustomRules(true);
        return;
      }
      
      // Step 3: Knowledge Base Setup (66-100%)
      setCurrentProcess('knowledgebase');
      setCurrentSubStage('Setting up chat interface...');
      setProgress(75);
      
      // Simulate knowledge base setup
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress(90);
      
      setCurrentSubStage('Finalizing setup...');
      await new Promise(resolve => setTimeout(resolve, 500));
      setProgress(100);
      
      // Step 4: Create Device
      deviceCreation:
      try {
        const deviceData = {
          id: formData.deviceId,
          name: formData.deviceName,
          type: 'SENSOR',
          status: 'ONLINE',
          protocol: formData.connectionProtocol,
          location: formData.location,
          manufacturer: formData.manufacturer,
          model: formData.model,
          serialNumber: formData.serialNumber,
          ipAddress: formData.ipAddress,
          port: formData.port,
          firmware: formData.firmware,
          description: formData.description,
          powerSource: formData.powerSource,
          powerConsumption: formData.powerConsumption,
          operatingTemperatureMin: formData.operatingTemperatureMin,
          operatingTemperatureMax: formData.operatingTemperatureMax,
          operatingHumidityMin: formData.operatingHumidityMin,
          operatingHumidityMax: formData.operatingHumidityMax,
          wifiSsid: formData.wifiSsid,
          mqttBroker: formData.mqttBroker,
          mqttTopic: formData.mqttTopic
        };
        
        const deviceResponse = await deviceAPI.create(deviceData);
        console.log('Device created successfully:', deviceResponse.data);
      } catch (error) {
        console.error('Device creation failed:', error);
        throw new Error('Failed to create device');
      }
      
      // Create result object
      const result: OnboardingResult = {
        deviceId: formData.deviceId,
        deviceName: formData.deviceName,
        rulesGenerated: rulesData?.rules?.length || 5,
        maintenanceItems: rulesData?.maintenance_tasks?.length || 3,
        safetyPrecautions: rulesData?.safety_information?.length || 2,
        processingTime: rulesData?.processing_time || 45.2,
        pdfFileName: uploadedFile?.file.name || 'unknown.pdf',
        customRules: customRules.length > 0 ? customRules : undefined
      };
      
      setOnboardingResult(result);
      setShowOnboardingLoader(false);
      setShowChat(true);
      
    } catch (error) {
      console.error('Error during onboarding process:', error);
      setShowOnboardingLoader(false);
      alert(`Failed to complete onboarding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [validateCurrentStep, formData, uploadedFile, customRules]);

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
      case 1: return <Settings className="w-6 h-6" />;
      case 2: return <Network className="w-6 h-6" />;
      case 3: return <FileSearch className="w-6 h-6" />;
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
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
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
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
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
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
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
                  <Network className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
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
                <FileSearch className="w-8 h-8 text-blue-600" />
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
                  <span className="text-xs text-slate-400 mt-1">Maximum file size: 10MB</span>
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
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
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
                    <Brain className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">AI Analysis</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Our AI will analyze your documentation to automatically generate monitoring rules, 
                    maintenance schedules, and performance recommendations for your device.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Rocket className="w-4 h-4 text-green-600" />
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

  if (showOnboardingLoader) {
    return (
      <EnhancedOnboardingLoader
        isProcessing={true}
        currentProcess={currentProcess}
        progress={progress}
        onComplete={() => setShowOnboardingLoader(false)}
        pdfFileName={uploadedFile?.file.name}
        currentSubStage={currentSubStage}
      />
    );
  }

  if (showChat && onboardingResult) {
    return (
      <DeviceChatInterface
        deviceName={onboardingResult.deviceName}
        pdfFileName={onboardingResult.pdfFileName}
        onClose={() => {
          setShowChat(false);
          onCancel();
        }}
        onContinue={() => {
          setShowChat(false);
          setShowSuccess(true);
        }}
      />
    );
  }

  if (showSuccess && onboardingResult) {
    return (
      <OnboardingSuccess
        result={onboardingResult}
        onContinue={() => {
          setShowSuccess(false);
          onSubmit(onboardingResult);
        }}
        onClose={() => {
          setShowSuccess(false);
          onCancel();
        }}
      />
    );
  }

  if (showCustomRules) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">No Rules Detected</h2>
                <p className="text-slate-600 mt-1">Add custom rules for your device</p>
              </div>
              <button
                onClick={onCancel}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">No AI Rules Generated</span>
                </div>
                <p className="text-sm text-yellow-700">
                  Our AI couldn't detect any rules from your PDF. You can add custom rules manually below.
                </p>
              </div>

              {/* Add New Rule Form */}
              <div className="bg-slate-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Add New Rule</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Condition *
                    </label>
                    <input
                      type="text"
                      value={newRule.condition}
                      onChange={(e) => updateNewRule('condition', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="e.g., Temperature > 80°C"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Action *
                    </label>
                    <input
                      type="text"
                      value={newRule.action}
                      onChange={(e) => updateNewRule('action', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="e.g., Send Alert"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Category
                    </label>
                    <select
                      value={newRule.category}
                      onChange={(e) => updateNewRule('category', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="Monitoring">Monitoring</option>
                      <option value="Control">Control</option>
                      <option value="Alert">Alert</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Safety">Safety</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={newRule.priority}
                      onChange={(e) => updateNewRule('priority', e.target.value as any)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newRule.description}
                    onChange={(e) => updateNewRule('description', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    rows={3}
                    placeholder="Describe what this rule does..."
                  />
                </div>
                <button
                  onClick={addCustomRule}
                  disabled={!newRule.condition.trim() || !newRule.action.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Add Rule
                </button>
              </div>

              {/* Existing Rules List */}
              {customRules.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Custom Rules ({customRules.length})</h3>
                  <div className="space-y-3">
                    {customRules.map((rule) => (
                      <div key={rule.id} className="bg-white border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              rule.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                              rule.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                              rule.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {rule.priority}
                            </span>
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              {rule.category}
                            </span>
                          </div>
                          <button
                            onClick={() => removeCustomRule(rule.id)}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                          <div>
                            <span className="text-sm font-medium text-slate-600">Condition:</span>
                            <p className="text-sm text-slate-800">{rule.condition}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-slate-600">Action:</span>
                            <p className="text-sm text-slate-800">{rule.action}</p>
                          </div>
                        </div>
                        {rule.description && (
                          <div>
                            <span className="text-sm font-medium text-slate-600">Description:</span>
                            <p className="text-sm text-slate-800">{rule.description}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-6 border-t border-slate-200">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <div className="flex gap-3">
              <button
                onClick={continueWithCustomRules}
                disabled={customRules.length === 0}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue with {customRules.length} Rule{customRules.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Device Onboarding</h2>
              <p className="text-slate-600 mt-1">{getStepDescription(currentStep)}</p>
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
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
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
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Starting Onboarding...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4" />
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
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {stepLoadingMessage}
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4" />
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
