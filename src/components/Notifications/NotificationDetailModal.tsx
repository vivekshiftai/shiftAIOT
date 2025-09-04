import React from 'react';
import { X, Bell, AlertTriangle, Info, CheckCircle, Clock, MapPin, Settings, Shield, Wrench, User, Building } from 'lucide-react';
import { Notification } from '../../types';
import { useUserDisplayName } from '../../hooks/useUserDisplayName';
import { formatTimestamp } from '../../utils/dateUtils';

interface NotificationDetailModalProps {
  notification: Notification | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead?: (notificationId: string) => void;
}

export const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  notification,
  isOpen,
  onClose,
  onMarkAsRead
}) => {
  if (!isOpen || !notification) return null;

  // Get user display name for the notification user
  const { displayName: userName, loading: userNameLoading } = useUserDisplayName(notification.userId);

  const getNotificationIcon = (category: Notification['category']) => {
    switch (category) {
      case 'DEVICE_OFFLINE':
      case 'TEMPERATURE_ALERT':
      case 'BATTERY_LOW':
      case 'SECURITY_ALERT':
      case 'SAFETY_ALERT':
        return <AlertTriangle className="w-6 h-6 text-red-500" />;
      case 'DEVICE_ONLINE':
      case 'DEVICE_CREATION':
      case 'RULE_CREATED':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'MAINTENANCE_SCHEDULE':
      case 'MAINTENANCE_REMINDER':
      case 'MAINTENANCE_ASSIGNMENT':
        return <Wrench className="w-6 h-6 text-blue-500" />;
      case 'PERFORMANCE_ALERT':
        return <Settings className="w-6 h-6 text-orange-500" />;
      default:
        return <Bell className="w-6 h-6 text-gray-500" />;
    }
  };

  const getNotificationBadge = (category: Notification['category']) => {
    switch (category) {
      case 'DEVICE_OFFLINE':
      case 'TEMPERATURE_ALERT':
      case 'BATTERY_LOW':
      case 'SECURITY_ALERT':
      case 'SAFETY_ALERT':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'DEVICE_ONLINE':
      case 'DEVICE_CREATION':
      case 'RULE_CREATED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'MAINTENANCE_SCHEDULE':
      case 'MAINTENANCE_REMINDER':
      case 'MAINTENANCE_ASSIGNMENT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PERFORMANCE_ALERT':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };


  const handleMarkAsRead = () => {
    if (onMarkAsRead && !notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  const timestamp = formatTimestamp(notification.createdAt);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            {getNotificationIcon(notification.category)}
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Notification Details</h2>
              <p className="text-sm text-slate-500">View complete notification information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Title and Category */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-2xl font-bold text-slate-900">{notification.title}</h3>
                <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getNotificationBadge(notification.category)}`}>
                  {notification.category.replace(/_/g, ' ')}
                </span>
                {!notification.read && (
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    Unread
                  </span>
                )}
              </div>
              <p className="text-slate-600 text-lg leading-relaxed">{notification.message}</p>
            </div>

            {/* Timestamp */}
            <div className="flex items-center gap-2 text-slate-500">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                <span className="font-medium">{timestamp.relative}</span>
                <span className="ml-2">({timestamp.full})</span>
              </span>
            </div>

            {/* Device Information */}
            {notification.deviceId && (
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Device Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-slate-500">Device ID</label>
                      <p className="text-slate-900 font-mono text-sm">{notification.deviceId}</p>
                    </div>
                    {notification.deviceName && (
                      <div>
                        <label className="text-sm font-medium text-slate-500">Device Name</label>
                        <p className="text-slate-900">{notification.deviceName}</p>
                      </div>
                    )}
                    {notification.deviceType && (
                      <div>
                        <label className="text-sm font-medium text-slate-500">Device Type</label>
                        <p className="text-slate-900">{notification.deviceType}</p>
                      </div>
                    )}
                    {notification.deviceLocation && (
                      <div>
                        <label className="text-sm font-medium text-slate-500">Location</label>
                        <p className="text-slate-900 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {notification.deviceLocation}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    {notification.deviceStatus && (
                      <div>
                        <label className="text-sm font-medium text-slate-500">Status</label>
                        <p className="text-slate-900">{notification.deviceStatus}</p>
                      </div>
                    )}
                    {notification.deviceManufacturer && (
                      <div>
                        <label className="text-sm font-medium text-slate-500">Manufacturer</label>
                        <p className="text-slate-900">{notification.deviceManufacturer}</p>
                      </div>
                    )}
                    {notification.deviceModel && (
                      <div>
                        <label className="text-sm font-medium text-slate-500">Model</label>
                        <p className="text-slate-900">{notification.deviceModel}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Rules Information */}
            {(notification.totalRulesCount !== null && notification.totalRulesCount > 0) && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Associated Rules
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{notification.totalRulesCount}</div>
                    <div className="text-sm text-slate-600">Total Rules</div>
                  </div>
                  {notification.maintenanceRulesCount !== null && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{notification.maintenanceRulesCount}</div>
                      <div className="text-sm text-slate-600">Maintenance Rules</div>
                    </div>
                  )}
                  {notification.safetyRulesCount !== null && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{notification.safetyRulesCount}</div>
                      <div className="text-sm text-slate-600">Safety Rules</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Metadata */}
            {notification.metadata && Object.keys(notification.metadata).length > 0 && (
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-slate-900 mb-3">Additional Information</h4>
                <div className="space-y-2">
                  {Object.entries(notification.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-sm font-medium text-slate-500 capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="text-sm text-slate-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* System Information */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Building className="w-5 h-5" />
                System Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-500">Notification ID</label>
                  <p className="text-slate-900 font-mono text-sm">{notification.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">Organization ID</label>
                  <p className="text-slate-900 font-mono text-sm">{notification.organizationId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500">User</label>
                  <p className="text-slate-900 text-sm">
                    {userNameLoading ? (
                      <span className="text-slate-500">Loading user...</span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <User className="w-3 h-3 text-slate-500" />
                        {userName}
                      </span>
                    )}
                  </p>
                  <p className="text-slate-400 text-xs font-mono mt-1">ID: {notification.userId}</p>
                </div>
                {notification.ruleId && (
                  <div>
                    <label className="text-sm font-medium text-slate-500">Rule ID</label>
                    <p className="text-slate-900 font-mono text-sm">{notification.ruleId}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
          <div className="text-sm text-slate-500">
            {notification.read ? 'This notification has been read' : 'This notification is unread'}
          </div>
          <div className="flex items-center gap-3">
            {!notification.read && onMarkAsRead && (
              <button
                onClick={handleMarkAsRead}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Mark as Read
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
