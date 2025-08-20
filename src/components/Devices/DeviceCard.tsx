import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, FileText, CheckCircle, Clock, Brain, Settings, Trash2
} from 'lucide-react';
import { Device } from '../../types';
import { useAuth } from '../../contexts/AuthContext';


interface DeviceCardProps {
  device: Device;
  onStatusChange?: (deviceId: string, status: Device['status']) => void;
  isOnboarding?: boolean;
  pdfProcessingStatus?: 'pending' | 'processing' | 'completed' | 'error';
  pdfFileName?: string;
  startTime?: number;
}

const statusConfig = {
  ONLINE: { 
    icon: CheckCircle, 
    color: 'text-green-600', 
    bg: 'bg-green-50',
    label: 'Online'
  },
  OFFLINE: { 
    icon: Clock, 
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
    icon: AlertTriangle, 
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

interface PDFProcessingStage {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const pdfProcessingStages: PDFProcessingStage[] = [
  {
    id: 'uploading',
    title: 'Uploading PDF',
    icon: <FileText className="w-4 h-4" />,
    color: 'text-blue-600',
    description: 'Uploading device documentation'
  },
  {
    id: 'analyzing',
    title: 'AI Analysis',
    icon: <Brain className="w-4 h-4" />,
    color: 'text-purple-600',
    description: 'Analyzing device specifications'
  },
  {
    id: 'extracting',
    title: 'Extracting Data',
    icon: <Settings className="w-4 h-4" />,
    color: 'text-indigo-600',
    description: 'Extracting key parameters'
  },
  {
    id: 'generating_rules',
    title: 'Generating Rules',
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'text-green-600',
    description: 'Creating monitoring rules'
  },
  {
    id: 'maintenance',
    title: 'Maintenance Planning',
    icon: <Settings className="w-4 h-4" />,
    color: 'text-orange-600',
    description: 'Planning maintenance schedule'
  }
];

export const DeviceCard: React.FC<DeviceCardProps> = ({ 
  device, 
  onStatusChange, 
  isOnboarding = false,
  pdfProcessingStatus = 'pending',
  pdfFileName,
  startTime 
}) => {
  const { hasPermission } = useAuth();
  const [currentProcessingStage, setCurrentProcessingStage] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [pdfResults, setPdfResults] = useState<any>({
    rulesGenerated: 5,
    maintenanceItems: 3,
    safetyPrecautions: 2
  });
  
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

  // Simulate PDF processing progress
  useEffect(() => {
    if (isOnboarding && pdfProcessingStatus === 'processing') {
      // Don't simulate progress - let the actual process determine completion
      // The progress will be controlled by the backend processing
    }
  }, [isOnboarding, pdfProcessingStatus]);

  // Real PDF processing progress based on status
  useEffect(() => {
    if (isOnboarding && pdfProcessingStatus === 'processing' && startTime) {
      // Calculate progress based on time elapsed
      const elapsed = Date.now() - startTime;
      const progressPercent = Math.min((elapsed / (25 * 60 * 1000)) * 100, 95); // 25 minutes max
      setProcessingProgress(progressPercent);
      
      // Update current stage based on progress
      const stageProgress = (progressPercent / 100) * pdfProcessingStages.length;
      setCurrentProcessingStage(Math.min(Math.floor(stageProgress), pdfProcessingStages.length - 1));
    } else if (isOnboarding && pdfProcessingStatus === 'completed') {
      setProcessingProgress(100);
      setCurrentProcessingStage(pdfProcessingStages.length - 1);
    }
  }, [isOnboarding, pdfProcessingStatus, startTime]);



  const renderOnboardingContent = () => {
    if (pdfProcessingStatus === 'pending') {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Clock className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="text-sm text-slate-600">Waiting to start PDF processing...</p>
          </div>
        </div>
      );
    }

    if (pdfProcessingStatus === 'processing') {
      return (
        <div className="space-y-4">
          {/* PDF Processing Progress */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-900 truncate">
                  {pdfFileName || 'Device Documentation'}
                </p>
                <p className="text-xs text-blue-700">
                  {pdfProcessingStages[currentProcessingStage]?.description || 'Processing...'}
                </p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(processingProgress, 100)}%` }}
              />
            </div>
            <p className="text-xs text-blue-700 text-right">
              {Math.round(processingProgress)}%
            </p>
          </div>

          {/* Processing Stages */}
          <div className="space-y-2">
            {pdfProcessingStages.map((stage, index) => {
              const isCompleted = index < currentProcessingStage;
              const isCurrent = index === currentProcessingStage;
              const isPending = index > currentProcessingStage;

              return (
                <div key={stage.id} className="flex items-center gap-3">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    isCompleted ? 'bg-green-100' : isCurrent ? 'bg-blue-100' : 'bg-slate-100'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : isCurrent ? (
                      <Clock className="w-4 h-4 text-blue-600 animate-spin" />
                    ) : (
                      <div className={`w-4 h-4 ${stage.color.replace('text-', 'bg-')} rounded-full opacity-30`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${
                      isCompleted ? 'text-green-700' : isCurrent ? 'text-blue-700' : 'text-slate-500'
                    }`}>
                      {stage.title}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (pdfProcessingStatus === 'completed') {
      return (
        <div className="space-y-4">
          {/* Success Message */}
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">PDF Processing Complete</p>
                <p className="text-xs text-green-700">Device is ready for monitoring</p>
              </div>
            </div>
          </div>

          {/* PDF Results Summary */}
          {pdfResults && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-blue-900">
                  {pdfResults.rulesGenerated || 0}
                </p>
                <p className="text-xs text-blue-700">Rules Created</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-orange-900">
                  {pdfResults.maintenanceItems || 0}
                </p>
                <p className="text-xs text-orange-700">Maintenance Tasks</p>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (pdfProcessingStatus === 'error') {
      return (
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-900">PDF Processing Failed</p>
              <p className="text-xs text-red-700">Please try uploading the document again</p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer group min-h-0 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={`${statusInfo.bg} p-3 rounded-xl shadow-sm flex-shrink-0`}>
            <TypeIcon className={`w-6 h-6 ${statusInfo.color}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-slate-800 text-lg truncate">{device.name}</h3>
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusInfo.bg} ${statusInfo.color} flex-shrink-0`}>
                {device.status}
              </span>
            </div>
            <p className="text-sm text-slate-600 mb-1 truncate">{deviceTypeInfo.label} • {device.location}</p>
            <p className="text-xs text-slate-500">Last seen: {formatLastSeen(device.lastSeen)}</p>
          </div>
        </div>

        {/* Status Icon and Chevron */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
          {/* Removed chevron icon - not available in type definitions */}
        </div>
      </div>

      {/* Onboarding Content */}
      {isOnboarding && (
        <div className="mb-4">
          {renderOnboardingContent()}
        </div>
      )}

      {/* Tags */}
      {device.tags && device.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {device.tags.map((tag) => (
            <span key={tag} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full font-medium">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Quick Status Change - Only for users with permission */}
      {canUpdateStatus && !isOnboarding && (
        <div className="pt-4 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
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