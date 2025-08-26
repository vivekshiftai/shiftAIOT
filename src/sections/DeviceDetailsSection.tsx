import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Settings,
  Trash2,
  Edit,
  Download,
  Upload,
  FileText,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  Send,
  User,
  Bot,
  Plus,
  Search,
  Filter,
  Eye,
  EyeOff,
  ArrowLeft
} from 'lucide-react';
import { useIoT } from '../contexts/IoTContext';
import { useAuth } from '../contexts/AuthContext';
import { DeviceCard } from '../components/Devices/DeviceCard';
import { DeviceDetails } from '../components/Devices/DeviceDetails';
import DeviceAnalyticsDisplay from '../components/Devices/DeviceAnalyticsDisplay';
import DeviceLogsDisplay from '../components/Devices/DeviceLogsDisplay';
import DeviceMaintenanceDisplay from '../components/Devices/DeviceMaintenanceDisplay';
import DeviceRulesDisplay from '../components/Devices/DeviceRulesDisplay';
import { DevicePDFResults } from '../components/Devices/DevicePDFResults';
import { DeviceChatInterface } from '../components/Devices/DeviceChatInterface';
import DeviceSafetyInfo from '../components/Devices/DeviceSafetyInfo';
import { DeviceRules } from '../components/Devices/DeviceRules';
import { DeviceConnectionManager } from '../components/Devices/DeviceConnectionManager';
import ChatImageDisplay from '../components/Devices/ChatImageDisplay';
import ChatTableDisplay from '../components/Devices/ChatTableDisplay';
import { deviceAPI } from '../services/api';
import { pdfAPI } from '../services/api';
import { pdfProcessingService, PDFListResponse } from '../services/pdfprocess';
import { DeviceStatsService, DeviceStats } from '../services/deviceStatsService';
import { logInfo, logError } from '../utils/logger';
import { TabLoadingScreen, DataLoadingState, LoadingSpinner } from '../components/Loading/LoadingComponents';
import { PDFImage } from '../services/chatService';

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
  images?: PDFImage[];
  tables?: string[];
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
  { id: 'device-info', label: 'Device Information', icon: Settings },
  { id: 'maintenance', label: 'Maintenance', icon: Settings },
  { id: 'rules', label: 'Rules', icon: FileText },
  { id: 'safety', label: 'Safety Info', icon: AlertTriangle },
  { id: 'chat', label: 'Chat', icon: MessageSquare }
];

export const DeviceDetailsSection: React.FC = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const { devices, updateDeviceStatus } = useIoT();
  const { hasPermission } = useAuth();
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
  const [initialChatMessage, setInitialChatMessage] = useState<string | null>(null);
  
  // Real-time data states
  const [deviceStats, setDeviceStats] = useState<DeviceStats | null>(null);
  const [maintenanceHistory, setMaintenanceHistory] = useState<any[]>([]);
  const [deviceRules, setDeviceRules] = useState<any[]>([]);
  const [safetyPrecautions, setSafetyPrecautions] = useState<any[]>([]);
  const [lastSeen, setLastSeen] = useState<string>('');
  const [isRealTimeLoading, setIsRealTimeLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // Edit state for device profile
  const [isEditing, setIsEditing] = useState(false);
  const [editedDevice, setEditedDevice] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const device = devices.find(d => d.id === deviceId);

  // Debug logging
  console.log('🔍 DeviceDetailsSection Debug:', {
    deviceId,
    devicesCount: devices.length,
    deviceFound: !!device,
    isInitialLoading,
    device: device
  });

  // Show loading if devices are still being loaded
  if (devices.length === 0) {
    console.log('🔄 Devices array is empty, showing loading screen');
    return <TabLoadingScreen />;
  }

  // Redirect if device not found
  if (!device) {
    console.log('❌ Device not found, redirecting to devices list');
    navigate('/devices');
    return null;
  }

  // Show loading screen while initial data is being fetched
  if (isInitialLoading) {
    console.log('🔄 Showing initial loading screen');
    return <TabLoadingScreen />;
  }

  useEffect(() => {
    if (device && deviceId) {
      console.log('🚀 Starting data loading for device:', device.id);
      setIsInitialLoading(true);
      
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.warn('⚠️ Data loading timeout, forcing completion');
        setIsInitialLoading(false);
      }, 30000); // 30 second timeout
      
      Promise.allSettled([
        fetchDocumentationInfo(),
        loadDevicePDFs(),
        fetchRealTimeData()
      ]).then((results) => {
        console.log('📊 Data loading results:', results);
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`❌ Data loading failed for index ${index}:`, result.reason);
          }
        });
      }).finally(() => {
        console.log('✅ Data loading completed');
        clearTimeout(timeoutId);
        setIsInitialLoading(false);
      });
    } else if (deviceId && devices.length > 0) {
      // Device not found but devices are loaded, stop loading
      console.log('❌ Device not found in devices array, stopping loading');
      setIsInitialLoading(false);
    }
  }, [deviceId, devices.length, device?.id]);

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
      
      // Fetch detailed data with better error handling
      logInfo('DeviceDetails', 'Fetching rules, maintenance, and safety data...');
      
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
      
      logInfo('DeviceDetails', `✅ Real-time data fetched successfully for ${device.name}`, {
        rulesCount: rulesData.length,
        maintenanceCount: maintenanceData.length,
        safetyCount: safetyData.length
      });
    } catch (error) {
      logError('DeviceDetails', 'Failed to fetch real-time data', error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setIsRealTimeLoading(false);
    }
  };



  const loadDevicePDFs = async () => {
    if (!device) return;
    
    try {
      console.log('📄 Loading PDFs for device:', device.id);
      // Load all PDFs from backend API
      const pdfListResponse = await pdfAPI.listPDFs(0, 100); // Use backend API
      
      // Filter PDFs that might be associated with this device
      // We'll look for PDFs that contain the device name or are likely related
      const deviceNameLower = device.name.toLowerCase();
      const deviceTypeLower = device.type.toLowerCase();
      
      const filteredPDFs: KnowledgeDocument[] = pdfListResponse.data.pdfs
        .map((pdf: any, index: number) => ({
          id: pdf.id || index.toString(),
          name: pdf.name || pdf.filename || `PDF_${index}`,
          type: 'pdf',
          uploadedAt: pdf.uploaded_at || pdf.created_at || new Date().toISOString(),
          processedAt: pdf.processed_at || pdf.created_at || new Date().toISOString(),
          size: pdf.file_size || pdf.size_bytes || 0,
          status: pdf.status || 'completed',
          vectorized: pdf.vectorized || true,
          chunk_count: pdf.chunk_count || 0,
          deviceId: device.id,
          deviceName: device.name
        }))
        .filter((pdf: any) => {
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
        setInitialChatMessage(`I have access to ${filteredPDFs.length} PDF document(s) related to ${device.name}. How can I help you with this device?`);
      }
      
      console.log('✅ Device PDFs loaded successfully:', { 
        deviceId: device.id, 
        totalPDFs: pdfListResponse.data.pdfs.length,
        filteredPDFs: filteredPDFs.length 
      });
      
      logInfo('DeviceDetails', 'Device PDFs loaded successfully', { 
        deviceId: device.id, 
        totalPDFs: pdfListResponse.data.pdfs.length,
        filteredPDFs: filteredPDFs.length 
      });
      
    } catch (error) {
      console.error('❌ Failed to load device PDFs:', error);
      logError('DeviceDetails', 'Failed to load device PDFs', error instanceof Error ? error : new Error('Unknown error'));
      setDevicePDFs([]);
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
      console.log('📚 Fetching documentation info for device:', device.id);
      const response = await deviceAPI.getDocumentation(device.id);
      setDocumentationInfo(response.data);
      console.log('✅ Documentation info loaded:', response.data);
    } catch (error) {
      console.error('❌ Failed to fetch documentation info:', error);
      logError('DeviceDetails', 'Failed to fetch documentation info', error instanceof Error ? error : new Error('Unknown error'));
      // Set empty documentation info on error
      setDocumentationInfo(null);
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
                            <Settings className="w-8 h-8 text-slate-400" />
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
    SENSOR: { icon: Settings, label: 'Sensor' },
    ACTUATOR: { icon: Settings, label: 'Actuator' },
    GATEWAY: { icon: Settings, label: 'Gateway' },
    CONTROLLER: { icon: Settings, label: 'Controller' }
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

  // Edit functions
  const handleEditClick = () => {
    setEditedDevice({
      name: device.name,
      location: device.location,
      manufacturer: device.manufacturer || '',
      model: device.model || '',
      description: device.description || '',
      ipAddress: device.ipAddress || '',
      port: device.port || '',
      mqttBroker: device.mqttBroker || '',
      mqttTopic: device.mqttTopic || '',
      mqttUsername: device.mqttUsername || '',
      mqttPassword: device.mqttPassword || '',
      httpEndpoint: device.httpEndpoint || '',
      httpMethod: device.httpMethod || 'GET',
      httpHeaders: device.httpHeaders || '',
      coapHost: device.coapHost || '',
      coapPort: device.coapPort || '',
      coapPath: device.coapPath || ''
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedDevice(null);
  };

  const handleSaveEdit = async () => {
    if (!device || !editedDevice) return;

    setIsSaving(true);
    try {
      // Create update payload with only non-null and non-empty values
      const updatePayload: any = {};
      
      // Only include fields that have been changed and are not empty strings
      Object.keys(editedDevice).forEach(key => {
        const value = editedDevice[key];
        if (value !== null && value !== undefined && value !== '') {
          updatePayload[key] = value;
        }
      });

      // Add device ID
      updatePayload.id = device.id;

      await deviceAPI.update(device.id, updatePayload);
      
      // Update the device in the IoT context
      updateDeviceStatus(device.id, { ...device, ...editedDevice });
      
      setIsEditing(false);
      setEditedDevice(null);
      
      logInfo('DeviceDetails', 'Device updated successfully', { deviceId: device.id });
    } catch (error) {
      logError('DeviceDetails', 'Failed to update device', error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (!editedDevice) return;
    setEditedDevice((prev: any) => ({
      ...prev,
      [field]: value
    }));
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
            timestamp: new Date(),
            images: queryResponse.images || [],
            tables: queryResponse.tables || []
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
            {/* Header with Edit Button */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-800">Device Profile</h2>
              {!isEditing ? (
                <button
                  onClick={handleEditClick}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit Device
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

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
                    {lastSeen ? formatLastSeen(lastSeen) : 'Not available'}
                    {isRealTimeLoading && (
                      <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <Settings className="w-5 h-5 text-slate-500" />
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
                  <Settings className="w-5 h-5" />
                  Device Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-600">Device Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedDevice?.name || ''}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-slate-800">{device.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Location</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedDevice?.location || ''}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-slate-800">{device.location}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Manufacturer</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedDevice?.manufacturer || ''}
                        onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter manufacturer"
                      />
                    ) : (
                      <p className="text-slate-800">{device.manufacturer || 'Not specified'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Model</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedDevice?.model || ''}
                        onChange={(e) => handleInputChange('model', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter model"
                      />
                    ) : (
                      <p className="text-slate-800">{device.model || 'Not specified'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Description</label>
                    {isEditing ? (
                      <textarea
                        value={editedDevice?.description || ''}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Enter device description"
                      />
                    ) : (
                      <p className="text-slate-800">{device.description || 'Not specified'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Assigned User</label>
                    <p className="text-slate-800">{device.assignedUserId ? `User ID: ${device.assignedUserId}` : 'Not assigned'}</p>
                  </div>
                </div>
              </div>

              {/* Connection Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Connection Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-600">IP Address</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedDevice?.ipAddress || ''}
                        onChange={(e) => handleInputChange('ipAddress', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter IP address"
                      />
                    ) : (
                      <p className="text-slate-800">{device.ipAddress || 'Not specified'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Port</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedDevice?.port || ''}
                        onChange={(e) => handleInputChange('port', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter port"
                      />
                    ) : (
                      <p className="text-slate-800">{device.port || 'Not specified'}</p>
                    )}
                  </div>
                  {device.protocol === 'MQTT' && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-slate-600">MQTT Broker</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedDevice?.mqttBroker || ''}
                            onChange={(e) => handleInputChange('mqttBroker', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter MQTT broker URL"
                          />
                        ) : (
                          <p className="text-slate-800">{device.mqttBroker || 'Not specified'}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600">MQTT Topic</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedDevice?.mqttTopic || ''}
                            onChange={(e) => handleInputChange('mqttTopic', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter MQTT topic"
                          />
                        ) : (
                          <p className="text-slate-800">{device.mqttTopic || 'Not specified'}</p>
                        )}
                      </div>
                    </>
                  )}
                  {device.protocol === 'HTTP' && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-slate-600">HTTP Endpoint</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedDevice?.httpEndpoint || ''}
                            onChange={(e) => handleInputChange('httpEndpoint', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter HTTP endpoint"
                          />
                        ) : (
                          <p className="text-slate-800">{device.httpEndpoint || 'Not specified'}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600">HTTP Method</label>
                        {isEditing ? (
                          <select
                            value={editedDevice?.httpMethod || 'GET'}
                            onChange={(e) => handleInputChange('httpMethod', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                          </select>
                        ) : (
                          <p className="text-slate-800">{device.httpMethod || 'GET'}</p>
                        )}
                      </div>
                    </>
                  )}
                  {device.protocol === 'COAP' && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-slate-600">COAP Host</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedDevice?.coapHost || ''}
                            onChange={(e) => handleInputChange('coapHost', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter COAP host"
                          />
                        ) : (
                          <p className="text-slate-800">{device.coapHost || 'Not specified'}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600">COAP Port</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedDevice?.coapPort || ''}
                            onChange={(e) => handleInputChange('coapPort', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter COAP port"
                          />
                        ) : (
                          <p className="text-slate-800">{device.coapPort || 'Not specified'}</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Tags */}
            {device.tags && device.tags.length > 0 && (
              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
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
                  <span className="text-blue-800 font-medium">Updating maintenance data...</span>
                </div>
              </div>
            )}

            {/* Tab Loading State */}
            {isTabLoading && activeTab === 'maintenance' && (
              <DataLoadingState message="Loading maintenance information..." />
            )}

            {/* Use the dedicated DeviceMaintenanceDisplay component */}
            <DeviceMaintenanceDisplay deviceId={deviceId!} />
          </div>
        );

      case 'rules':
        return (
          <div className="space-y-6">
            {/* Real-time Status */}
            {isRealTimeLoading && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-blue-800 font-medium">Updating rules data...</span>
                </div>
              </div>
            )}

            {/* Use the dedicated DeviceRulesDisplay component */}
            <DeviceRulesDisplay deviceId={deviceId!} />
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

            {/* Tab Loading State */}
            {isTabLoading && activeTab === 'safety' && (
              <DataLoadingState message="Loading safety information..." />
            )}

            {/* Use the dedicated DeviceSafetyInfo component */}
            <DeviceSafetyInfo deviceId={deviceId!} />
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
                      
                      {/* Display Images */}
                      {message.images && message.images.length > 0 && (
                        <ChatImageDisplay 
                          images={message.images} 
                          className="mt-3"
                        />
                      )}
                      
                      {/* Display Tables */}
                      {message.tables && message.tables.length > 0 && (
                        <ChatTableDisplay 
                          tables={message.tables} 
                          className="mt-3"
                        />
                      )}
                      
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


    </div>
  );
};
