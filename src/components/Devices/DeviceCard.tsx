import React from 'react';
import {
  Cpu, Wifi, WifiOff, AlertTriangle, XCircle, ChevronRight, Thermometer
} from 'lucide-react';
import { Device } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface DeviceCardProps {
  device: Device;
  onStatusChange?: (deviceId: string, status: Device['status']) => void;
}

const statusConfig = {
  ONLINE: { 
    icon: Wifi, 
    color: 'text-green-600', 
    bg: 'bg-green-50',
    label: 'Online'
  },
  OFFLINE: { 
    icon: WifiOff, 
    color: 'text-slate-600', 
    bg: 'bg-slate-50',
    label: 'Offline'
  },
  WARNING: { 
    icon: AlertTriangle, 
    color: 'text-yellow-600', 
    bg: 'bg-yellow-50',
    label: 'Warning'
  },
  ERROR: { 
    icon: XCircle, 
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

// Helper function to get device type config with case-insensitive matching
const getDeviceTypeConfig = (deviceType: string) => {
  if (!deviceType) return deviceTypeConfig.SENSOR;
  const upperType = deviceType.toUpperCase();
  return deviceTypeConfig[upperType as keyof typeof deviceTypeConfig] || deviceTypeConfig.SENSOR;
};

// Helper function to get status config with case-insensitive matching
const getStatusConfig = (status: string) => {
  if (!status) return statusConfig.OFFLINE;
  const upperStatus = status.toUpperCase();
  return statusConfig[upperStatus as keyof typeof statusConfig] || statusConfig.OFFLINE;
};

export const DeviceCard: React.FC<DeviceCardProps> = ({ device, onStatusChange }) => {
  const { hasPermission } = useAuth();
  
  // Add additional safety checks
  if (!device) {
    console.error('DeviceCard: device prop is undefined or null');
    return null;
  }
  
  const statusInfo = getStatusConfig(device.status || 'OFFLINE');
  const deviceTypeInfo = getDeviceTypeConfig(device.type || 'SENSOR');
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

  const canUpdateStatus = hasPermission('DEVICE_WRITE') && onStatusChange;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className={`${statusInfo.bg} p-3 rounded-xl shadow-sm`}>
            <TypeIcon className={`w-6 h-6 ${statusInfo.color}`} />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-slate-800 text-lg">{device.name}</h3>
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                {device.status}
              </span>
            </div>
            <p className="text-sm text-slate-600 mb-1">{deviceTypeInfo.label} • {device.location}</p>
            <p className="text-xs text-slate-500">Last seen: {formatLastSeen(device.lastSeen)}</p>
          </div>
        </div>



        {/* Status Icon and Chevron */}
        <div className="flex items-center gap-3">
          <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
        </div>
      </div>

      {/* Tags */}
      {device.tags && device.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-4">
          {device.tags.map((tag) => (
            <span key={tag} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full font-medium">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Quick Status Change - Only for users with permission */}
      {canUpdateStatus && (
        <div className="mt-4 pt-4 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600">Quick Status:</span>
            <select
              value={device.status}
              onChange={(e) => onStatusChange(device.id, e.target.value as Device['status'])}
              className="text-xs px-3 py-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 text-slate-900 transition-all"
            >
                             <option value="ONLINE">Online</option>
               <option value="OFFLINE">Offline</option>
               <option value="WARNING">Warning</option>
               <option value="ERROR">Error</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};