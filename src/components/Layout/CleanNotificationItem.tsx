import React from 'react';
import { AlertTriangle, Info, CheckCircle, Wrench, Zap } from 'lucide-react';
import { Notification } from '../../types';
import { formatRelativeTime } from '../../utils/dateUtils';

interface CleanNotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
}

export const CleanNotificationItem: React.FC<CleanNotificationItemProps> = ({ 
  notification, 
  onClick 
}) => {
  const getNotificationIcon = (category: Notification['category']) => {
    switch (category) {
      // Critical Alerts
      case 'SECURITY_ALERT':
      case 'SAFETY_ALERT':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      
      // Performance Issues
      case 'PERFORMANCE_ALERT':
      case 'DEVICE_OFFLINE':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      
      // Maintenance
      case 'MAINTENANCE_SCHEDULE':
      case 'MAINTENANCE_REMINDER':
      case 'MAINTENANCE_ASSIGNMENT':
        return <Wrench className="w-4 h-4 text-yellow-500" />;
      
      // Device Status
      case 'DEVICE_ASSIGNMENT':
      case 'DEVICE_CREATION':
      case 'DEVICE_UPDATE':
      case 'DEVICE_ONLINE':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      
      // Rules
      case 'RULE_TRIGGERED':
      case 'RULE_CREATED':
        return <Zap className="w-4 h-4 text-purple-500" />;
      
      // Sensor Alerts
      case 'TEMPERATURE_ALERT':
      case 'BATTERY_LOW':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      
      // System Updates
      case 'SYSTEM_UPDATE':
      case 'CUSTOM':
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(notification);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
      {/* Simple Notification Card */}
      <div 
        className="p-3 cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getNotificationIcon(notification.category)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {notification.title}
              </h3>
              {!notification.read && (
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {formatRelativeTime(notification.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};