import React from 'react';
import { X, Calendar, User, Cpu, AlertTriangle, CheckCircle, Wrench, Zap, Info } from 'lucide-react';
import { Notification } from '../../types';
import { formatRelativeTime, formatLocalDateTime } from '../../utils/dateUtils';

interface NotificationDetailModalProps {
  notification: Notification | null;
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  notification,
  isOpen,
  onClose
}) => {
  if (!isOpen || !notification) return null;

  const getNotificationIcon = (category: Notification['category']) => {
    switch (category) {
      // Critical Alerts
      case 'SECURITY_ALERT':
      case 'SAFETY_ALERT':
        return <AlertTriangle className="w-6 h-6 text-red-500" />;
      
      // Performance Issues
      case 'PERFORMANCE_ALERT':
      case 'DEVICE_OFFLINE':
        return <AlertTriangle className="w-6 h-6 text-orange-500" />;
      
      // Maintenance
      case 'MAINTENANCE_SCHEDULE':
      case 'MAINTENANCE_REMINDER':
      case 'MAINTENANCE_ASSIGNMENT':
        return <Wrench className="w-6 h-6 text-yellow-500" />;
      
      // Device Status
      case 'DEVICE_ASSIGNMENT':
      case 'DEVICE_CREATION':
      case 'DEVICE_UPDATE':
      case 'DEVICE_ONLINE':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      
      // Rules
      case 'RULE_TRIGGERED':
      case 'RULE_CREATED':
        return <Zap className="w-6 h-6 text-purple-500" />;
      
      // Sensor Alerts
      case 'TEMPERATURE_ALERT':
      case 'BATTERY_LOW':
        return <AlertTriangle className="w-6 h-6 text-amber-500" />;
      
      // System Updates
      case 'SYSTEM_UPDATE':
      case 'CUSTOM':
      default:
        return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  const getCategoryColor = (category: Notification['category']) => {
    switch (category) {
      case 'SECURITY_ALERT':
      case 'SAFETY_ALERT':
        return 'bg-red-50 border-red-200';
      case 'PERFORMANCE_ALERT':
      case 'DEVICE_OFFLINE':
        return 'bg-orange-50 border-orange-200';
      case 'MAINTENANCE_SCHEDULE':
      case 'MAINTENANCE_REMINDER':
      case 'MAINTENANCE_ASSIGNMENT':
        return 'bg-yellow-50 border-yellow-200';
      case 'DEVICE_ASSIGNMENT':
      case 'DEVICE_CREATION':
      case 'DEVICE_UPDATE':
      case 'DEVICE_ONLINE':
        return 'bg-green-50 border-green-200';
      case 'RULE_TRIGGERED':
      case 'RULE_CREATED':
        return 'bg-purple-50 border-purple-200';
      case 'TEMPERATURE_ALERT':
      case 'BATTERY_LOW':
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const formatCategoryName = (category: Notification['category']) => {
    return category.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className={`p-6 border-b ${getCategoryColor(notification.category)}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {getNotificationIcon(notification.category)}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  {notification.title}
                </h2>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatLocalDateTime(notification.createdAt)}
                  </span>
                  <span className="px-2 py-1 bg-white rounded-full text-xs font-medium">
                    {formatCategoryName(notification.category)}
                  </span>
                  {!notification.read && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      Unread
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Message */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Message</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-900 whitespace-pre-wrap">
                {notification.message}
              </p>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notification.deviceId && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="w-4 h-4 text-gray-500" />
                  <h4 className="text-sm font-medium text-gray-700">Device</h4>
                </div>
                <p className="text-sm text-gray-900 font-mono">
                  {notification.deviceId}
                </p>
              </div>
            )}

            {notification.userId && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <h4 className="text-sm font-medium text-gray-700">User</h4>
                </div>
                <p className="text-sm text-gray-900 font-mono">
                  {notification.userId}
                </p>
              </div>
            )}

            {notification.organizationId && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-gray-500" />
                  <h4 className="text-sm font-medium text-gray-700">Organization</h4>
                </div>
                <p className="text-sm text-gray-900 font-mono">
                  {notification.organizationId}
                </p>
              </div>
            )}

            {notification.ruleId && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-gray-500" />
                  <h4 className="text-sm font-medium text-gray-700">Rule</h4>
                </div>
                <p className="text-sm text-gray-900 font-mono">
                  {notification.ruleId}
                </p>
              </div>
            )}
          </div>

          {/* Additional metadata */}
          {notification.metadata && Object.keys(notification.metadata).length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Additional Information</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-xs text-gray-900 whitespace-pre-wrap">
                  {JSON.stringify(notification.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Created: {new Date(notification.createdAt).toLocaleString()}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
