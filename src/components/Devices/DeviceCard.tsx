import React from 'react';
import { 
  Cpu, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  XCircle, 
  Battery, 
  Thermometer,
  Droplets
} from 'lucide-react';
import { Device } from '../../types';

interface DeviceCardProps {
  device: Device;
  onStatusChange: (deviceId: string, status: Device['status']) => void;
}

const statusConfig = {
  online: { 
    color: 'text-green-600 dark:text-green-400', 
    bg: 'bg-green-50 dark:bg-green-900/20',
    icon: Wifi
  },
  offline: { 
    color: 'text-gray-600 dark:text-gray-400', 
    bg: 'bg-gray-50 dark:bg-gray-700/50',
    icon: WifiOff
  },
  warning: { 
    color: 'text-yellow-600 dark:text-yellow-400', 
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    icon: AlertTriangle
  },
  error: { 
    color: 'text-red-600 dark:text-red-400', 
    bg: 'bg-red-50 dark:bg-red-900/20',
    icon: XCircle
  }
};

const deviceTypeConfig = {
  sensor: { icon: Thermometer, label: 'Sensor' },
  actuator: { icon: Cpu, label: 'Actuator' },
  gateway: { icon: Wifi, label: 'Gateway' },
  controller: { icon: Cpu, label: 'Controller' }
};

export const DeviceCard: React.FC<DeviceCardProps> = ({ device, onStatusChange }) => {
  const statusInfo = statusConfig[device.status];
  const deviceTypeInfo = deviceTypeConfig[device.type];
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
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`${statusInfo.bg} p-2 rounded-lg`}>
            <TypeIcon className={`w-5 h-5 ${statusInfo.color}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{device.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{deviceTypeInfo.label}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
            {device.status}
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Location</span>
          <span className="text-gray-900 dark:text-white">{device.location}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Protocol</span>
          <span className="text-gray-900 dark:text-white">{device.protocol}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Last seen</span>
          <span className="text-gray-900 dark:text-white">{formatLastSeen(device.lastSeen)}</span>
        </div>
      </div>

      {/* Telemetry Data */}
      {device.status === 'online' && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          {device.batteryLevel && (
            <div className="flex items-center gap-2">
              <Battery className="w-4 h-4 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Battery</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{device.batteryLevel}%</p>
              </div>
            </div>
          )}
          
          {device.temperature && (
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Temperature</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{device.temperature}°C</p>
              </div>
            </div>
          )}
          
          {device.humidity && (
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Humidity</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{device.humidity}%</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-4">
        {device.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <select
          value={device.status}
          onChange={(e) => onStatusChange(device.id, e.target.value as Device['status'])}
          className="flex-1 text-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
        </select>
      </div>
    </div>
  );
};