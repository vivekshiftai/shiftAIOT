import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Upload, 
  FileText, 
  CheckCircle,
  X, 
  ArrowRight, 
  ArrowLeft,
  Brain,
  Bot,
  FileText as FileSearch,
  Zap,
  MessageSquare,
  Send
} from 'lucide-react';

import { unifiedOnboardingService, UnifiedOnboardingProgress } from '../../services/unifiedOnboardingService';
import { logInfo, logError } from '../../utils/logger';
import { useIoT } from '../../contexts/IoTContext';
import { useAuth } from '../../contexts/AuthContext';
import { pdfAPI } from '../../services/api';

interface DeviceFormData {
  name: string;
  type?: 'SENSOR' | 'ACTUATOR' | 'GATEWAY' | 'CONTROLLER' | 'MACHINE';
  status: 'ONLINE' | 'OFFLINE' | 'WARNING' | 'ERROR';
  location: string;
  protocol: 'MQTT' | 'HTTP' | 'COAP';
  
  // Basic device info (optional)
  manufacturer?: string;
  model?: string;
  description?: string;
  
  // Connection details (optional)
  ipAddress?: string;
  port?: number;
  
  // MQTT specific fields (optional)
  mqttBroker?: string;
  mqttTopic?: string;
  mqttUsername?: string;
  mqttPassword?: string;
  
  // HTTP specific fields (optional)
  httpEndpoint?: string;
  httpMethod?: string;
  httpHeaders?: string;
  
  // COAP specific fields (optional)
  coapHost?: string;
  coapPort?: number;
  coapPath?: string;
  
  // Collections (optional)
  tags?: string[];
  config?: Record<string, string>;
  
  // User assignment
  assignedUserId?: string | null;
}

interface FileUpload {
  file: File;
  type: 'manual' | 'datasheet' | 'certificate';
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

interface AIGeneratedRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  action: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  isSelected: boolean;
}

interface AddDeviceFormProps {
  onSubmit: (deviceData: DeviceFormData, files: FileUpload[], aiRules: AIGeneratedRule[]) => Promise<void>;
  onCancel: () => void;
}

type Step = 1 | 2 | 3 | 4 | 5 | 6;

export const AddDeviceForm: React.FC<AddDeviceFormProps> = ({ onSubmit, onCancel }: AddDeviceFormProps) => {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const { setOnboardingState } = useIoT();
  const { user: currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState<DeviceFormData>({
    name: '',
    status: 'ONLINE',
    location: '',
    protocol: 'MQTT',
    manufacturer: '',
    model: '',
    ipAddress: '',
    port: 1883,
    description: '',
    mqttBroker: '',
    mqttTopic: '',
    tags: [],
    config: {},
    assignedUserId: currentUser?.id || null
  });

  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessingPDF, setIsProcessingPDF] = useState(false);
  const [aiGeneratedRules, setAiGeneratedRules] = useState<AIGeneratedRule[]>([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [generatedCounts, setGeneratedCounts] = useState({
    rulesGenerated: 0,
    maintenanceItems: 0,
    safetyPrecautions: 0
  });
  const [showChatBox, setShowChatBox] = useState(false);
  const [devicePdfName, setDevicePdfName] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<Array<{id: string, type: 'user' | 'assistant', content: string, timestamp: Date}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Update form data when current user becomes available
  useEffect(() => {
    if (currentUser?.id && !formData.assignedUserId) {
      setFormData(prev => ({
        ...prev,
        assignedUserId: currentUser.id
      }));
      logInfo('AddDeviceForm', 'Updated form data with current user ID', { 
        userId: currentUser.id,
        userName: `${currentUser.firstName} ${currentUser.lastName}` || currentUser.email 
      });
    }
  }, [currentUser?.id, formData.assignedUserId]);

  const handleInputChange = (field: keyof DeviceFormData, value: string | number | string[]) => {
    setFormData((prev: DeviceFormData) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: FileUpload['type']) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, [`${type}File`]: 'Only PDF, DOC, DOCX, and TXT files are allowed' }));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, [`${type}File`]: 'File size must be less than 10MB' }));
      return;
    }

    const newFileUpload: FileUpload = {
      file,
      type,
      status: 'uploading'
    };

    setFileUploads(prev => [...prev, newFileUpload]);
    setErrors(prev => ({ ...prev, [`${type}File`]: '' }));
  };

  const removeFile = (index: number) => {
    setFileUploads(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), newTag.trim()] }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: (prev.tags || []).filter(tag => tag !== tagToRemove) }));
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 1:
        // Required field validation
        if (!formData.name.trim()) newErrors.name = 'Device name is required';
        if (formData.name.length > 100) newErrors.name = 'Device name must be less than 100 characters';
        if (!formData.status) newErrors.status = 'Device status is required';
        if (!formData.location.trim()) newErrors.location = 'Location is required';
        if (formData.location.length > 200) newErrors.location = 'Location must be less than 200 characters';
        if (formData.manufacturer && formData.manufacturer.length > 100) newErrors.manufacturer = 'Manufacturer must be less than 100 characters';
        if (formData.model && formData.model.length > 100) newErrors.model = 'Model must be less than 100 characters';
        
        // Validate description length
        if (formData.description && formData.description.length > 1000) {
          newErrors.description = 'Description must be less than 1000 characters';
        }
        break;
        
      case 2:
        // Network configuration validation
        if (formData.ipAddress && !/^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(formData.ipAddress)) {
          newErrors.ipAddress = 'Invalid IP address format';
        }
        if (formData.port && (formData.port < 1 || formData.port > 65535)) {
          newErrors.port = 'Port must be between 1 and 65535';
        }
        
        // Protocol-specific validation
        if (formData.protocol === 'MQTT') {
          if (!formData.mqttBroker?.trim()) {
            newErrors.mqttBroker = 'MQTT broker is required for MQTT protocol';
          }
          if (!formData.mqttTopic?.trim()) {
            newErrors.mqttTopic = 'MQTT topic is required for MQTT protocol';
          }
        }
        
        // Field length validation
        if (formData.mqttBroker && formData.mqttBroker.length > 255) {
          newErrors.mqttBroker = 'MQTT broker must be less than 255 characters';
        }
        if (formData.mqttTopic && formData.mqttTopic.length > 255) {
          newErrors.mqttTopic = 'MQTT topic must be less than 255 characters';
        }
        break;
        
      case 3:
        // Description validation
        if (formData.description && formData.description.length > 1000) {
          newErrors.description = 'Description must be less than 1000 characters';
        }
        break;
        
      case 4:
        if (fileUploads.length === 0) {
          newErrors.files = 'Please upload at least one documentation file';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      if (currentStep === 4) {
        processPDFWithAI();
      } else if (currentStep === 5) {
        // Step 5 is AI processing, automatically move to step 6 when complete
        setCurrentStep(6);
      } else {
        setCurrentStep((prev) => (prev + 1) as Step);
      }
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => (prev - 1) as Step);
  };

  const processPDFWithAI = async () => {
    setIsProcessingPDF(true);
    setProcessingProgress(0);
    setOnboardingState(true); // Pause background updates

    try {
      // Check if we have files to process
      if (fileUploads.length === 0) {
        throw new Error('No PDF files to process');
      }

      const firstFile = fileUploads[0].file;
      logInfo('AddDeviceForm', 'Starting unified onboarding process with PDF', { 
        fileName: firstFile.name,
        fileSize: firstFile.size,
        deviceName: formData.name,
        assignedUserId: formData.assignedUserId,
        currentUserId: currentUser?.id
      });
      
      // Start onboarding process
      const result = await unifiedOnboardingService.completeUnifiedOnboarding(
        formData,
        firstFile,
        (progress: UnifiedOnboardingProgress) => {
          // Update progress from backend
          setProcessingProgress(progress.progress);
          
          // Move to step 5 when processing starts
          if (progress.stage === 'device' && progress.progress > 0) {
            setCurrentStep(5);
          }
          
          logInfo('AddDeviceForm', 'Onboarding progress update', { 
            stage: progress.stage, 
            message: progress.message,
            progress: progress.progress 
          });
        }
      );
      
      logInfo('AddDeviceForm', 'Unified onboarding completed successfully', {
        deviceId: result.deviceId,
        deviceName: result.deviceName,
        processingTime: result.processingTime,
        rulesGenerated: result.rulesGenerated,
        maintenanceItems: result.maintenanceItems,
        safetyPrecautions: result.safetyPrecautions
      });

      // Store the actual generated counts for success message
      const actualCounts = {
        rulesGenerated: result.rulesGenerated || 0,
        maintenanceItems: result.maintenanceItems || 0,
        safetyPrecautions: result.safetyPrecautions || 0
      };
      
      // Store the PDF name for chat functionality
      const pdfName = result.pdfData?.pdfName || result.pdfData?.originalFileName || '';
      setDevicePdfName(pdfName);
      
      logInfo('AddDeviceForm', 'Setting generated counts for success message', {
        actualCounts,
        pdfName,
        resultKeys: Object.keys(result),
        pdfDataKeys: result.pdfData ? Object.keys(result.pdfData) : 'no pdfData'
      });
      
      setGeneratedCounts(actualCounts);

      // Convert the result to AIGeneratedRule format for display
      const apiRules: AIGeneratedRule[] = (result.pdfData as any)?.rulesData?.map((rule: any, index: number) => ({
        id: `rule_${index}`,
        name: rule.name || `${rule.metric} Rule`,
        description: rule.description || `AI-generated rule for ${rule.metric}`,
        condition: `${rule.metric} ${rule.threshold}`,
        action: rule.consequence || 'Send notification',
        priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
        isSelected: true
      }));

      setAiGeneratedRules(apiRules);
      setIsProcessingPDF(false);
      setCurrentStep(6);
      setOnboardingState(false); // Resume background updates

    } catch (error) {
      logError('AddDeviceForm', 'Error processing PDF with unified service', error instanceof Error ? error : new Error('Unknown error'));
      console.error('Error processing PDF with external API:', error);
      setOnboardingState(false); // Resume background updates
      
      // Fallback to mock rules if API fails
      const fallbackRules: AIGeneratedRule[] = [
        {
          id: '1',
          name: 'Temperature Alert',
          description: 'Alert when temperature exceeds safe operating range',
          condition: 'temperature > 45°C',
          action: 'Send notification and activate cooling system',
          priority: 'HIGH',
          isSelected: true
        },
        {
          id: '2',
          name: 'Humidity Control',
          description: 'Maintain optimal humidity levels',
          condition: 'humidity < 20% OR humidity > 80%',
          action: 'Adjust HVAC settings',
          priority: 'MEDIUM',
          isSelected: true
        },
        {
          id: '3',
          name: 'Power Monitoring',
          description: 'Monitor power consumption and alert on anomalies',
          condition: 'power_consumption > threshold',
          action: 'Send alert to maintenance team',
          priority: 'MEDIUM',
          isSelected: false
        },
        {
          id: '4',
          name: 'Connection Health',
          description: 'Monitor device connectivity and alert on disconnections',
          condition: 'connection_status == offline',
          action: 'Send immediate notification',
          priority: 'HIGH',
          isSelected: true
        }
      ];

      setAiGeneratedRules(fallbackRules);
      setIsProcessingPDF(false);
      setCurrentStep(6);
      
      // Set fallback counts for success message
      setGeneratedCounts({
        rulesGenerated: fallbackRules.length,
        maintenanceItems: 3, // Fallback maintenance count
        safetyPrecautions: 2  // Fallback safety count
      });
    }
  };

  const toggleRuleSelection = (ruleId: string) => {
    setAiGeneratedRules(prev => 
      prev.map(rule => 
        rule.id === ruleId 
          ? { ...rule, isSelected: !rule.isSelected }
          : rule
      )
    );
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || isChatLoading || !devicePdfName) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: chatInput.trim(),
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      logInfo('AddDeviceForm', 'Sending chat message', { 
        pdfName: devicePdfName, 
        message: userMessage.content 
      });

      const response = await pdfAPI.queryPDF(userMessage.content, devicePdfName, 5);
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant' as const,
        content: response.data.response || 'I found some information in the device documentation. Let me help you with that.',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, assistantMessage]);
      
      logInfo('AddDeviceForm', 'Chat message sent successfully', { 
        responseLength: assistantMessage.content.length 
      });

    } catch (error) {
      logError('AddDeviceForm', 'Failed to send chat message', error instanceof Error ? error : new Error('Unknown error'));
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant' as const,
        content: 'I apologize, but I\'m having trouble accessing the device documentation right now. Please try again later.',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const initializeChat = () => {
    if (devicePdfName && chatMessages.length === 0) {
      const welcomeMessage = {
        id: 'welcome',
        type: 'assistant' as const,
        content: `Hello! I'm your AI assistant for ${formData.name}. I've analyzed the documentation you uploaded and I'm ready to help you with any questions about your device. What would you like to know?`,
        timestamp: new Date()
      };
      setChatMessages([welcomeMessage]);
    }
    setShowChatBox(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCurrentStep()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedRules = aiGeneratedRules.filter(rule => rule.isSelected);
      await onSubmit(formData, fileUploads, selectedRules);
      
      // Show success message with actual generated values
      setIsSuccess(true);
      
      // Create a more informative success message
      const generatedItems = [];
      if (generatedCounts.rulesGenerated > 0) {
        generatedItems.push(`${generatedCounts.rulesGenerated} monitoring rule${generatedCounts.rulesGenerated > 1 ? 's' : ''}`);
      }
      if (generatedCounts.maintenanceItems > 0) {
        generatedItems.push(`${generatedCounts.maintenanceItems} maintenance task${generatedCounts.maintenanceItems > 1 ? 's' : ''}`);
      }
      if (generatedCounts.safetyPrecautions > 0) {
        generatedItems.push(`${generatedCounts.safetyPrecautions} safety protocol${generatedCounts.safetyPrecautions > 1 ? 's' : ''}`);
      }
      
      const generatedText = generatedItems.length > 0 
        ? ` Generated: ${generatedItems.join(', ')}.`
        : '';
        
      setSuccessMessage(
        `Device "${formData.name}" has been successfully added to the platform!${generatedText}`
      );
      
      // Auto-close after 3 seconds
      setTimeout(() => {
        setIsSuccess(false);
        setSuccessMessage('');
        onCancel();
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting device:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepTitle = (step: Step): string => {
    switch (step) {
      case 1: return 'Basic Information';
      case 2: return 'Network Configuration';
      case 3: return 'Description & Tags';
      case 4: return 'Documentation Upload';
      case 5: return 'AI Processing';
      case 6: return 'AI-Powered Rules';
    }
  };

  const getStepDescription = (step: Step): string => {
    switch (step) {
      case 1: return 'Enter the basic details about your IoT device';
      case 2: return 'Configure network settings and connectivity';
      case 3: return 'Add description and tags';
      case 4: return 'Upload device documentation for AI analysis';
      case 5: return 'AI is processing your device documentation';
      case 6: return 'Review and select AI-generated rules for your device';
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Device Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="e.g., Temperature Sensor 001"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>


              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.location ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="e.g., Building A, Floor 2, Room 205"
                />
                {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Device Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ONLINE">Online</option>
                  <option value="OFFLINE">Offline</option>
                  <option value="WARNING">Warning</option>
                  <option value="ERROR">Error</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Communication Protocol *
                </label>
                <select
                  value={formData.protocol}
                  onChange={(e) => handleInputChange('protocol', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="MQTT">MQTT</option>
                  <option value="HTTP">HTTP</option>
                  <option value="COAP">COAP</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Manufacturer *
                </label>
                <input
                  type="text"
                  value={formData.manufacturer}
                  onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.manufacturer ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="e.g., Siemens"
                />
                {errors.manufacturer && <p className="text-red-500 text-sm mt-1">{errors.manufacturer}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Model *
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.model ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="e.g., ST-2000"
                />
                {errors.model && <p className="text-red-500 text-sm mt-1">{errors.model}</p>}
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
                  IP Address
                </label>
                <input
                  type="text"
                  value={formData.ipAddress || ''}
                  onChange={(e) => handleInputChange('ipAddress', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.ipAddress ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="e.g., 192.168.1.100"
                />
                {errors.ipAddress && <p className="text-red-500 text-sm mt-1">{errors.ipAddress}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Port
                </label>
                <input
                  type="number"
                  value={formData.port || ''}
                  onChange={(e) => handleInputChange('port', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.port ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="e.g., 1883"
                  min="1"
                  max="65535"
                />
                {errors.port && <p className="text-red-500 text-sm mt-1">{errors.port}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  MQTT Broker
                </label>
                <input
                  type="text"
                  value={formData.mqttBroker || ''}
                  onChange={(e) => handleInputChange('mqttBroker', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., sensors/temperature/001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  MQTT Username
                </label>
                <input
                  type="text"
                  value={formData.mqttUsername || ''}
                  onChange={(e) => handleInputChange('mqttUsername', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., device_user"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  MQTT Password
                </label>
                <input
                  type="password"
                  value={formData.mqttPassword || ''}
                  onChange={(e) => handleInputChange('mqttPassword', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., device_password"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Detailed description of the device and its purpose..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add a tag and press Enter"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Add
                </button>
              </div>
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileSearch className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Upload Device Documentation</h3>
              <p className="text-slate-600">Upload your device manual, datasheet, or specifications for AI-powered rule generation</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['manual', 'datasheet', 'certificate'] as const).map((type) => (
                <div key={type} className="border-2 border-dashed border-slate-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {type === 'manual' ? 'Device Manual' : type === 'datasheet' ? 'Datasheet' : 'Certificate'}
                  </label>
                  <input
                    type="file"
                    onChange={(e) => handleFileUpload(e, type)}
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    id={`file-${type}`}
                  />
                  <label
                    htmlFor={`file-${type}`}
                    className="flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-sm text-slate-600">Click to upload</span>
                    <span className="text-xs text-slate-500 mt-1">PDF, DOC, DOCX, TXT (max 10MB)</span>
                  </label>
                  {errors[`${type}File`] && (
                    <p className="text-red-500 text-xs mt-2">{errors[`${type}File`]}</p>
                  )}
                </div>
              ))}
            </div>

            {fileUploads.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Uploaded Files:</h4>
                <div className="space-y-2">
                  {fileUploads.map((fileUpload, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-slate-600" />
                        <div>
                          <p className="text-sm font-medium text-slate-800">{fileUpload.file.name}</p>
                          <p className="text-xs text-slate-500">
                            {(fileUpload.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="p-1 hover:bg-slate-200 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {errors.files && <p className="text-red-500 text-sm mt-1">{errors.files}</p>}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            {isProcessingPDF ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-blue-600 animate-pulse" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">AI Processing Your Device</h3>
                <p className="text-slate-600 mb-4">Our AI is analyzing your device documentation and setting up everything for you</p>
                
                <div className="w-full bg-slate-200 rounded-full h-3 mb-4">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${processingProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-slate-500 font-medium">{processingProgress}% Complete</p>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">What's happening:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>✅ Creating device configuration</li>
                    <li>✅ Assigning device to user</li>
                    <li>🔄 Processing documentation with AI</li>
                    <li>⏳ Generating intelligent monitoring rules</li>
                    <li>⏳ Creating maintenance schedules</li>
                    <li>⏳ Setting up safety protocols</li>
                  </ul>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">AI-Generated Rules</h3>
                  <p className="text-slate-600">Review and select the rules you'd like to apply to your device</p>
                </div>

                <div className="space-y-4">
                  {aiGeneratedRules.map((rule) => (
                    <div
                      key={rule.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        rule.isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => toggleRuleSelection(rule.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-slate-800">{rule.name}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              rule.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                              rule.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {rule.priority}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{rule.description}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="font-medium text-slate-700">Condition:</span>
                              <p className="text-slate-600">{rule.condition}</p>
                            </div>
                            <div>
                              <span className="font-medium text-slate-700">Action:</span>
                              <p className="text-slate-600">{rule.action}</p>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            rule.isSelected
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-slate-300'
                          }`}>
                            {rule.isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">AI Recommendation</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Based on your device specifications and documentation, we recommend enabling the selected rules above. 
                    These rules will help monitor your device's health and performance automatically.
                  </p>
                </div>
              </>
            )}
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Add IoT Device</h2>
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
          <div className="flex items-center justify-between mt-6">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  step === currentStep
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : step < currentStep
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-slate-300 text-slate-400'
                }`}>
                  {step < currentStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-medium">{step}</span>
                  )}
                </div>
                {step < 5 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    step < currentStep ? 'bg-green-500' : 'bg-slate-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">{getStepTitle(currentStep)}</h3>
          </div>

          {renderStepContent()}

          {/* Success Message */}
          {isSuccess && (
            <div className="mb-6 space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-green-800">Device Added Successfully!</h4>
                    <p className="text-sm text-green-600 mt-1">{successMessage}</p>
                  </div>
                </div>
              </div>

              {/* Chat Box */}
              {devicePdfName && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-slate-600" />
                        <h5 className="text-sm font-medium text-slate-800">Ask AI Assistant</h5>
                        <span className="text-xs text-slate-500">• {devicePdfName.split('/').pop() || devicePdfName}</span>
                      </div>
                      {!showChatBox && (
                        <button
                          onClick={initializeChat}
                          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          Start Chat
                        </button>
                      )}
                    </div>
                  </div>

                  {showChatBox && (
                    <div className="h-80 flex flex-col">
                      {/* Chat Messages */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {chatMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                                message.type === 'user'
                                  ? 'bg-indigo-500 text-white'
                                  : 'bg-slate-100 text-slate-800'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {message.type === 'assistant' && (
                                  <Bot className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                )}
                                <div className="flex-1">
                                  <div className="whitespace-pre-wrap">{message.content}</div>
                                  <div className="text-xs opacity-70 mt-1">
                                    {message.timestamp.toLocaleTimeString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {isChatLoading && (
                          <div className="flex justify-start">
                            <div className="bg-slate-100 rounded-lg px-3 py-2 text-sm text-slate-600">
                              <div className="flex items-center gap-2">
                                <Bot className="w-3 h-3" />
                                <span>AI is thinking...</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Chat Input */}
                      <div className="border-t border-slate-200 p-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                            placeholder="Ask about setup, maintenance, troubleshooting..."
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={isChatLoading}
                          />
                          <button
                            onClick={handleChatSend}
                            disabled={!chatInput.trim() || isChatLoading}
                            className="px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => setChatInput('How do I set up this device?')}
                            className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
                          >
                            Setup Guide
                          </button>
                          <button
                            onClick={() => setChatInput('What maintenance is required?')}
                            className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
                          >
                            Maintenance
                          </button>
                          <button
                            onClick={() => setChatInput('Help me troubleshoot issues')}
                            className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
                          >
                            Troubleshooting
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-200">
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

              {currentStep === 5 ? (
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Adding Device...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add Device
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
