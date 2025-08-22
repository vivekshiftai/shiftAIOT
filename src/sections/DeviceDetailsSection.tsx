import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Settings, 
  Zap, 
  FileText, 
  Info, 
  Wifi, 
  Cpu, 
  Thermometer, 
  Battery, 
  Clock, 
  Tag, 
  MessageSquare,
  Wrench,
  Activity,
  AlertTriangle,
  CheckCircle,
  Download,
  Send,
  Bot,
  User,
  Shield
} from 'lucide-react';
import { useIoT } from '../contexts/IoTContext';
import { useAuth } from '../contexts/AuthContext';
import { Device } from '../types';
import { DeviceRules } from '../components/Devices/DeviceRules';
import { DeviceConnectionManager } from '../components/Devices/DeviceConnectionManager';
import DeviceSafetyInfo from '../components/Devices/DeviceSafetyInfo';
import { deviceAPI } from '../services/api';
import { pdfProcessingService, PDFListResponse } from '../services/pdfprocess';
import { DeviceStatsService, DeviceStats } from '../services/deviceStatsService';
import { logError, logInfo } from '../utils/logger';

interface DocumentationInfo {
  deviceId: string;
  deviceName: string;
  files: {
    manual: { available: boolean; url?: string; size?: number };
    datasheet: { available: boolean; url?: string; size?: number };
    certificate: { available: boolean; url?: string; size?: number };
  };
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface KnowledgeDocument {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  processedAt?: string;
  size: number;
  status: string;
  vectorized: boolean;
  chunk_count?: number;
  deviceId?: string;
  deviceName?: string;
}

const tabs = [
  { id: 'device-info', label: 'Device Information', icon: Info },
  { id: 'maintenance', label: 'Maintenance Details', icon: Wrench },
  { id: 'rules', label: 'Rules', icon: Zap },
  { id: 'safety', label: 'Safety Info', icon: Shield },
  { id: 'chat', label: 'Chat History', icon: MessageSquare }
];

export const DeviceDetailsSection: React.FC = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const { devices, updateDeviceStatus } = useIoT();
  const { hasPermission } = useAuth();
  const [showRules, setShowRules] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [activeTab, setActiveTab] = useState('device-info');
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [documentationInfo, setDocumentationInfo] = useState<DocumentationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [devicePDFs, setDevicePDFs] = useState<KnowledgeDocument[]>([]);
  const [selectedPDF, setSelectedPDF] = useState<KnowledgeDocument | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m here to help you with information about this device. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Real-time data states
  const [deviceStats, setDeviceStats] = useState<DeviceStats | null>(null);
  const [maintenanceHistory, setMaintenanceHistory] = useState<any[]>([]);
  const [deviceRules, setDeviceRules] = useState<any[]>([]);
  const [safetyPrecautions, setSafetyPrecautions] = useState<any[]>([]);
  const [lastSeen, setLastSeen] = useState<string>('');
  const [isRealTimeLoading, setIsRealTimeLoading] = useState(false);

  const device = devices.find(d => d.id === deviceId);

  useEffect(() => {
    if (!device && devices.length > 0) {
      // If device not found, redirect to devices list
      navigate('/devices');
    }
  }, [device, devices, navigate]);

  useEffect(() => {
    if (device) {
      fetchDocumentationInfo();
      loadDevicePDFs();
      fetchRealTimeData();
    }
  }, [device?.id]);

  // Real-time data fetching
  const fetchRealTimeData = async () => {
    if (!device) return;
    
    setIsRealTimeLoading(true);
    try {
      logInfo('DeviceDetails', `🔄 Fetching real-time data for device: ${device.name} (${device.id})`);
      
      // Fetch device statistics
      const stats = await DeviceStatsService.getDeviceStats(device.id);
      console.log('📊 Device stats:', stats);
      setDeviceStats(stats);
      
      // Fetch detailed data
      const [rules, maintenance, safety] = await Promise.allSettled([
        DeviceStatsService.getDeviceRules(device.id),
        DeviceStatsService.getDeviceMaintenance(device.id),
        DeviceStatsService.getDeviceSafety(device.id)
      ]);
      
      console.log('📋 Rules result:', rules);
      console.log('🔧 Maintenance result:', maintenance);
      console.log('🛡️ Safety result:', safety);
      
      const rulesData = rules.status === 'fulfilled' ? rules.value : [];
      const maintenanceData = maintenance.status === 'fulfilled' ? maintenance.value : [];
      const safetyData = safety.status === 'fulfilled' ? safety.value : [];
      
      console.log('📋 Rules data:', rulesData);
      console.log('🔧 Maintenance data:', maintenanceData);
      console.log('🛡️ Safety data:', safetyData);
      
      setDeviceRules(rulesData);
      setMaintenanceHistory(maintenanceData);
      setSafetyPrecautions(safetyData);
      
      // Update last seen timestamp
      setLastSeen(new Date().toISOString());
      
      logInfo('DeviceDetails', `✅ Real-time data fetched successfully for ${device.name}`);
    } catch (error) {
      logError('DeviceDetails', 'Failed to fetch real-time data', error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setIsRealTimeLoading(false);
    }
  };

  // Auto-refresh real-time data every 30 seconds
  useEffect(() => {
    if (!device) return;
    
    const interval = setInterval(() => {
      fetchRealTimeData();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [device?.id]);

  const loadDevicePDFs = async () => {
    if (!device) return;
    
    try {
      // Load all PDFs from external API
      const pdfListResponse: PDFListResponse = await pdfProcessingService.listPDFs();
      
      // Filter PDFs that might be associated with this device
      // We'll look for PDFs that contain the device name or are likely related
      const deviceNameLower = device.name.toLowerCase();
      const deviceTypeLower = device.type.toLowerCase();
      
      const filteredPDFs: KnowledgeDocument[] = pdfListResponse.pdfs
        .map((pdf, index) => ({
          id: index.toString(),
          name: pdf.pdf_name,
          type: 'pdf',
          uploadedAt: pdf.created_at,
          processedAt: pdf.created_at,
          size: 0,
          status: 'completed',
          vectorized: true,
          chunk_count: pdf.chunk_count,
          deviceId: device.id,
          deviceName: device.name
        }))
        .filter(pdf => {
          const pdfNameLower = pdf.name.toLowerCase();
          // Check if PDF name contains device name, device type, or common device-related terms
          return pdfNameLower.includes(deviceNameLower) ||
                 pdfNameLower.includes(deviceTypeLower) ||
                 pdfNameLower.includes('manual') ||
                 pdfNameLower.includes('datasheet') ||
                 pdfNameLower.includes('specification') ||
                 pdfNameLower.includes('guide') ||
                 pdfNameLower.includes('instruction') ||
                 pdfNameLower.includes('user') ||
                 pdfNameLower.includes('technical');
        });
      
      setDevicePDFs(filteredPDFs);
      
      // Auto-select the first PDF if available
      if (filteredPDFs.length > 0 && !selectedPDF) {
        setSelectedPDF(filteredPDFs[0]);
      }
      
      // Update initial chat message if PDFs are found
      if (filteredPDFs.length > 0) {
        setChatMessages(prev => [
          {
            id: '1',
            type: 'assistant',
            content: `Hello! I found ${filteredPDFs.length} PDF document(s) related to the ${device.name} device. I can help you find information from these documents. What would you like to know?`,
            timestamp: new Date()
          }
        ]);
      }
    } catch (error) {
      logError('DeviceDetails', 'Failed to load device PDFs', error instanceof Error ? error : new Error('Unknown error'));
    }
  };

  const handleTabChange = (tabId: string) => {
    setIsTabLoading(true);
    setActiveTab(tabId);
    // Simulate loading for better UX
    setTimeout(() => setIsTabLoading(false), 100);
  };

  const fetchDocumentationInfo = async () => {
    if (!device) return;
    try {
      setLoading(true);
      const response = await deviceAPI.getDocumentation(device.id);
      setDocumentationInfo(response.data);
    } catch (error) {
      logError('DeviceDetails', 'Failed to fetch documentation info', error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const downloadDocumentation = async (type: 'manual' | 'datasheet' | 'certificate') => {
    if (!device || !documentationInfo?.files[type].available) return;

    try {
      setDownloading(type);
      // Note: downloadDocumentation method is not implemented in the API
      // This is a placeholder for future implementation
      logInfo('DeviceDetails', `Download ${type} requested for device: ${device.name}`);
      alert(`Download functionality for ${type} is not yet implemented.`);
    } catch (error) {
      logError('DeviceDetails', `Failed to download ${type}`, error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setDownloading(null);
    }
  };

  if (!device) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Cpu className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-800 mb-2">Device not found</h3>
          <p className="text-slate-600 mb-6">
            The device you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/devices')}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all"
          >
            Back to Devices
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = {
    ONLINE: { 
      color: 'text-green-600', 
      bg: 'bg-green-50',
      label: 'Online'
    },
    OFFLINE: { 
      color: 'text-slate-600', 
      bg: 'bg-slate-50',
      label: 'Offline'
    },
    WARNING: { 
      color: 'text-yellow-600', 
      bg: 'bg-yellow-50',
      label: 'Warning'
    },
    ERROR: { 
      color: 'text-red-600', 
      bg: 'bg-red-50',
      label: 'Error'
    }
  };

  const deviceTypeConfig = {
    SENSOR: { icon: Thermometer, label: 'Sensor' },
    ACTUATOR: { icon: Cpu, label: 'Actuator' },
    GATEWAY: { icon: Wifi, label: 'Gateway' },
    CONTROLLER: { icon: Cpu, label: 'Controller' }
  };

  const statusInfo = statusConfig[device.status];
  const deviceTypeInfo = deviceTypeConfig[device.type];

  const formatLastSeen = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: newMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);

    try {
      // If we have a selected PDF, query it specifically
      if (selectedPDF) {
        try {
          const queryRequest = {
            pdf_name: selectedPDF.name,
            query: userMessage.content,
            top_k: 5
          };
          
          const queryResponse = await pdfProcessingService.queryPDF(queryRequest);
          
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: queryResponse.response || `I found relevant information in the "${selectedPDF.name}" document. ${queryResponse.chunks_used.length > 0 ? 'Here\'s what I found: ' + queryResponse.response.substring(0, 300) + '...' : 'Would you like me to search for more specific information?'}`,
            timestamp: new Date()
          };
          setChatMessages(prev => [...prev, assistantMessage]);
        } catch (queryError) {
          logError('DeviceDetails', 'Failed to query PDF', queryError instanceof Error ? queryError : new Error('Unknown error'));
          const errorMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: `I encountered an error while searching the "${selectedPDF.name}" document. Please try again or ask a different question.`,
            timestamp: new Date()
          };
          setChatMessages(prev => [...prev, errorMessage]);
        }
      } else {
        // Generate a general response about the device
        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `I understand you're asking about "${userMessage.content}" for the ${device?.name} device. ${devicePDFs.length > 0 ? `I found ${devicePDFs.length} PDF document(s) related to this device. Would you like me to search through them for specific information?` : 'I don\'t have any PDF documents specifically associated with this device, but I can help you with general device information.'}`,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, aiResponse]);
      }
    } catch (error) {
      logError('DeviceDetails', 'Failed to send message', error instanceof Error ? error : new Error('Unknown error'));
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error while processing your request. Please try again.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'device-info':
        return (
          <div className="space-y-8">
            {/* Status and Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <div className={`p-2 rounded-lg ${statusInfo.bg}`}>
                  <div className={`w-4 h-4 rounded-full ${statusInfo.color.replace('text-', 'bg-')}`}></div>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Status</p>
                  <p className={`font-semibold ${statusInfo.color}`}>{statusInfo.label}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <Clock className="w-5 h-5 text-slate-500" />
                <div>
                  <p className="text-sm text-slate-600">Last Seen</p>
                  <p className="font-semibold text-slate-800">
                    {lastSeen ? formatLastSeen(lastSeen) : formatLastSeen(device.lastSeen)}
                    {isRealTimeLoading && (
                      <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <Wifi className="w-5 h-5 text-slate-500" />
                <div>
                  <p className="text-sm text-slate-600">Protocol</p>
                  <p className="font-semibold text-slate-800">{device.protocol}</p>
                </div>
              </div>
            </div>

            {/* Device Information and Specifications */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Device Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Device Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-600">Manufacturer</label>
                    <p className="text-slate-800">{device.manufacturer || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Model</label>
                    <p className="text-slate-800">{device.model || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Serial Number</label>
                    <p className="text-slate-800">{device.serialNumber || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Firmware</label>
                    <p className="text-slate-800">{device.firmware || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Assigned User</label>
                    <p className="text-slate-800">{device.assignedUserId ? `User ID: ${device.assignedUserId}` : 'Not assigned'}</p>
                  </div>
                </div>
              </div>

              {/* Power & Environment */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Battery className="w-5 h-5" />
                  Power & Environment
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-600">Power Source</label>
                    <p className="text-slate-800">{device.powerSource || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Power Consumption</label>
                    <p className="text-slate-800">{device.powerConsumption ? `${device.powerConsumption}W` : 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Operating Temperature</label>
                    <p className="text-slate-800">
                      {device.operatingTemperatureMin && device.operatingTemperatureMax 
                        ? `${device.operatingTemperatureMin}°C to ${device.operatingTemperatureMax}°C`
                        : 'Not specified'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Operating Humidity</label>
                    <p className="text-slate-800">
                      {device.operatingHumidityMin && device.operatingHumidityMax 
                        ? `${device.operatingHumidityMin}% to ${device.operatingHumidityMax}%`
                        : 'Not specified'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Connection Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Network Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Wifi className="w-5 h-5" />
                  Network Configuration
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-600">WiFi SSID</label>
                    <p className="text-slate-800">{device.wifiSsid || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">IP Address</label>
                    <p className="text-slate-800">{device.ipAddress || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">MAC Address</label>
                    <p className="text-slate-800">{device.macAddress || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Port</label>
                    <p className="text-slate-800">{device.port || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* MQTT Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  MQTT Configuration
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-600">MQTT Broker</label>
                    <p className="text-slate-800">{device.mqttBroker || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">MQTT Topic</label>
                    <p className="text-slate-800">{device.mqttTopic || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {device.tags && device.tags.length > 0 && (
              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {device.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Documentation */}
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Documentation
              </h3>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-slate-600 mt-2">Loading documentation...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['manual', 'datasheet', 'certificate'].map((type) => {
                    const fileInfo = documentationInfo?.files[type as keyof typeof documentationInfo.files];
                    const isAvailable = fileInfo?.available;
                    const isDownloading = downloading === type;
                    
                    return (
                      <div
                        key={type}
                        className={`p-4 rounded-xl border-2 ${
                          isAvailable 
                            ? 'border-green-200 bg-green-50 hover:bg-green-100 cursor-pointer' 
                            : 'border-slate-200 bg-slate-50'
                        } transition-colors`}
                        onClick={() => isAvailable && downloadDocumentation(type as 'manual' | 'datasheet' | 'certificate')}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            isAvailable ? 'bg-green-100' : 'bg-slate-100'
                          }`}>
                            <FileText className={`w-5 h-5 ${
                              isAvailable ? 'text-green-600' : 'text-slate-400'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-800 capitalize">{type}</h4>
                            <p className="text-sm text-slate-600">
                              {isAvailable 
                                ? fileInfo?.size ? formatFileSize(fileInfo.size) : 'Available'
                                : 'Not available'
                              }
                            </p>
                          </div>
                          {isDownloading && (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                          )}
                          {isAvailable && !isDownloading && (
                            <Download className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );

      case 'maintenance':
        return (
          <div className="space-y-6">
            {/* Real-time Status */}
            {isRealTimeLoading && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-blue-800 font-medium">Updating real-time data...</span>
                </div>
              </div>
            )}

            {/* Device Statistics */}
            {deviceStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Wrench className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Maintenance Tasks</p>
                      <p className="text-2xl font-bold text-slate-800">{deviceStats.maintenanceCount}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Safety Precautions</p>
                      <p className="text-2xl font-bold text-slate-800">{deviceStats.safetyCount}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Zap className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Active Rules</p>
                      <p className="text-2xl font-bold text-slate-800">{deviceStats.rulesCount}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Maintenance Schedule */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <h3 className="font-semibold text-yellow-800">Maintenance Schedule</h3>
              </div>
              <p className="text-yellow-700">{device.maintenanceSchedule || 'No maintenance schedule defined'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Real-time Maintenance History */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">Maintenance History</h3>
                {maintenanceHistory.length > 0 ? (
                  <div className="space-y-3">
                    {maintenanceHistory.slice(0, 3).map((maintenance, index) => (
                      <div key={index} className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-800">{maintenance.title || 'Maintenance Task'}</span>
                          <span className="text-sm text-slate-600">
                            {maintenance.scheduledDate ? new Date(maintenance.scheduledDate).toLocaleDateString() : 'Scheduled'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{maintenance.description || 'Maintenance task'}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            maintenance.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            maintenance.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {maintenance.status || 'PENDING'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Wrench className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p>No maintenance history available</p>
                  </div>
                )}
              </div>

              {/* Warranty Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">Warranty Information</h3>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">Under Warranty</span>
                  </div>
                  <p className="text-green-700">{device.warrantyInfo || 'Standard warranty coverage'}</p>
                </div>
                
                {/* Last Updated */}
                {lastSeen && (
                  <div className="text-xs text-slate-500 mt-2">
                    Last updated: {new Date(lastSeen).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'rules':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Device Rules</h3>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/devices/${deviceId}/debug-data`, {
                        headers: {
                          'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                      });
                      const data = await response.json();
                      console.log('🔍 Debug data:', data);
                      alert(`Debug data: ${JSON.stringify(data, null, 2)}`);
                    } catch (error) {
                      console.error('Debug error:', error);
                      alert('Debug error: ' + error);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
                >
                  Debug
                </button>
                <button
                  onClick={() => setShowRules(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all"
                >
                  <Zap className="w-4 h-4" />
                  Manage Rules
                </button>
              </div>
            </div>
            
            {/* Real-time Rules Status */}
            {deviceRules.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {deviceRules.slice(0, 6).map((rule, index) => (
                    <div key={index} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-slate-800 truncate">{rule.name || `Rule ${index + 1}`}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          rule.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {rule.active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                        {rule.description || 'Automation rule for device control'}
                      </p>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Type: {rule.type || 'Condition'}</span>
                        {rule.lastTriggered && (
                          <span>Last: {new Date(rule.lastTriggered).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {deviceRules.length > 6 && (
                  <div className="text-center text-slate-500 text-sm">
                    Showing 6 of {deviceRules.length} rules
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-600">
                <Zap className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p>No rules configured for this device.</p>
                <p className="text-sm text-slate-500 mt-2">Click "Manage Rules" to configure automation rules.</p>
              </div>
            )}
            
            {/* Last Updated */}
            {lastSeen && (
              <div className="text-xs text-slate-500 text-center">
                Last updated: {new Date(lastSeen).toLocaleString()}
              </div>
            )}
          </div>
        );



      case 'safety':
        return (
          <div className="space-y-6">
            {/* Real-time Status */}
            {isRealTimeLoading && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-blue-800 font-medium">Updating real-time safety data...</span>
                </div>
              </div>
            )}

            {/* Safety Statistics */}
            {deviceStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <Shield className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Safety Precautions</p>
                      <p className="text-2xl font-bold text-slate-800">{deviceStats.safetyCount}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Wrench className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Maintenance Tasks</p>
                      <p className="text-2xl font-bold text-slate-800">{deviceStats.maintenanceCount}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Zap className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Active Rules</p>
                      <p className="text-2xl font-bold text-slate-800">{deviceStats.rulesCount}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Real-time Safety Precautions */}
            {safetyPrecautions.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">Safety Precautions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {safetyPrecautions.slice(0, 4).map((precaution, index) => (
                    <div key={index} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-50 rounded-lg">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-800 mb-2">{precaution.title || `Safety Precaution ${index + 1}`}</h4>
                          <p className="text-sm text-slate-600 mb-3">{precaution.description || 'Safety precaution for device operation'}</p>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              precaution.severity === 'HIGH' ? 'bg-red-100 text-red-800' :
                              precaution.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {precaution.severity || 'MEDIUM'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Device Safety Info Component */}
            <div className="border-t border-slate-200 pt-6">
              <DeviceSafetyInfo deviceId={device.id} />
            </div>

            {/* Last Updated */}
            {lastSeen && (
              <div className="text-xs text-slate-500 text-center">
                Last updated: {new Date(lastSeen).toLocaleString()}
              </div>
            )}
          </div>
        );

      case 'chat':
        return (
          <div className="flex flex-col h-96">
            {/* PDF Selection */}
            {devicePDFs.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Available PDFs ({devicePDFs.length}):</span>
                  </div>
                  <select
                    value={selectedPDF?.id || ''}
                    onChange={(e) => {
                      const pdf = devicePDFs.find(p => p.id === e.target.value);
                      setSelectedPDF(pdf || null);
                    }}
                    className="text-sm border border-blue-200 rounded px-2 py-1 bg-white"
                  >
                    <option value="">Select a PDF to query...</option>
                    {devicePDFs.map((pdf) => (
                      <option key={pdf.id} value={pdf.id}>
                        {pdf.name}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedPDF && (
                  <div className="text-xs text-blue-600">
                    <p className="font-medium">Currently querying: {selectedPDF.name}</p>
                    {selectedPDF.chunk_count && (
                      <p className="text-blue-500">Contains {selectedPDF.chunk_count} knowledge chunks</p>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {devicePDFs.length === 0 && (
              <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">No PDF documents found for this device</span>
                </div>
                <p className="text-xs text-yellow-600 mt-1">
                  Upload PDF documents in the Knowledge section to enable AI-powered chat assistance.
                </p>
              </div>
            )}

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-slate-50 rounded-lg">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex items-start gap-3 max-w-3xl">
                    <div className={`p-2 rounded-full flex-shrink-0 shadow-sm ${
                      message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}>
                      {message.type === 'user' ? (<User className="w-4 h-4" />) : (<Bot className="w-4 h-4" />)}
                    </div>
                    <div
                      className={`px-4 py-2 rounded-lg max-w-xs lg:max-w-md ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-slate-800 border border-slate-200'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.type === 'user' ? 'text-blue-100' : 'text-slate-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-3 max-w-3xl">
                    <div className="p-2 rounded-full flex-shrink-0 shadow-sm bg-white text-slate-600 border border-slate-200">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="px-4 py-2 rounded-lg bg-white text-slate-800 border border-slate-200">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="flex gap-2 mt-4">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={selectedPDF ? `Ask about "${selectedPDF.name}"...` : "Ask about this device..."}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || isTyping}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>

            {/* Quick Actions */}
            {devicePDFs.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => setNewMessage('How do I set up this device?')}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  Setup Guide
                </button>
                <button
                  onClick={() => setNewMessage('What maintenance is required?')}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  Maintenance
                </button>
                <button
                  onClick={() => setNewMessage('Help me troubleshoot issues')}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  Troubleshooting
                </button>
                <button
                  onClick={() => setNewMessage('Show me technical specifications')}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  Specifications
                </button>
                {device?.type === 'SENSOR' && (
                  <button
                    onClick={() => setNewMessage('What are the sensor calibration procedures?')}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    Calibration
                  </button>
                )}
                {device?.type === 'GATEWAY' && (
                  <button
                    onClick={() => setNewMessage('How do I configure network settings?')}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    Network Config
                  </button>
                )}
                {device?.type === 'ACTUATOR' && (
                  <button
                    onClick={() => setNewMessage('What are the safety procedures for this actuator?')}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    Safety Procedures
                  </button>
                )}
              </div>
            )}
          </div>
        );



      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/devices')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-4">
            <div className={`${statusInfo.bg} p-3 rounded-xl shadow-sm`}>
              {React.createElement(deviceTypeInfo.icon, { 
                className: `w-6 h-6 ${statusInfo.color}` 
              })}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">{device.name}</h1>
              <p className="text-slate-600">{deviceTypeInfo.label} • {device.location}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {hasPermission('DEVICE_UPDATE') && (
            <button
              onClick={() => setShowConnections(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all"
            >
              <Wifi className="w-4 h-4" />
              Connections
            </button>
          )}
          {hasPermission('RULE_READ') && (
            <button
              onClick={() => setShowRules(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all"
            >
              <Zap className="w-4 h-4" />
              Rules
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white rounded-t-xl">
        <div className="flex overflow-x-auto scrollbar-hide relative">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleTabChange(tab.id);
                }
              }}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              className={`flex items-center gap-3 px-6 py-4 border-b-2 font-medium whitespace-nowrap transition-all duration-300 hover:bg-slate-50 relative focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 bg-blue-50 shadow-sm'
                  : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <tab.icon className={`w-5 h-5 transition-colors duration-200 ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-500'}`} />
              <span className="font-semibold">{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-500 rounded-t-full"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-b-xl shadow-lg border border-slate-200">
        <div 
          className="p-6"
          role="tabpanel"
          id={`tabpanel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
        >
          {isTabLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-slate-600 font-medium">Loading...</span>
              </div>
            </div>
          ) : (
            renderTabContent()
          )}
        </div>
      </div>

      {/* Device Rules Modal */}
      {showRules && hasPermission('RULE_READ') && (
        <DeviceRules
          device={device}
          onClose={() => setShowRules(false)}
        />
      )}

      {/* Device Connections Modal */}
      {showConnections && hasPermission('DEVICE_WRITE') && (
        <DeviceConnectionManager
          deviceId={device.id}
          onClose={() => setShowConnections(false)}
        />
      )}
    </div>
  );
};
