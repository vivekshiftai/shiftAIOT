import React, { useState, useEffect } from 'react';
import { 
  Download, 
  FileText, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Info,
  Clock,
  MessageSquare,
  AlertTriangle,
  BarChart3,
  Wifi,
  Database,
  Activity,
  Tag,
  Zap,
  Wrench
} from 'lucide-react';
import { Device } from '../../types';
import { deviceAPI, ruleAPI, maintenanceAPI, deviceSafetyPrecautionsAPI } from '../../services/api';
import { DeviceRulesManager } from './DeviceRulesManager';
import DeviceRulesDisplay from './DeviceRulesDisplay';
import DeviceAnalyticsDisplay from './DeviceAnalyticsDisplay';
import DeviceLogsDisplay from './DeviceLogsDisplay';
import DeviceMaintenanceDisplay from './DeviceMaintenanceDisplay';
import DeviceSafetyInfo from './DeviceSafetyInfo';
import { DeviceStatsService } from '../../services/deviceStatsService';
import { logError, logInfo } from '../../utils/logger';

interface DeviceDetailsProps {
  device: Device;
  onClose: () => void;
  onStatusChange: (deviceId: string, status: Device['status']) => void;
}

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
  SENSOR: { icon: 'Thermometer', label: 'Sensor' },
  ACTUATOR: { icon: 'Cpu', label: 'Actuator' },
  GATEWAY: { icon: 'Wifi', label: 'Gateway' },
  CONTROLLER: { icon: 'Cpu', label: 'Controller' }
};

const tabs = [
  { id: 'profile', label: 'Profile & Specifications', icon: Info },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'rules', label: 'Rules', icon: Zap },
  { id: 'logs', label: 'Logs', icon: FileText },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench },
  { id: 'safety', label: 'Safety', icon: AlertTriangle },
  { id: 'chat', label: 'Chat History', icon: MessageSquare }
];

export const DeviceDetails: React.FC<DeviceDetailsProps> = ({ device, onClose, onStatusChange }) => {
  const [documentationInfo, setDocumentationInfo] = useState<DocumentationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [isTabLoading, setIsTabLoading] = useState(false);
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

  const statusInfo = statusConfig[device.status];
  const deviceTypeInfo = deviceTypeConfig[device.type];

  const handleTabChange = (tabId: string) => {
    setIsTabLoading(true);
    setActiveTab(tabId);
    // Simulate loading for better UX
    setTimeout(() => setIsTabLoading(false), 100);
  };

  useEffect(() => {
    fetchDocumentationInfo();
  }, [device.id]);

  const fetchDocumentationInfo = async () => {
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
    if (!documentationInfo?.files[type].available) return;

    try {
      setDownloading(type);
      const response = await deviceAPI.downloadDocumentation(device.id, type);
      
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${device.name}_${type}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      logError('DeviceDetails', `Failed to download ${type}`, error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setDownloading(null);
    }
  };

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
    if (!newMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: newMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `I understand you're asking about "${userMessage.content}". Based on the device information, I can help you with that. What specific aspect would you like me to elaborate on?`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const debugDataRetrieval = async () => {
    try {
      logInfo('DeviceDetails', '=== DEBUGGING DATA RETRIEVAL ===');
      logInfo('DeviceDetails', `Device ID: ${device.id}`);
      
      // Test authentication first
      logInfo('DeviceDetails', '🔐 Testing authentication...');
      try {
        const authResponse = await deviceAPI.testAuth();
        logInfo('DeviceDetails', '✅ Auth test successful', authResponse.data);
      } catch (authError) {
        logError('DeviceDetails', '❌ Auth test failed', authError instanceof Error ? authError : new Error('Unknown error'));
        return; // Stop if auth fails
      }
      
      // Test rules retrieval
      logInfo('DeviceDetails', '📋 Testing rules retrieval...');
      try {
        const rulesResponse = await ruleAPI.getByDevice(device.id);
        logInfo('DeviceDetails', '✅ Rules response', rulesResponse.data);
      } catch (error) {
        logError('DeviceDetails', '❌ Rules retrieval failed', error instanceof Error ? error : new Error('Unknown error'));
      }
      
      // Test maintenance retrieval
      logInfo('DeviceDetails', '🔧 Testing maintenance retrieval...');
      try {
        const maintenanceResponse = await maintenanceAPI.getByDevice(device.id);
        logInfo('DeviceDetails', '✅ Maintenance response', maintenanceResponse.data);
      } catch (error) {
        logError('DeviceDetails', '❌ Maintenance retrieval failed', error instanceof Error ? error : new Error('Unknown error'));
      }
      
      // Test safety precautions retrieval
      logInfo('DeviceDetails', '⚠️ Testing safety precautions retrieval...');
      try {
        const safetyResponse = await deviceSafetyPrecautionsAPI.getByDevice(device.id);
        logInfo('DeviceDetails', '✅ Safety response', safetyResponse.data);
      } catch (error) {
        logError('DeviceDetails', '❌ Safety precautions retrieval failed', error instanceof Error ? error : new Error('Unknown error'));
      }
      
      // Test debug endpoint
      logInfo('DeviceDetails', '🔍 Testing debug endpoint...');
      try {
        const debugResponse = await deviceAPI.getDebugData(device.id);
        logInfo('DeviceDetails', '✅ Debug response', debugResponse.data);
      } catch (error) {
        logError('DeviceDetails', '❌ Debug endpoint failed', error instanceof Error ? error : new Error('Unknown error'));
      }
      
      logInfo('DeviceDetails', '=== DEBUG COMPLETE ===');
    } catch (error) {
      logError('DeviceDetails', 'Debug error', error instanceof Error ? error : new Error('Unknown error'));
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
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
                  <p className="font-semibold text-slate-800">{formatLastSeen(device.lastSeen)}</p>
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

            {/* Device Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Database className="w-5 h-5" />
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
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
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
                        onClick={() => isAvailable && downloadDocumentation(type as any)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            isAvailable ? 'bg-green-100' : 'bg-slate-200'
                          }`}>
                            {type === 'manual' && <FileText className="w-4 h-4 text-green-600" />}
                            {type === 'datasheet' && <Settings className="w-4 h-4 text-green-600" />}
                            {type === 'certificate' && <CheckCircle className="w-4 h-4 text-green-600" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-800 capitalize">{type}</p>
                            {isAvailable ? (
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-slate-600">
                                  {fileInfo.size ? formatFileSize(fileInfo.size) : 'Available'}
                                </p>
                                {isDownloading ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b border-green-600"></div>
                                ) : (
                                  <Download className="w-3 h-3 text-green-600" />
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500">Not available</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Connection Details */}
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Wifi className="w-5 h-5" />
                Connection Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-slate-700">Network Configuration</h4>
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

                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-slate-700">MQTT Configuration</h4>
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
            </div>
          </div>
        );

      case 'maintenance':
        return <DeviceMaintenanceDisplay deviceId={device.id} />;

      case 'safety':
        return <DeviceSafetyInfo deviceId={device.id} />;

      case 'analytics':
        return <DeviceAnalyticsDisplay deviceId={device.id} />;

      case 'rules':
        return <DeviceRulesDisplay deviceId={device.id} />;

      case 'logs':
        return <DeviceLogsDisplay deviceId={device.id} />;



      case 'chat':
        return (
          <div className="flex flex-col h-96">
            <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-slate-50 rounded-lg">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-slate-800 border border-slate-200'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.type === 'user' ? 'text-blue-100' : 'text-slate-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white text-slate-800 border border-slate-200 px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask about this device..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        );



      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`${statusInfo.bg} p-3 rounded-xl shadow-sm`}>
                {React.createElement(deviceTypeInfo.icon, { 
                  className: `w-6 h-6 ${statusInfo.color}` 
                })}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{device.name}</h2>
                <p className="text-slate-600">{deviceTypeInfo.label} • {device.location}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <span className="text-xl font-bold text-slate-600">×</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 bg-white">
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
        <div className="flex-1 overflow-y-auto bg-white">
          <div 
            className="h-full"
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
              <div className="p-6">
                {renderTabContent()}
              </div>
            )}
          </div>
        </div>

                 {/* Footer Actions */}
         <div className="p-6 border-t border-slate-200 bg-slate-50">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-4">
               <label className="text-sm font-medium text-slate-700">Status:</label>
               <select
                 value={device.status}
                 onChange={(e) => onStatusChange(device.id, e.target.value as Device['status'])}
                 className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
               >
                 <option value="ONLINE">Online</option>
                 <option value="OFFLINE">Offline</option>
                 <option value="WARNING">Warning</option>
                 <option value="ERROR">Error</option>
               </select>
               
               <button
                 onClick={debugDataRetrieval}
                 className="px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
               >
                 Debug Data
               </button>
             </div>
             
             <button
               onClick={onClose}
               className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
             >
               Close
             </button>
           </div>
         </div>
      </div>

      {/* Device Rules Modal */}
      {showRules && (
        <DeviceRulesManager
          deviceId={device.id}
          deviceName={device.name}
          onClose={() => setShowRules(false)}
        />
      )}
    </div>
  );
};
