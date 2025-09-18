import React from 'react';
import { AlertTriangle, Info, CheckCircle, Wrench, Zap, Smartphone, Shield, Thermometer, Battery, Settings, Bell } from 'lucide-react';
import { Notification } from '../../types';
import { formatRelativeTime, formatLocalDateTime } from '../../utils/dateUtils';

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
        return <Shield className="w-5 h-5 text-red-500" />;
      case 'SAFETY_ALERT':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      
      // Performance Issues
      case 'PERFORMANCE_ALERT':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'DEVICE_OFFLINE':
        return <Smartphone className="w-5 h-5 text-orange-500" />;
      
      // Maintenance
      case 'MAINTENANCE_SCHEDULE':
      case 'MAINTENANCE_REMINDER':
      case 'MAINTENANCE_ASSIGNMENT':
        return <Wrench className="w-5 h-5 text-yellow-500" />;
      
      // Device Status
      case 'DEVICE_ASSIGNMENT':
        return <Smartphone className="w-5 h-5 text-green-500" />;
      case 'DEVICE_CREATION':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'DEVICE_UPDATE':
        return <Settings className="w-5 h-5 text-green-500" />;
      case 'DEVICE_ONLINE':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      
      // Rules
      case 'RULE_TRIGGERED':
      case 'RULE_CREATED':
        return <Zap className="w-5 h-5 text-purple-500" />;
      
      // Sensor Alerts
      case 'TEMPERATURE_ALERT':
        return <Thermometer className="w-5 h-5 text-amber-500" />;
      case 'BATTERY_LOW':
        return <Battery className="w-5 h-5 text-amber-500" />;
      
      // System Updates
      case 'SYSTEM_UPDATE':
        return <Settings className="w-5 h-5 text-blue-500" />;
      case 'CUSTOM':
      default:
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const getCategoryColor = (category: Notification['category']) => {
    switch (category) {
      case 'SECURITY_ALERT':
      case 'SAFETY_ALERT':
        return 'border-l-red-500 bg-red-50';
      case 'PERFORMANCE_ALERT':
      case 'DEVICE_OFFLINE':
        return 'border-l-orange-500 bg-orange-50';
      case 'MAINTENANCE_SCHEDULE':
      case 'MAINTENANCE_REMINDER':
      case 'MAINTENANCE_ASSIGNMENT':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'DEVICE_ASSIGNMENT':
      case 'DEVICE_CREATION':
      case 'DEVICE_UPDATE':
      case 'DEVICE_ONLINE':
        return 'border-l-green-500 bg-green-50';
      case 'RULE_TRIGGERED':
      case 'RULE_CREATED':
        return 'border-l-purple-500 bg-purple-50';
      case 'TEMPERATURE_ALERT':
      case 'BATTERY_LOW':
        return 'border-l-amber-500 bg-amber-50';
      case 'SYSTEM_UPDATE':
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  const getCategoryName = (category: Notification['category']) => {
    switch (category) {
      case 'SECURITY_ALERT': return 'Security Alert';
      case 'SAFETY_ALERT': return 'Safety Alert';
      case 'PERFORMANCE_ALERT': return 'Performance Alert';
      case 'DEVICE_OFFLINE': return 'Device Offline';
      case 'MAINTENANCE_SCHEDULE': return 'Maintenance Schedule';
      case 'MAINTENANCE_REMINDER': return 'Maintenance Reminder';
      case 'MAINTENANCE_ASSIGNMENT': return 'Maintenance Assignment';
      case 'DEVICE_ASSIGNMENT': return 'Device Assignment';
      case 'DEVICE_CREATION': return 'Device Creation';
      case 'DEVICE_UPDATE': return 'Device Update';
      case 'DEVICE_ONLINE': return 'Device Online';
      case 'RULE_TRIGGERED': return 'Rule Triggered';
      case 'RULE_CREATED': return 'Rule Created';
      case 'TEMPERATURE_ALERT': return 'Temperature Alert';
      case 'BATTERY_LOW': return 'Battery Low';
      case 'SYSTEM_UPDATE': return 'System Update';
      default: return 'Notification';
    }
  };

  const getPriorityLevel = (category: Notification['category']) => {
    switch (category) {
      case 'SECURITY_ALERT':
      case 'SAFETY_ALERT':
      case 'DEVICE_OFFLINE':
        return { level: 'High', color: 'text-red-600 bg-red-100' };
      case 'MAINTENANCE_REMINDER':
      case 'PERFORMANCE_ALERT':
      case 'TEMPERATURE_ALERT':
      case 'BATTERY_LOW':
        return { level: 'Medium', color: 'text-yellow-600 bg-yellow-100' };
      default:
        return { level: 'Low', color: 'text-green-600 bg-green-100' };
    }
  };

  const getNotificationType = (category: Notification['category']) => {
    switch (category) {
      case 'SECURITY_ALERT':
      case 'SAFETY_ALERT':
      case 'DEVICE_OFFLINE':
      case 'PERFORMANCE_ALERT':
      case 'TEMPERATURE_ALERT':
      case 'BATTERY_LOW':
        return 'Alert';
      case 'MAINTENANCE_ASSIGNMENT':
      case 'MAINTENANCE_SCHEDULE':
      case 'MAINTENANCE_REMINDER':
        return 'Task';
      case 'DEVICE_ASSIGNMENT':
      case 'DEVICE_CREATION':
      case 'DEVICE_UPDATE':
      case 'RULE_TRIGGERED':
      case 'RULE_CREATED':
      case 'SYSTEM_UPDATE':
      case 'DEVICE_ONLINE':
      default:
        return 'Information';
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(notification);
  };

  const priority = getPriorityLevel(notification.category);
  const categoryName = getCategoryName(notification.category);
  const categoryColor = getCategoryColor(notification.category);

  return (
    <div className={`border-l-4 ${categoryColor} bg-white border border-gray-200 rounded-r-lg hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer group`}>
      {/* Enhanced Notification Card */}
      <div 
        className="p-4"
        onClick={handleCardClick}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 mt-1">
            {getNotificationIcon(notification.category)}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {notification.title}
                  </h3>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 animate-pulse"></div>
                  )}
                </div>
                
                {/* Category and Priority */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                    {categoryName}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${priority.color}`}>
                    {priority.level}
                  </span>
                </div>
              </div>
              
              {/* Timestamp */}
              <div className="text-xs text-gray-500 flex-shrink-0">
                {notification.createdAt ? formatLocalDateTime(notification.createdAt) : 'Unknown time'}
              </div>
            </div>
            
            {/* Message Preview */}
            <div className="mb-3">
              <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
                {notification.message}
              </p>
            </div>
            
            {/* Additional Info Preview */}
            <div className="mb-3 p-2 bg-gray-50 rounded-md">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    Source: IoT Platform
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    Type: {getNotificationType(notification.category)}
                  </span>
                </div>
                <span className="text-gray-500">
                  {notification.read ? 'Read' : 'Unread'}
                </span>
              </div>
            </div>
            
            {/* Footer Info */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-4">
                {/* <span className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  ID: {notification.id?.substring(0, 8) || 'N/A'}
                </span> */}
                {/* {notification.deviceId && (
                  <span className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                    Device: {notification.deviceId.substring(0, 8)}
                  </span>
                )} */}
              </div>
              <div className="flex items-center gap-1 text-blue-600 group-hover:text-blue-700 transition-colors">
                <span className="font-medium">View details</span>
                <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};