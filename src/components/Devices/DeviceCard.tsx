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
    color: 'text-green-600', 
    bg: 'bg-green-50',
    icon: Wifi
  },
  offline: { 
    color: 'text-slate-600', 
    bg: 'bg-slate-50',
    icon: WifiOff
  },
  warning: { 
    color: 'text-yellow-600', 
    bg: 'bg-yellow-50',
    icon: AlertTriangle
  },
  error: { 
    color: 'text-red-600', 
    bg: 'bg-red-50',
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
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`${statusInfo.bg} p-3 rounded-xl shadow-sm`}>
            <TypeIcon className={`w-6 h-6 ${statusInfo.color}`} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-lg">{device.name}</h3>
            <p className="text-sm text-slate-600">{deviceTypeInfo.label}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
            {device.status}
          </span>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Location</span>
          <span className="text-slate-800 font-medium">{device.location}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Protocol</span>
          <span className="text-slate-800 font-medium">{device.protocol}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Last seen</span>
          <span className="text-slate-800 font-medium">{formatLastSeen(device.lastSeen)}</span>
        </div>
      </div>

      {/* Telemetry Data */}
      {device.status === 'online' && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          {device.batteryLevel && (
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
              <Battery className="w-4 h-4 text-slate-500" />
              <div className="flex-1">
                <p className="text-xs text-slate-500">Battery</p>
                <p className="text-sm font-medium text-slate-800">{device.batteryLevel}%</p>
              </div>
            </div>
          )}
          
          {device.temperature && (
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
              <Thermometer className="w-4 h-4 text-slate-500" />
              <div className="flex-1">
                <p className="text-xs text-slate-500">Temperature</p>
                <p className="text-sm font-medium text-slate-800">{device.temperature}°C</p>
              </div>
            </div>
          )}
          
          {device.humidity && (
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
              <Droplets className="w-4 h-4 text-slate-500" />
              <div className="flex-1">
                <p className="text-xs text-slate-500">Humidity</p>
                <p className="text-sm font-medium text-slate-800">{device.humidity}%</p>
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
            className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full font-medium"
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
          className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 text-slate-900 transition-all"
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