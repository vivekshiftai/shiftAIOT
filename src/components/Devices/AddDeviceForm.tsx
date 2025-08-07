import React, { useState } from 'react';
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
  X
} from 'lucide-react';

interface DeviceFormData {
  name: string;
  type: 'SENSOR' | 'ACTUATOR' | 'GATEWAY' | 'CONTROLLER';
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

interface AddDeviceFormProps {
  onSubmit: (deviceData: DeviceFormData, files: FileUpload[]) => Promise<void>;
  onCancel: () => void;
}

export const AddDeviceForm: React.FC<AddDeviceFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<DeviceFormData>({
    name: '',
    type: 'SENSOR',
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof DeviceFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: FileUpload['type']) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, [`${type}File`]: 'Only PDF, DOC, DOCX, and TXT files are allowed' }));
      return;
    }

    // Validate file size (10MB limit)
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Device name is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.manufacturer.trim()) {
      newErrors.manufacturer = 'Manufacturer is required';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Model is required';
    }

    // Validate MAC address format if provided
    if (formData.macAddress && !/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(formData.macAddress)) {
      newErrors.macAddress = 'Invalid MAC address format (use XX:XX:XX:XX:XX:XX)';
    }

    // Validate IP address format if provided
    if (formData.ipAddress && !/^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(formData.ipAddress)) {
      newErrors.ipAddress = 'Invalid IP address format';
    }

    // Validate port number
    if (formData.port < 1 || formData.port > 65535) {
      newErrors.port = 'Port must be between 1 and 65535';
    }

    // Validate temperature range
    if (formData.operatingTemperatureMin >= formData.operatingTemperatureMax) {
      newErrors.operatingTemperatureMin = 'Minimum temperature must be less than maximum temperature';
    }

    // Validate humidity range
    if (formData.operatingHumidityMin >= formData.operatingHumidityMax) {
      newErrors.operatingHumidityMin = 'Minimum humidity must be less than maximum humidity';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData, fileUploads);
    } catch (error) {
      console.error('Error submitting device:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFileIcon = (type: FileUpload['type']) => {
    switch (type) {
      case 'manual': return <FileText className="w-4 h-4" />;
      case 'datasheet': return <Settings className="w-4 h-4" />;
      case 'certificate': return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getFileTypeLabel = (type: FileUpload['type']) => {
    switch (type) {
      case 'manual': return 'Device Manual';
      case 'datasheet': return 'Datasheet';
      case 'certificate': return 'Certificate';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">Add IoT Device</h2>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          <p className="text-slate-600 mt-2">Add a new IoT device to your platform with all necessary details and documentation.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
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
          </div>

          {/* Device Specifications */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Device Specifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>
          </div>

          {/* Connectivity Configuration */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Wifi className="w-5 h-5" />
              Connectivity Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          {/* Environmental Specifications */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Thermometer className="w-5 h-5" />
              Environmental Specifications
            </h3>
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
          </div>

          {/* Additional Information */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Additional Information</h3>
            <div className="space-y-4">
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Installation Notes
                </label>
                <textarea
                  value={formData.installationNotes}
                  onChange={(e) => handleInputChange('installationNotes', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Special installation requirements or instructions..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Maintenance Schedule
                </label>
                <input
                  type="text"
                  value={formData.maintenanceSchedule}
                  onChange={(e) => handleInputChange('maintenanceSchedule', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Quarterly calibration required"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Warranty Information
                </label>
                <input
                  type="text"
                  value={formData.warrantyInfo}
                  onChange={(e) => handleInputChange('warrantyInfo', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 2 years manufacturer warranty"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Tags</h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add a tag..."
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-blue-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* File Uploads */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Documentation Files
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['manual', 'datasheet', 'certificate'] as const).map((type) => (
                <div key={type} className="border-2 border-dashed border-slate-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {getFileTypeLabel(type)}
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

            {/* Uploaded Files */}
            {fileUploads.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Uploaded Files:</h4>
                <div className="space-y-2">
                  {fileUploads.map((fileUpload, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getFileIcon(fileUpload.type)}
                        <div>
                          <p className="text-sm font-medium text-slate-800">{fileUpload.file.name}</p>
                          <p className="text-xs text-slate-500">
                            {getFileTypeLabel(fileUpload.type)} • {(fileUpload.file.size / 1024 / 1024).toFixed(2)} MB
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
          </div>

          {/* Form Actions */}
          <div className="border-t border-slate-200 pt-6 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Adding Device...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add Device
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
