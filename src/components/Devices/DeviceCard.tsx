import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, FileText, CheckCircle, Clock, Brain, Settings, Trash2
} from 'lucide-react';
import { Device } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { logInfo, logError } from '../../utils/logger';

interface DeviceCardProps {
  device: Device;
  onStatusChange?: (deviceId: string, status: Device['status']) => void;
  onDelete?: (deviceId: string, deviceName: string) => Promise<void>;
  isOnboarding?: boolean;
  pdfProcessingStatus?: 'pending' | 'processing' | 'completed' | 'error';
  pdfFileName?: string;
  startTime?: number;
}

const statusConfig = {
  ONLINE: { 
    icon: CheckCircle, 
    color: 'text-success-600', 
    bg: 'bg-success-50',
    label: 'Online'
  },
  OFFLINE: { 
    icon: Clock, 
    color: 'text-neutral-600', 
    bg: 'bg-neutral-50',
    label: 'Offline'
  },
  WARNING: { 
    icon: AlertTriangle, 
    color: 'text-warning-600', 
    bg: 'bg-warning-50',
    label: 'Warning'
  },
  ERROR: { 
    icon: AlertTriangle, 
    color: 'text-error-600', 
    bg: 'bg-error-50',
    label: 'Error'
  }
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
    color: 'text-primary-600',
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
    color: 'text-success-600',
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
  pdfProcessingStatus,
  pdfFileName,
  startTime,
  onDelete
}) => {
  const { user } = useAuth();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add additional safety checks
  if (!device) {
    console.error('DeviceCard: device prop is undefined or null');
    return null;
  }
  
  const statusInfo = getStatusConfig(device.status || 'OFFLINE');
  const StatusIcon = statusInfo.icon;

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

  const canUpdateStatus = user?.role === 'ADMIN' && onStatusChange;

  // Simulate PDF processing progress
  const [progress, setProgress] = useState(0);

  // Real PDF processing progress based on status
  useEffect(() => {
    if (isOnboarding && pdfProcessingStatus === 'processing' && startTime) {
      const elapsed = Date.now() - startTime;
      const progressPercent = Math.min((elapsed / (25 * 60 * 1000)) * 100, 95); // 25 minutes max
      setProgress(progressPercent);
    } else if (isOnboarding && pdfProcessingStatus === 'completed') {
      setProgress(100);
    }
  }, [isOnboarding, pdfProcessingStatus, startTime]);

  const handleStatusChange = async (newStatus: Device['status']) => {
    if (!onStatusChange || isUpdatingStatus) return;
    
    const oldStatus = device.status;
    
    logInfo('DeviceCard', 'Initiating device status change', {
      deviceId: device.id,
      deviceName: device.name,
      oldStatus,
      newStatus,
      userRole: user?.role
    });
    
    setIsUpdatingStatus(true);
    setStatusUpdateError(null);
    
    try {
      // Optimistic update for better UX
      const statusEmoji = {
        'ONLINE': '🟢',
        'OFFLINE': '⚫',
        'WARNING': '🟡',
        'ERROR': '🔴'
      }[newStatus] || '⚪';
      
      console.log(`🔄 Updating device status: ${device.name} (${device.id}) from ${oldStatus} to ${newStatus}`);
      
      // Call the status update function
      await onStatusChange(device.id, newStatus);
      
      logInfo('DeviceCard', 'Device status updated successfully', {
        deviceId: device.id,
        deviceName: device.name,
        oldStatus,
        newStatus
      });
      
      console.log(`✅ Device status updated successfully: ${device.name} is now ${newStatus}`);
      console.log(`${statusEmoji} ${device.name} status changed to ${newStatus.toLowerCase()}`);
      
      // Show success feedback
      // You could add a toast notification here
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      logError('DeviceCard', 'Failed to update device status', error instanceof Error ? error : new Error('Unknown error'));
      console.error('❌ Failed to update device status:', error);
      console.error(`Failed to update ${device.name} status to ${newStatus}`);
      
      setStatusUpdateError(errorMessage);
      
      // Show error feedback
      // You could add a toast notification here
      
      throw error;
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleTestStatusChange = async () => {
    const newStatus = device.status === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    await handleStatusChange(newStatus);
  };

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
          <div className="bg-primary-50 rounded-xl p-4 border border-primary-200">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="w-5 h-5 text-primary-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary-900 truncate">
                  {pdfFileName || 'Device Documentation'}
                </p>
                <p className="text-xs text-primary-700">
                  {pdfProcessingStages[0]?.description || 'Processing...'} {/* Assuming the first stage is always active */}
                </p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-primary-200 rounded-full h-2 mb-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(50, 100)}%` }} // Simulate 50% progress for now
              />
            </div>
            <p className="text-xs text-primary-700 text-right">
              {Math.round(50)}%
            </p>
          </div>

          {/* Processing Stages */}
          <div className="space-y-2">
            {pdfProcessingStages.map((stage, index) => {
              const isCompleted = index < 1; // Only one stage for now
              const isCurrent = index === 0; // Only one stage for now
              const isPending = index > 0; // No pending stages for now

              return (
                <div key={stage.id} className="flex items-center gap-3">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    isCompleted ? 'bg-success-100' : isCurrent ? 'bg-primary-100' : 'bg-neutral-100'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4 text-success-600" />
                    ) : isCurrent ? (
                      <Clock className="w-4 h-4 text-primary-600 animate-spin" />
                    ) : (
                      <div className={`w-4 h-4 ${stage.color.replace('text-', 'bg-')} rounded-full opacity-30`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${
                      isCompleted ? 'text-success-700' : isCurrent ? 'text-primary-700' : 'text-neutral-500'
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
          <div className="bg-success-50 rounded-xl p-4 border border-success-200">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-success-600" />
              <div>
                <p className="text-sm font-medium text-success-900">PDF Processing Complete</p>
                <p className="text-xs text-success-700">Device is ready for monitoring</p>
              </div>
            </div>
          </div>

          {/* PDF Results Summary */}
          {/* pdfResults state was removed, so this section is removed */}
        </div>
      );
    }

    if (pdfProcessingStatus === 'error') {
      return (
        <div className="bg-error-50 rounded-xl p-4 border border-error-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-error-600" />
            <div>
              <p className="text-sm font-medium text-error-900">PDF Processing Failed</p>
              <p className="text-xs text-error-700">Please try uploading the document again</p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 hover:shadow-md hover:border-primary-300 transition-all cursor-pointer group overflow-hidden">
      {/* Card Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {/* Device Icon */}
            <div className="p-3 rounded-lg flex-shrink-0">
              <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
            </div>

            {/* Device Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-neutral-800 text-lg truncate">{device.name}</h3>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusInfo.bg} ${statusInfo.color} flex-shrink-0`}>
                  {device.status}
                </span>
              </div>
              <p className="text-sm text-neutral-600 mb-1 truncate">{device.location}</p>
              <p className="text-xs text-neutral-500">Updated: {formatLastSeen(device.updatedAt)}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Real-time indicator */}
            <div className={`w-2 h-2 rounded-full ${
              device.status === 'ONLINE' ? 'bg-success-500 animate-pulse' :
              device.status === 'WARNING' ? 'bg-warning-500 animate-pulse' :
              device.status === 'ERROR' ? 'bg-error-500 animate-pulse' :
              'bg-neutral-400'
            }`} />
            
            {/* Delete Button */}
            {onDelete && !isOnboarding && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(device.id, device.name);
                }}
                className="p-2 text-neutral-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Delete Device"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      {/* Status Update Error */}
      {statusUpdateError && (
        <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-error-600" />
            <p className="text-sm text-error-700">{statusUpdateError}</p>
          </div>
        </div>
      )}

      {/* Onboarding Content */}
      {isOnboarding && (
        <div className="mb-4">
          {renderOnboardingContent()}
        </div>
      )}

        {/* Tags */}
        {device.tags && device.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {device.tags.map((tag) => (
              <span key={tag} className="text-xs px-3 py-1 bg-neutral-100 text-neutral-600 rounded-full font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Quick Status Change - Only for users with permission */}
        {canUpdateStatus && !isOnboarding && (
          <div className="pt-4 border-t border-neutral-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-600 font-medium">Quick Status:</span>
              <select
                value={device.status}
                onChange={async (e) => {
                  const newStatus = e.target.value as Device['status'];
                  await handleStatusChange(newStatus);
                }}
                disabled={isUpdatingStatus}
                className={`text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-neutral-900 transition-all ${
                  isUpdatingStatus 
                    ? 'border-neutral-300 text-neutral-400 cursor-not-allowed' 
                    : 'border-neutral-300 hover:border-primary-400'
                }`}
              >
                <option value="ONLINE">🟢 Online</option>
                <option value="OFFLINE">⚫ Offline</option>
                <option value="WARNING">🟡 Warning</option>
                <option value="ERROR">🔴 Error</option>
              </select>
              {isUpdatingStatus && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-neutral-500">Updating...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};