import React, { useState, useEffect } from 'react';
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
  Bot
} from 'lucide-react';
import { knowledgeAPI } from '../../services/api';
import { pdfProcessingService } from '../../services/pdfprocess';

interface DeviceFormData {
  name: string;
  type: 'SENSOR' | 'ACTUATOR' | 'GATEWAY' | 'CONTROLLER';
  status: 'ONLINE' | 'OFFLINE' | 'WARNING' | 'ERROR';
  location: string;
  protocol: 'MQTT' | 'HTTP' | 'COAP';
  firmware: string;
  tags: string[];
  manufacturer: string;
  model: string;
  serialNumber: string;
  macAddress: string;
  ipAddress: string;
  port: number;
  description: string;
  installationNotes: string;
  maintenanceSchedule: string;
  warrantyInfo: string;
  wifiSsid: string;
  mqttBroker: string;
  mqttTopic: string;
  powerSource: string;
  powerConsumption: number;
  operatingTemperatureMin: number;
  operatingTemperatureMax: number;
  operatingHumidityMin: number;
  operatingHumidityMax: number;
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

type Step = 1 | 2 | 3 | 4 | 5;

export const AddDeviceForm: React.FC<AddDeviceFormProps> = ({ onSubmit, onCancel }) => {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState<DeviceFormData>({
    name: '',
    type: 'SENSOR',
    status: 'ONLINE',
    location: '',
    protocol: 'MQTT',
    firmware: '',
    tags: [],
    manufacturer: '',
    model: '',
    serialNumber: '',
    macAddress: '',
    ipAddress: '',
    port: 1883,
    description: '',
    installationNotes: '',
    maintenanceSchedule: '',
    warrantyInfo: '',
    wifiSsid: '',
    mqttBroker: '',
    mqttTopic: '',
    powerSource: '',
    powerConsumption: 0,
    operatingTemperatureMin: -10,
    operatingTemperatureMax: 50,
    operatingHumidityMin: 10,
    operatingHumidityMax: 90
  });

  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessingPDF, setIsProcessingPDF] = useState(false);
  const [aiGeneratedRules, setAiGeneratedRules] = useState<AIGeneratedRule[]>([]);
  const [processingProgress, setProcessingProgress] = useState(0);

  const handleInputChange = (field: keyof DeviceFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 1:
        if (!formData.name.trim()) newErrors.name = 'Device name is required';
        if (!formData.status) newErrors.status = 'Device status is required';
        if (!formData.location.trim()) newErrors.location = 'Location is required';
        if (!formData.manufacturer.trim()) newErrors.manufacturer = 'Manufacturer is required';
        if (!formData.model.trim()) newErrors.model = 'Model is required';
        break;
      case 2:
        if (formData.macAddress && !/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(formData.macAddress)) {
          newErrors.macAddress = 'Invalid MAC address format (use XX:XX:XX:XX:XX:XX)';
        }
        if (formData.ipAddress && !/^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(formData.ipAddress)) {
          newErrors.ipAddress = 'Invalid IP address format';
        }
        if (formData.port < 1 || formData.port > 65535) {
          newErrors.port = 'Port must be between 1 and 65535';
        }
        break;
      case 3:
        if (formData.operatingTemperatureMin >= formData.operatingTemperatureMax) {
          newErrors.operatingTemperatureMin = 'Minimum temperature must be less than maximum temperature';
        }
        if (formData.operatingHumidityMin >= formData.operatingHumidityMax) {
          newErrors.operatingHumidityMin = 'Minimum humidity must be less than maximum humidity';
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

    // Start progress simulation
    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90; // Stop at 90% until API call completes
        }
        return prev + 10;
      });
    }, 200);

    try {
      // Step 1: Upload the first PDF file
      if (fileUploads.length === 0) {
        throw new Error('No PDF files to process');
      }

      const firstFile = fileUploads[0].file;
      console.log('Uploading PDF:', firstFile.name);
      
      // Upload PDF via backend knowledge API
      const uploadResult = await knowledgeAPI.uploadPDF(firstFile);
      console.log('PDF uploaded successfully:', uploadResult?.data);
      const pdfFilename = (uploadResult as any)?.data?.pdf_filename || firstFile.name;

      // Step 2: Generate IoT Rules from the uploaded PDF
      console.log('Generating IoT rules...');
      const rulesResult = await pdfProcessingService.generateRules(pdfFilename);
      console.log('IoT rules generated:', rulesResult);

      // Step 3: Generate Maintenance Schedule
      console.log('Generating maintenance schedule...');
      const maintenanceResult = await pdfProcessingService.generateMaintenance(pdfFilename);
      console.log('Maintenance schedule generated:', maintenanceResult);

      // Step 4: Generate Safety Information
      console.log('Generating safety information...');
      const safetyResult = await pdfProcessingService.generateSafety(pdfFilename);
      console.log('Safety information generated:', safetyResult);
      
      // Update progress to 100%
      setProcessingProgress(100);

      // Convert API responses to AIGeneratedRule format
      const apiRules: AIGeneratedRule[] = rulesResult.rules.map((rule, index) => ({
        id: `rule_${index}`,
        name: `${rule.category} Rule`,
        description: `AI-generated ${rule.category} rule based on device documentation`,
        condition: rule.condition,
        action: rule.action,
        priority: rule.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH',
        isSelected: true // Default to selected
      }));

      setAiGeneratedRules(apiRules);
      setIsProcessingPDF(false);
      setCurrentStep(5);

    } catch (error) {
      console.error('Error processing PDF with external API:', error);
      
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
      setCurrentStep(5);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCurrentStep()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedRules = aiGeneratedRules.filter(rule => rule.isSelected);
      await onSubmit(formData, fileUploads, selectedRules);
      
      // Show success message
      setIsSuccess(true);
      setSuccessMessage(`Device "${formData.name}" has been successfully added to the platform!`);
      
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
      case 3: return 'Environmental Settings';
      case 4: return 'Documentation Upload';
      case 5: return 'AI-Powered Rules';
    }
  };

  const getStepDescription = (step: Step): string => {
    switch (step) {
      case 1: return 'Enter the basic details about your IoT device';
      case 2: return 'Configure network settings and connectivity';
      case 3: return 'Set environmental operating parameters';
      case 4: return 'Upload device documentation for AI analysis';
      case 5: return 'Review and select AI-generated rules for your device';
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
                  Device Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="SENSOR">Sensor</option>
                  <option value="ACTUATOR">Actuator</option>
                  <option value="GATEWAY">Gateway</option>
                  <option value="CONTROLLER">Controller</option>
                </select>
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
                  Serial Number
                </label>
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., SN123456789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  MAC Address
                </label>
                <input
                  type="text"
                  value={formData.macAddress}
                  onChange={(e) => handleInputChange('macAddress', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.macAddress ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="e.g., 00:11:22:33:44:55"
                />
                {errors.macAddress && <p className="text-red-500 text-sm mt-1">{errors.macAddress}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  IP Address
                </label>
                <input
                  type="text"
                  value={formData.ipAddress}
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
                  value={formData.port}
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
                  WiFi SSID
                </label>
                <input
                  type="text"
                  value={formData.wifiSsid}
                  onChange={(e) => handleInputChange('wifiSsid', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., IoT_Network"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  MQTT Broker
                </label>
                <input
                  type="text"
                  value={formData.mqttBroker}
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
                  value={formData.mqttTopic}
                  onChange={(e) => handleInputChange('mqttTopic', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., sensors/temperature/001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Firmware Version
                </label>
                <input
                  type="text"
                  value={formData.firmware}
                  onChange={(e) => handleInputChange('firmware', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., v2.1.0"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Power Source
                </label>
                <input
                  type="text"
                  value={formData.powerSource}
                  onChange={(e) => handleInputChange('powerSource', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 24V DC"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Power Consumption (W)
                </label>
                <input
                  type="number"
                  value={formData.powerConsumption}
                  onChange={(e) => handleInputChange('powerConsumption', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 5.2"
                  step="0.1"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Operating Temperature Min (°C)
                </label>
                <input
                  type="number"
                  value={formData.operatingTemperatureMin}
                  onChange={(e) => handleInputChange('operatingTemperatureMin', parseFloat(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.operatingTemperatureMin ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="e.g., -10"
                  step="0.1"
                />
                {errors.operatingTemperatureMin && <p className="text-red-500 text-sm mt-1">{errors.operatingTemperatureMin}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Operating Temperature Max (°C)
                </label>
                <input
                  type="number"
                  value={formData.operatingTemperatureMax}
                  onChange={(e) => handleInputChange('operatingTemperatureMax', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 50"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Operating Humidity Min (%)
                </label>
                <input
                  type="number"
                  value={formData.operatingHumidityMin}
                  onChange={(e) => handleInputChange('operatingHumidityMin', parseFloat(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.operatingHumidityMin ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="e.g., 10"
                  step="0.1"
                  min="0"
                  max="100"
                />
                {errors.operatingHumidityMin && <p className="text-red-500 text-sm mt-1">{errors.operatingHumidityMin}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Operating Humidity Max (%)
                </label>
                <input
                  type="number"
                  value={formData.operatingHumidityMax}
                  onChange={(e) => handleInputChange('operatingHumidityMax', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 90"
                  step="0.1"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Detailed description of the device and its purpose..."
              />
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
                <h3 className="text-lg font-semibold text-slate-800 mb-2">AI Processing Your Documents</h3>
                <p className="text-slate-600 mb-4">Our AI is analyzing your device documentation to generate intelligent rules</p>
                
                <div className="w-full bg-slate-200 rounded-full h-2 mb-4">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${processingProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-slate-500">{processingProgress}% Complete</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-green-600" />
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
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-green-800">Device Added Successfully!</h4>
                  <p className="text-sm text-green-600 mt-1">{successMessage}</p>
                </div>
              </div>
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
                      <Loader2 className="w-4 h-4 animate-spin" />
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
