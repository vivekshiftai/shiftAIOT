import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Thermometer,
  Droplets,
  Battery,
  Wifi,
  Cpu,
  MapPin,
  Calendar,
  Shield,
  Zap,
  Info,
  Clock,
  Tag
} from 'lucide-react';
import { Device } from '../../types';
import { deviceAPI } from '../../services/api';
import { DeviceRules } from './DeviceRules';

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

const statusConfig = {
  online: { 
    color: 'text-green-600', 
    bg: 'bg-green-50',
    label: 'Online'
  },
  offline: { 
    color: 'text-slate-600', 
    bg: 'bg-slate-50',
    label: 'Offline'
  },
  warning: { 
    color: 'text-yellow-600', 
    bg: 'bg-yellow-50',
    label: 'Warning'
  },
  error: { 
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

export const DeviceDetails: React.FC<DeviceDetailsProps> = ({ device, onClose, onStatusChange }) => {
  const [documentationInfo, setDocumentationInfo] = useState<DocumentationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);

  const statusInfo = statusConfig[device.status];
  const deviceTypeInfo = deviceTypeConfig[device.type];

  useEffect(() => {
    fetchDocumentationInfo();
  }, [device.id]);

  const fetchDocumentationInfo = async () => {
    try {
      setLoading(true);
      const response = await deviceAPI.getDocumentation(device.id);
      setDocumentationInfo(response.data);
    } catch (error) {
      console.error('Failed to fetch documentation info:', error);
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
      console.error(`Failed to download ${type}:`, error);
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
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

          {/* Telemetry Data */}
          {device.status === 'online' && (
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Thermometer className="w-5 h-5" />
                Telemetry Data
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {device.batteryLevel && (
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
                    <Battery className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-blue-600">Battery Level</p>
                      <p className="font-semibold text-blue-800">{device.batteryLevel}%</p>
                    </div>
                  </div>
                )}
                
                {device.temperature && (
                  <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl">
                    <Thermometer className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="text-sm text-orange-600">Temperature</p>
                      <p className="font-semibold text-orange-800">{device.temperature}°C</p>
                    </div>
                  </div>
                )}
                
                {device.humidity && (
                  <div className="flex items-center gap-3 p-4 bg-cyan-50 rounded-xl">
                    <Droplets className="w-5 h-5 text-cyan-500" />
                    <div>
                      <p className="text-sm text-cyan-600">Humidity</p>
                      <p className="font-semibold text-cyan-800">{device.humidity}%</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Device Specifications */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Device Specifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
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
                  <label className="text-sm font-medium text-slate-600">MAC Address</label>
                  <p className="text-slate-800">{device.macAddress || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">IP Address</label>
                  <p className="text-slate-800">{device.ipAddress || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Port</label>
                  <p className="text-slate-800">{device.port || 'Not specified'}</p>
                </div>
              </div>
              
              <div className="space-y-4">
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
                <div>
                  <label className="text-sm font-medium text-slate-600">Firmware</label>
                  <p className="text-slate-800">{device.firmware || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Connectivity */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Wifi className="w-5 h-5" />
              Connectivity
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-slate-600">WiFi SSID</label>
                <p className="text-slate-800">{device.wifiSsid || 'Not specified'}</p>
              </div>
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

          {/* Additional Information */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5" />
              Additional Information
            </h3>
            <div className="space-y-4">
              {device.description && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Description</label>
                  <p className="text-slate-800">{device.description}</p>
                </div>
              )}
              
              {device.installationNotes && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Installation Notes</label>
                  <p className="text-slate-800">{device.installationNotes}</p>
                </div>
              )}
              
              {device.maintenanceSchedule && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Maintenance Schedule</label>
                  <p className="text-slate-800">{device.maintenanceSchedule}</p>
                </div>
              )}
              
              {device.warrantyInfo && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Warranty Information</label>
                  <p className="text-slate-800">{device.warrantyInfo}</p>
                </div>
              )}
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

          {/* Actions */}
          <div className="border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-slate-700">Status:</label>
                <select
                  value={device.status}
                  onChange={(e) => onStatusChange(device.id, e.target.value as Device['status'])}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRules(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all"
                >
                  <Zap className="w-4 h-4" />
                  Rules
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Device Rules Modal */}
      {showRules && (
        <DeviceRules
          device={device}
          onClose={() => setShowRules(false)}
        />
      )}
    </div>
  );
};
