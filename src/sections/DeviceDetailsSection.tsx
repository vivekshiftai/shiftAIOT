import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Zap, FileText, Info, Wifi, Cpu, Thermometer, Droplets, Battery, Clock, Tag, MapPin, WifiOff } from 'lucide-react';
import { useIoT } from '../contexts/IoTContext';
import { useAuth } from '../contexts/AuthContext';
import { Device } from '../types';
import { DeviceRules } from '../components/Devices/DeviceRules';
import { DeviceConnectionManager } from '../components/Devices/DeviceConnectionManager';

export const DeviceDetailsSection: React.FC = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const { devices, updateDeviceStatus } = useIoT();
  const { hasPermission } = useAuth();
  const [showRules, setShowRules] = useState(false);
  const [showConnections, setShowConnections] = useState(false);

  const device = devices.find(d => d.id === deviceId);

  useEffect(() => {
    if (!device && devices.length > 0) {
      // If device not found, redirect to devices list
      navigate('/devices');
    }
  }, [device, devices, navigate]);

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
    ONLINE: { icon: Wifi, color: 'text-green-600', bg: 'bg-green-50', label: 'Online' },
    OFFLINE: { icon: WifiOff, color: 'text-slate-600', bg: 'bg-slate-50', label: 'Offline' },
    WARNING: { icon: Thermometer, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Warning' },
    ERROR: { icon: Cpu, color: 'text-red-600', bg: 'bg-red-50', label: 'Error' }
  };

  const deviceTypeConfig = {
    SENSOR: { icon: Thermometer, label: 'Sensor' },
    ACTUATOR: { icon: Cpu, label: 'Actuator' },
    GATEWAY: { icon: Wifi, label: 'Gateway' },
    CONTROLLER: { icon: Cpu, label: 'Controller' }
  };

  // Helper functions for case-insensitive matching
  const getDeviceTypeConfig = (deviceType: string) => {
    if (!deviceType) return deviceTypeConfig.SENSOR;
    const upperType = deviceType.toUpperCase();
    return deviceTypeConfig[upperType as keyof typeof deviceTypeConfig] || deviceTypeConfig.SENSOR;
  };

  const getStatusConfig = (status: string) => {
    if (!status) return statusConfig.OFFLINE;
    const upperStatus = status.toUpperCase();
    return statusConfig[upperStatus as keyof typeof statusConfig] || statusConfig.OFFLINE;
  };

  const statusInfo = getStatusConfig(device.status);
  const deviceTypeInfo = getDeviceTypeConfig(device.type);
  const StatusIcon = statusInfo.icon;
  const TypeIcon = deviceTypeInfo.icon;

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
              <TypeIcon className={`w-6 h-6 ${statusInfo.color}`} />
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

      {/* Status and Basic Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5" />
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Status</label>
                <div className="flex items-center gap-2">
                  <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                  <span className="font-medium text-slate-800">{statusInfo.label}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Type</label>
                <div className="flex items-center gap-2">
                  <TypeIcon className="w-4 h-4 text-slate-600" />
                  <span className="font-medium text-slate-800">{deviceTypeInfo.label}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Location</label>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-600" />
                  <span className="font-medium text-slate-800">{device.location}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Last Seen</label>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-600" />
                  <span className="font-medium text-slate-800">{formatLastSeen(device.lastSeen)}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Protocol</label>
                <span className="font-medium text-slate-800">{device.protocol}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Firmware</label>
                <span className="font-medium text-slate-800">{device.firmware || 'Not specified'}</span>
              </div>
            </div>
          </div>

          {/* Telemetry Data */}
          {(device.batteryLevel || device.temperature || device.humidity) && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
              <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Thermometer className="w-5 h-5" />
                Telemetry Data
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {device.batteryLevel && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Battery className="w-5 h-5 text-slate-600" />
                    <div>
                      <p className="text-sm text-slate-600">Battery Level</p>
                      <p className="font-semibold text-slate-800">{device.batteryLevel}%</p>
                    </div>
                  </div>
                )}
                {device.temperature && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Thermometer className="w-5 h-5 text-slate-600" />
                    <div>
                      <p className="text-sm text-slate-600">Temperature</p>
                      <p className="font-semibold text-slate-800">{device.temperature}°C</p>
                    </div>
                  </div>
                )}
                {device.humidity && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Droplets className="w-5 h-5 text-slate-600" />
                    <div>
                      <p className="text-sm text-slate-600">Humidity</p>
                      <p className="font-semibold text-slate-800">{device.humidity}%</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Device Specifications */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Device Specifications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Manufacturer</label>
                <span className="font-medium text-slate-800">{device.manufacturer || 'Not specified'}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Model</label>
                <span className="font-medium text-slate-800">{device.model || 'Not specified'}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Serial Number</label>
                <span className="font-medium text-slate-800">{device.serialNumber || 'Not specified'}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">MAC Address</label>
                <span className="font-medium text-slate-800">{device.macAddress || 'Not specified'}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">IP Address</label>
                <span className="font-medium text-slate-800">{device.ipAddress || 'Not specified'}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Port</label>
                <span className="font-medium text-slate-800">{device.port || 'Not specified'}</span>
              </div>
            </div>
          </div>

          {/* Connectivity Information */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Wifi className="w-5 h-5" />
              Connectivity
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">WiFi SSID</label>
                <span className="font-medium text-slate-800">{device.wifiSsid || 'Not specified'}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">MQTT Broker</label>
                <span className="font-medium text-slate-800">{device.mqttBroker || 'Not specified'}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">MQTT Topic</label>
                <span className="font-medium text-slate-800">{device.mqttTopic || 'Not specified'}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Power Source</label>
                <span className="font-medium text-slate-800">{device.powerSource || 'Not specified'}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Power Consumption</label>
                <span className="font-medium text-slate-800">{device.powerConsumption ? `${device.powerConsumption}W` : 'Not specified'}</span>
              </div>
            </div>
          </div>

          {/* Environmental Specifications */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Thermometer className="w-5 h-5" />
              Environmental Specifications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Operating Temperature</label>
                <span className="font-medium text-slate-800">
                  {device.operatingTemperatureMin && device.operatingTemperatureMax 
                    ? `${device.operatingTemperatureMin}°C to ${device.operatingTemperatureMax}°C`
                    : 'Not specified'
                  }
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Operating Humidity</label>
                <span className="font-medium text-slate-800">
                  {device.operatingHumidityMin && device.operatingHumidityMax 
                    ? `${device.operatingHumidityMin}% to ${device.operatingHumidityMax}%`
                    : 'Not specified'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Additional Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Description</label>
                <p className="text-slate-800">{device.description || 'No description available'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Installation Notes</label>
                <p className="text-slate-800">{device.installationNotes || 'No installation notes available'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Maintenance Schedule</label>
                <p className="text-slate-800">{device.maintenanceSchedule || 'No maintenance schedule specified'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Warranty Information</label>
                <p className="text-slate-800">{device.warrantyInfo || 'No warranty information available'}</p>
              </div>
            </div>
          </div>

          {/* Tags */}
          {device.tags && device.tags.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
              <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {device.tags.map((tag, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {hasPermission('DEVICE_WRITE') && (
                <button
                  onClick={() => updateDeviceStatus(device.id, device.status === 'ONLINE' ? 'OFFLINE' : 'ONLINE')}
                  className="w-full flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all"
                >
                  <StatusIcon className="w-4 h-4" />
                  Toggle Status
                </button>
              )}
              {hasPermission('DEVICE_WRITE') && (
                <button
                  onClick={() => setShowConnections(true)}
                  className="w-full flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all"
                >
                  <Wifi className="w-4 h-4" />
                  Manage Connections
                </button>
              )}
              {hasPermission('RULE_READ') && (
                <button
                  onClick={() => setShowRules(true)}
                  className="w-full flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all"
                >
                  <Zap className="w-4 h-4" />
                  Manage Rules
                </button>
              )}
            </div>
          </div>

          {/* Device Stats */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Device Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Status</span>
                <span className={`font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Type</span>
                <span className="font-medium text-slate-800">{deviceTypeInfo.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Protocol</span>
                <span className="font-medium text-slate-800">{device.protocol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Last Seen</span>
                <span className="font-medium text-slate-800">{formatLastSeen(device.lastSeen)}</span>
              </div>
            </div>
          </div>
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
