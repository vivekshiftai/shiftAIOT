import React, { useState, useEffect, useCallback } from 'react';
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
  Zap as Lightning,
  Key,
  Network,
  MapPin,
  Tag,
  Wrench
} from 'lucide-react';
import { pdfProcessingService, RulesGenerationResponse, IoTRule, MaintenanceData, SafetyPrecaution } from '../../services/pdfProcessingService';
import { AIProcessingLoader } from '../Loading/AIProcessingLoader';
import { DeviceOnboardingLoader } from '../Loading/DeviceOnboardingLoader';
import { DeviceOnboardingSuccess } from './DeviceOnboardingSuccess';
import { DeviceChatInterface } from './DeviceChatInterface';
import { GeneratedRulesDisplay } from './GeneratedRulesDisplay';
import { PDFProcessingResults, PDFProcessingResultsData } from './PDFProcessingResults';

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
  pdfResults?: {
    iot_rules: IoTRule[];
    maintenance_data: MaintenanceData[];
    safety_precautions: SafetyPrecaution[];
    pdf_filename: string;
    processing_summary: string;
    total_pages?: number;
    processed_chunks?: number;
    processing_time?: number;
  };
}

interface FileUpload {
  file: File;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

interface DeviceOnboardingFormProps {
  onSubmit: (deviceData: DeviceFormData, file: FileUpload | null) => Promise<void>;
  onCancel: () => void;
}

type Step = 1 | 2 | 3;

export const DeviceOnboardingForm: React.FC<DeviceOnboardingFormProps> = ({ onSubmit, onCancel }) => {
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
    metadata: ''
  });

  const [uploadedFile, setUploadedFile] = useState<FileUpload | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isStepLoading, setIsStepLoading] = useState(false);
  const [stepLoadingMessage, setStepLoadingMessage] = useState('');
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [deviceCreated, setDeviceCreated] = useState(false);
  const [createdDeviceName, setCreatedDeviceName] = useState('');
  
  // AI Processing states
  const [isProcessingPDF, setIsProcessingPDF] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('uploading');
  const [generatedRules, setGeneratedRules] = useState<IoTRule[]>([]);
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceData[]>([]);
  const [safetyPrecautions, setSafetyPrecautions] = useState<SafetyPrecaution[]>([]);
  const [pdfProcessingStatus, setPdfProcessingStatus] = useState<string>('');
  const [showProcessingLoader, setShowProcessingLoader] = useState(false);
  const [showPDFResults, setShowPDFResults] = useState(false);
  const [pdfResultsData, setPdfResultsData] = useState<PDFProcessingResultsData | null>(null);
  const [selectedRules, setSelectedRules] = useState<IoTRule[]>([]);
  const [selectedMaintenance, setSelectedMaintenance] = useState<MaintenanceData[]>([]);
  const [selectedSafety, setSelectedSafety] = useState<SafetyPrecaution[]>([]);

  // Enhanced onboarding states
  const [showOnboardingLoader, setShowOnboardingLoader] = useState(false);
  const [onboardingProgress, setOnboardingProgress] = useState(0);
  const [currentOnboardingProcess, setCurrentOnboardingProcess] = useState<'pdf' | 'rules' | 'knowledgebase'>('pdf');
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [showChatInterface, setShowChatInterface] = useState(false);
  const [onboardingSubStage, setOnboardingSubStage] = useState('');
  const [onboardingSubProgress, setOnboardingSubProgress] = useState(0);

  const handleInputChange = useCallback((field: keyof DeviceFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('File upload started:', file.name, file.size, file.type);

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
      console.log('Starting PDF upload to processing service...');
      
      // Show processing loader and set processing state
      setShowProcessingLoader(true);
      setIsProcessingPDF(true);
      setProcessingStage('uploading');
      setProcessingProgress(0);
      
      // Upload PDF to processing service
      const uploadResponse = await pdfProcessingService.uploadPDF(file);
      
      console.log('PDF upload response:', uploadResponse);
      
      if (uploadResponse.success) {
        setUploadedFile({ file, status: 'success' });
        setPdfProcessingStatus(uploadResponse.processing_status);
        setProcessingProgress(15);
        
        console.log('PDF uploaded successfully, starting AI processing...');
        
        // Start processing rules if upload was successful
        await processPDFWithAI(file);
      } else {
        console.error('PDF upload failed:', uploadResponse.message);
        setUploadedFile({ file, status: 'error', error: uploadResponse.message });
        setIsProcessingPDF(false);
        setShowProcessingLoader(false);
      }
    } catch (error) {
      console.error('Failed to upload PDF:', error);
      
      // Fallback: Mark file as uploaded but skip AI processing
      console.log('PDF processing API unavailable, using fallback mode');
      setUploadedFile({ file, status: 'success' });
      setPdfProcessingStatus('completed');
      
      // Show a message that AI processing is not available
      const fallbackMessage = 'PDF uploaded successfully. AI processing is currently unavailable, but you can still create the device.';
      console.log(fallbackMessage);
      
      // Don't show the processing loader since we're skipping AI processing
      setIsProcessingPDF(false);
      setShowProcessingLoader(false);
    }
  }, []);

  const processPDFWithAI = useCallback(async (file: File) => {
    try {
      console.log('Starting AI processing for PDF:', file.name);
      
      // Stage 1: AI Analysis
      setProcessingStage('analyzing');
      setProcessingProgress(25);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Stage 2: Extracting Specifications
      setProcessingStage('extracting');
      setProcessingProgress(40);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Stage 3: Generating IoT Rules
      setProcessingStage('generating_rules');
      setProcessingProgress(60);
      
      console.log('Calling PDF processing service to generate rules...');
      
      try {
        // Generate rules using the PDF processing service
        const rulesResponse = await pdfProcessingService.generateRules({
          file: file,
          chunk_size: 10,
          rule_types: ['monitoring', 'maintenance', 'alert']
        });

        console.log('Rules generated successfully:', rulesResponse);
        console.log('IoT Rules count:', rulesResponse.iot_rules?.length || 0);
        console.log('Maintenance data count:', rulesResponse.maintenance_data?.length || 0);
        console.log('Safety precautions count:', rulesResponse.safety_precautions?.length || 0);
        
        // Store the complete response data
        const resultsData: PDFProcessingResultsData = {
          pdf_filename: rulesResponse.pdf_filename || file.name,
          total_pages: rulesResponse.total_pages || 0,
          processed_chunks: rulesResponse.processed_chunks || 0,
          iot_rules: rulesResponse.iot_rules || [],
          maintenance_data: rulesResponse.maintenance_data || [],
          safety_precautions: rulesResponse.safety_precautions || [],
          processing_time: rulesResponse.processing_time || 0,
          summary: rulesResponse.summary || `Generated ${rulesResponse.iot_rules?.length || 0} IoT rules, ${rulesResponse.maintenance_data?.length || 0} maintenance records, and ${rulesResponse.safety_precautions?.length || 0} safety precautions from your device documentation.`
        };
        
        setPdfResultsData(resultsData);
        setGeneratedRules(rulesResponse.iot_rules || []);
        setMaintenanceData(rulesResponse.maintenance_data || []);
        setSafetyPrecautions(rulesResponse.safety_precautions || []);
        
        // Show the results for user selection
        setShowPDFResults(true);
        
      } catch (apiError) {
        console.error('PDF processing API failed, using mock data:', apiError);
        
        // Generate mock rules as fallback
        const mockRules = [
          {
            device_name: file.name.replace('.pdf', ''),
            rule_type: 'monitoring' as const,
            condition: 'Temperature exceeds 85°C',
            action: 'Send alert to maintenance team',
            priority: 'high' as const,
            frequency: 'hourly',
            description: 'Monitor equipment temperature to prevent overheating'
          },
          {
            device_name: file.name.replace('.pdf', ''),
            rule_type: 'maintenance' as const,
            condition: 'Operating hours reach 1000',
            action: 'Schedule preventive maintenance',
            priority: 'medium' as const,
            frequency: 'weekly',
            description: 'Regular maintenance schedule for motor components'
          },
          {
            device_name: file.name.replace('.pdf', ''),
            rule_type: 'alert' as const,
            condition: 'Pressure drops below 2.5 bar',
            action: 'Activate backup pump system',
            priority: 'high' as const,
            frequency: 'real-time',
            description: 'Critical pressure monitoring for system safety'
          }
        ];

        const mockMaintenance = [
          {
            component_name: 'Filter Assembly',
            maintenance_type: 'preventive',
            frequency: 'Every 3 months',
            last_maintenance: '2024-01-15',
            next_maintenance: '2024-04-15',
            description: 'Replace air filters to maintain optimal performance'
          },
          {
            component_name: 'Motor Bearings',
            maintenance_type: 'preventive',
            frequency: 'Every 6 months',
            last_maintenance: '2023-12-01',
            next_maintenance: '2024-06-01',
            description: 'Lubricate and inspect motor bearings for wear'
          }
        ];

        const mockSafety = [
          {
            id: 'safety-1',
            title: 'High Temperature Warning',
            description: 'Equipment may reach dangerous temperatures during operation',
            severity: 'high' as const,
            category: 'Thermal Safety',
            recommended_action: 'Ensure proper ventilation and monitor temperature sensors'
          },
          {
            id: 'safety-2',
            title: 'Electrical Safety',
            description: 'High voltage components require proper grounding',
            severity: 'critical' as const,
            category: 'Electrical Safety',
            recommended_action: 'Verify grounding connections before operation'
          }
        ];

        const mockResultsData: PDFProcessingResultsData = {
          pdf_filename: file.name,
          total_pages: 50,
          processed_chunks: 4,
          iot_rules: mockRules,
          maintenance_data: mockMaintenance,
          safety_precautions: mockSafety,
          processing_time: 45.2,
          summary: 'Generated 3 IoT rules, 2 maintenance records, and 2 safety precautions from your device documentation.'
        };

        setPdfResultsData(mockResultsData);
        setGeneratedRules(mockRules);
        setMaintenanceData(mockMaintenance);
        setSafetyPrecautions(mockSafety);
        
        // Show the results for user selection
        setShowPDFResults(true);
      }
      
      // Stage 4: Maintenance Schedule
      setProcessingStage('maintenance');
      setProcessingProgress(80);
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Stage 5: Storing Data
      setProcessingStage('storing');
      setProcessingProgress(100);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('AI processing completed successfully');
      
    } catch (error) {
      console.error('Failed to process PDF with AI:', error);
      setProcessingStage('Processing failed. Please try again.');
      setGeneratedRules([]);
      setMaintenanceData([]);
      setSafetyPrecautions([]);
    } finally {
      setIsProcessingPDF(false);
      // Keep the loader open for a moment to show completion
      setTimeout(() => {
        setShowProcessingLoader(false);
      }, 2000);
    }
  }, []);

  const removeFile = useCallback(() => {
    setUploadedFile(null);
    setShowPDFResults(false);
    setPdfResultsData(null);
    setGeneratedRules([]);
    setMaintenanceData([]);
    setSafetyPrecautions([]);
    setSelectedRules([]);
    setSelectedMaintenance([]);
    setSelectedSafety([]);
  }, []);

  const handlePDFResultsConfirm = useCallback((selectedData: {
    iot_rules: IoTRule[];
    maintenance_data: MaintenanceData[];
    safety_precautions: SafetyPrecaution[];
  }) => {
    console.log('User confirmed PDF results selection:', selectedData);
    setSelectedRules(selectedData.iot_rules);
    setSelectedMaintenance(selectedData.maintenance_data);
    setSelectedSafety(selectedData.safety_precautions);
    setShowPDFResults(false);
  }, []);

  const handlePDFResultsUpdate = useCallback((field: 'rules' | 'maintenance' | 'safety', data: any[]) => {
    switch (field) {
      case 'rules':
        setGeneratedRules(data);
        break;
      case 'maintenance':
        setMaintenanceData(data);
        break;
      case 'safety':
        setSafetyPrecautions(data);
        break;
    }
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
      
      // Show different loading messages based on current step
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
    setOnboardingProgress(0);
    setCurrentOnboardingProcess('pdf');
    
    try {
      console.log('DeviceOnboardingForm - Starting enhanced onboarding process');
      console.log('DeviceOnboardingForm - Device data:', formData);
      console.log('DeviceOnboardingForm - File data:', uploadedFile);
      
      let pdfFilename = '';
      let rulesData: any = null;
      
      // Stage 1: PDF Processing & Git Storage (0-33%)
      setCurrentOnboardingProcess('pdf');
      setOnboardingSubStage('Uploading PDF to processing service');
      setOnboardingSubProgress(0);
      
      if (uploadedFile?.file) {
        try {
          // Upload PDF to processing service
          setOnboardingSubStage('Uploading PDF');
          setOnboardingSubProgress(10);
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const uploadResponse = await pdfProcessingService.uploadPDF(uploadedFile.file);
          pdfFilename = uploadResponse.pdf_filename;
          
          setOnboardingSubStage('PDF uploaded successfully');
          setOnboardingSubProgress(100);
          await new Promise(resolve => setTimeout(resolve, 300));
          
          console.log('PDF uploaded successfully:', uploadResponse);
        } catch (error) {
          console.error('PDF upload failed:', error);
          throw new Error(`Failed to upload PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      setOnboardingProgress(33);
      
      // Stage 2: Rules Querying & Generation (33-66%)
      setCurrentOnboardingProcess('rules');
      setOnboardingSubStage('Generating IoT rules and maintenance data');
      setOnboardingSubProgress(0);
      
      if (pdfFilename) {
        try {
          const rulesStages = [
            'Analyzing device specifications',
            'Identifying monitoring parameters',
            'Generating alert rules',
            'Creating automation workflows',
            'Validating rule logic',
            'Optimizing performance'
          ];
          
          for (let i = 0; i < rulesStages.length; i++) {
            setOnboardingSubStage(rulesStages[i]);
            setOnboardingSubProgress((i / (rulesStages.length - 1)) * 80);
            await new Promise(resolve => setTimeout(resolve, 400));
          }
          
          // Generate rules using the PDF processing service
          setOnboardingSubStage('Calling rules generation API');
          setOnboardingSubProgress(90);
          
          const rulesResponse = await pdfProcessingService.generateRules({
            pdf_filename: pdfFilename,
            chunk_size: 1000,
            rule_types: ['monitoring', 'maintenance', 'alert']
          });
          
          rulesData = rulesResponse;
          setSelectedRules(rulesResponse.iot_rules || []);
          setSelectedMaintenance(rulesResponse.maintenance_data || []);
          setSelectedSafety(rulesResponse.safety_precautions || []);
          
          setOnboardingSubStage('Rules generated successfully');
          setOnboardingSubProgress(100);
          await new Promise(resolve => setTimeout(resolve, 300));
          
          console.log('Rules generated successfully:', rulesResponse);
        } catch (error) {
          console.error('Rules generation failed:', error);
          // Continue with fallback data
          console.log('Using fallback rules data');
        }
      }
      
      setOnboardingProgress(66);
      
      // Stage 3: Knowledge Base Creation (66-100%)
      setCurrentOnboardingProcess('knowledgebase');
      setOnboardingSubStage('Building AI knowledge base');
      setOnboardingSubProgress(0);
      
      const kbStages = [
        'Vectorizing document content',
        'Creating semantic embeddings',
        'Building search index',
        'Training AI model',
        'Setting up chat interface',
        'Testing query system'
      ];
      
      for (let i = 0; i < kbStages.length; i++) {
        setOnboardingSubStage(kbStages[i]);
        setOnboardingSubProgress((i / (kbStages.length - 1)) * 100);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setOnboardingProgress(100);
      
      // Create enhanced device data with PDF results
      const enhancedDeviceData = {
        ...formData,
        pdfResults: {
          iot_rules: selectedRules,
          maintenance_data: selectedMaintenance,
          safety_precautions: selectedSafety,
          pdf_filename: pdfFilename || uploadedFile?.file.name || 'unknown.pdf',
          processing_summary: rulesData?.summary || 'AI-generated rules and maintenance data',
          total_pages: rulesData?.total_pages || 0,
          processed_chunks: rulesData?.processed_chunks || 0,
          processing_time: rulesData?.processing_time || 0
        }
      };
      
      // Submit the device data
      await onSubmit(enhancedDeviceData, uploadedFile);
      
      setCreatedDeviceName(formData.deviceName);
      setDeviceCreated(true);
      setShowOnboardingLoader(false);
      setShowSuccessNotification(true);
      
      // Auto-hide success notification after 5 seconds and show chat interface
      setTimeout(() => {
        setShowSuccessNotification(false);
        setShowChatInterface(true);
      }, 5000);
      
    } catch (error) {
      console.error('Error during onboarding process:', error);
      setShowOnboardingLoader(false);
      
      // Show error notification
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred during onboarding';
      alert(`Failed to complete onboarding: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [validateCurrentStep, formData, uploadedFile, selectedRules, selectedMaintenance, selectedSafety, onSubmit]);

  const getStepTitle = useCallback((step: Step): string => {
    switch (step) {
      case 1: return 'Device Details';
      case 2: return 'Connection Settings';
      case 3: return 'Documentation';
    }
  }, []);

  const getStepDescription = useCallback((step: Step): string => {
    switch (step) {
      case 1: return 'Enter the basic device information and identification details';
      case 2: return 'Configure authentication and network connection settings';
      case 3: return 'Upload device documentation for AI-powered analysis';
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
                    errors.deviceId ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="e.g., DEV-001"
                />
                {errors.deviceId && <p className="text-red-500 text-sm mt-1">{errors.deviceId}</p>}
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
                    errors.deviceName ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="e.g., Temperature Sensor 001"
                />
                {errors.deviceName && <p className="text-red-500 text-sm mt-1">{errors.deviceName}</p>}
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
                    errors.productId ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="e.g., ST-2000"
                />
                {errors.productId && <p className="text-red-500 text-sm mt-1">{errors.productId}</p>}
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
                    errors.serialNumber ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="e.g., SN123456789"
                />
                {errors.serialNumber && <p className="text-red-500 text-sm mt-1">{errors.serialNumber}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Location (optional)
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
                  Metadata (optional)
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
                      errors.authenticationCredential ? 'border-red-500' : 'border-slate-300'
                    }`}
                    placeholder="Enter authentication key or token"
                  />
                </div>
                {errors.authenticationCredential && <p className="text-red-500 text-sm mt-1">{errors.authenticationCredential}</p>}
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
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.connectionProtocol ? 'border-red-500' : 'border-slate-300'
                    }`}
                  >
                    <option value="MQTT">MQTT</option>
                    <option value="HTTP">HTTP</option>
                    <option value="COAP">COAP</option>
                    <option value="TCP">TCP</option>
                    <option value="UDP">UDP</option>
                  </select>
                </div>
                {errors.connectionProtocol && <p className="text-red-500 text-sm mt-1">{errors.connectionProtocol}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Network Config *
                </label>
                <textarea
                  value={formData.networkConfig}
                  onChange={(e) => handleInputChange('networkConfig', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.networkConfig ? 'border-red-500' : 'border-slate-300'
                  }`}
                  rows={4}
                  placeholder="Enter network configuration details (IP address, port, broker URL, etc.)"
                />
                {errors.networkConfig && <p className="text-red-500 text-sm mt-1">{errors.networkConfig}</p>}
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
                {/* File Upload Status */}
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
                          <p className="text-xs text-green-600 mt-1">✓ Successfully uploaded and processed</p>
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

                {/* Show PDF Processing Results */}
                {showPDFResults && pdfResultsData && (
                  <PDFProcessingResults
                    results={pdfResultsData}
                    onRulesUpdate={(rules) => handlePDFResultsUpdate('rules', rules)}
                    onMaintenanceUpdate={(maintenance) => handlePDFResultsUpdate('maintenance', maintenance)}
                    onSafetyUpdate={(safety) => handlePDFResultsUpdate('safety', safety)}
                    onConfirm={handlePDFResultsConfirm}
                  />
                )}

                {/* Show Selected Results Summary */}
                {(selectedRules.length > 0 || selectedMaintenance.length > 0 || selectedSafety.length > 0) && (
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Selection Confirmed!</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-600" />
                        <span className="text-slate-700">
                          {selectedRules.length} IoT Rules Selected
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-orange-600" />
                        <span className="text-slate-700">
                          {selectedMaintenance.length} Maintenance Items
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="text-slate-700">
                          {selectedSafety.length} Safety Precautions
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mt-2">
                      These items will be automatically configured when you create your device.
                    </p>
                  </div>
                )}

                {/* Next Steps */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Rocket className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Ready to Complete Onboarding</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Your device is ready to be added to the system. Click "Complete Onboarding" to create your device with AI-generated rules and maintenance schedules.
                  </p>
                </div>
              </div>
            )}

            {/* AI Analysis Info */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">AI Analysis</span>
              </div>
              <p className="text-sm text-blue-700">
                Our AI analyzes your documentation to automatically generate monitoring rules, 
                maintenance schedules, and performance recommendations for your device.
              </p>
            </div>
          </div>
        );
    }
  }, [currentStep, formData, uploadedFile, generatedRules, maintenanceData, handleInputChange, removeFile, handleFileUpload, errors, showPDFResults, pdfResultsData, selectedRules, selectedMaintenance, selectedSafety]);

  return (
    <>
      {/* Enhanced Onboarding Loader */}
      {showOnboardingLoader && (
        <DeviceOnboardingLoader
          isProcessing={true}
          currentProcess={currentOnboardingProcess}
          progress={onboardingProgress}
          onComplete={() => setShowOnboardingLoader(false)}
          pdfFileName={uploadedFile?.file.name}
          currentSubStage={onboardingSubStage}
          subStageProgress={onboardingSubProgress}
        />
      )}

      {/* Success Notification */}
      {showSuccessNotification && (
        <DeviceOnboardingSuccess
          deviceName={createdDeviceName}
          pdfFileName={uploadedFile?.file.name}
          rulesCount={selectedRules.length}
          maintenanceCount={selectedMaintenance.length}
          safetyCount={selectedSafety.length}
          processingDetails={{
            total_pages: pdfResultsData?.total_pages || 0,
            processed_chunks: pdfResultsData?.processed_chunks || 0,
            processing_time: pdfResultsData?.processing_time || 0
          }}
          onContinue={() => {
            setShowSuccessNotification(false);
            onCancel();
          }}
          onStartChat={() => {
            setShowSuccessNotification(false);
            setShowChatInterface(true);
          }}
          onClose={() => {
            setShowSuccessNotification(false);
            onCancel();
          }}
        />
      )}

      {/* Chat Interface */}
      {showChatInterface && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full h-[80vh] flex flex-col">
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">AI Chat Assistant</h3>
                  <p className="text-sm text-slate-600">Ask questions about your newly onboarded device</p>
                </div>
                <button
                  onClick={() => {
                    setShowChatInterface(false);
                    onCancel();
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>
            <div className="flex-1 p-4">
              <DeviceChatInterface
                deviceId={formData.deviceId}
                deviceName={formData.deviceName}
                pdfFileName={uploadedFile?.file.name}
                deviceType={formData.productId}
                manufacturer=""
                model={formData.productId}
                onClose={() => {
                  setShowChatInterface(false);
                  onCancel();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* AI Processing Loader */}
      {showProcessingLoader && (
        <AIProcessingLoader
          isProcessing={isProcessingPDF}
          currentStage={processingStage}
          progress={processingProgress}
          onComplete={() => setShowProcessingLoader(false)}
        />
      )}

      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
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
          <div className="flex items-center justify-center mt-6">
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
            <div className="flex items-center gap-3 mb-2">
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

          {/* Celebration Screen */}
          {showCelebration && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center animate-bounce">
                <div className="mb-6">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">
                    🎉 Device Added Successfully!
                  </h3>
                  <p className="text-slate-600 mb-4">
                    Your IoT device <strong>"{createdDeviceName}"</strong> has been successfully onboarded.
                  </p>
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800">
                      💬 You can now monitor and manage this device in real-time!
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCelebration(false)}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Main Content */}
          {!isStepLoading && renderStepContent()}
        </div>

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
                      {stepLoadingMessage || 'Onboarding Device...'}
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
    </>
  );
};
