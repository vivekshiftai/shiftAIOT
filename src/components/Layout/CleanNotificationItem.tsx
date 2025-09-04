import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, Info, CheckCircle, Bell, Settings, Wrench, Zap, MapPin } from 'lucide-react';
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const getCategoryColor = (category: Notification['category']) => {
    switch (category) {
      case 'SECURITY_ALERT':
      case 'SAFETY_ALERT':
        return 'red';
      case 'PERFORMANCE_ALERT':
      case 'DEVICE_OFFLINE':
        return 'orange';
      case 'MAINTENANCE_SCHEDULE':
      case 'MAINTENANCE_REMINDER':
      case 'MAINTENANCE_ASSIGNMENT':
        return 'yellow';
      case 'DEVICE_ASSIGNMENT':
      case 'DEVICE_CREATION':
      case 'DEVICE_UPDATE':
      case 'DEVICE_ONLINE':
        return 'green';
      case 'RULE_TRIGGERED':
      case 'RULE_CREATED':
        return 'purple';
      case 'TEMPERATURE_ALERT':
      case 'BATTERY_LOW':
        return 'amber';
      default:
        return 'blue';
    }
  };

  const getNotificationIcon = (category: Notification['category']) => {
    switch (category) {
      // Critical Alerts - Red
      case 'SECURITY_ALERT':
      case 'SAFETY_ALERT':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      
      // Performance Issues - Orange
      case 'PERFORMANCE_ALERT':
      case 'DEVICE_OFFLINE':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      
      // Maintenance - Yellow
      case 'MAINTENANCE_SCHEDULE':
      case 'MAINTENANCE_REMINDER':
      case 'MAINTENANCE_ASSIGNMENT':
        return <Wrench className="w-5 h-5 text-yellow-500" />;
      
      // Device Status - Green
      case 'DEVICE_ASSIGNMENT':
      case 'DEVICE_CREATION':
      case 'DEVICE_UPDATE':
      case 'DEVICE_ONLINE':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      
      // Rules - Purple
      case 'RULE_TRIGGERED':
      case 'RULE_CREATED':
        return <Zap className="w-5 h-5 text-purple-500" />;
      
      // Sensor Alerts - Amber
      case 'TEMPERATURE_ALERT':
      case 'BATTERY_LOW':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      
      // System Updates - Blue
      case 'SYSTEM_UPDATE':
      case 'CUSTOM':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationStyle = (notification: Notification) => {
    const baseStyle = "rounded-lg border transition-all duration-200 hover:shadow-md";
    
    switch (notification.category) {
      // Critical Alerts - Red
      case 'SECURITY_ALERT':
      case 'SAFETY_ALERT':
        return {
          container: `${baseStyle} bg-red-50 border-red-300 hover:bg-red-100`,
          title: 'text-red-900',
          message: 'text-red-700',
          expandButton: 'text-red-600 hover:bg-red-100',
          badge: 'bg-red-100 text-red-800 border-red-200'
        };
      
      // Performance Issues - Orange
      case 'PERFORMANCE_ALERT':
      case 'DEVICE_OFFLINE':
        return {
          container: `${baseStyle} bg-orange-50 border-orange-300 hover:bg-orange-100`,
          title: 'text-orange-900',
          message: 'text-orange-700',
          expandButton: 'text-orange-600 hover:bg-orange-100',
          badge: 'bg-orange-100 text-orange-800 border-orange-200'
        };
      
      // Maintenance - Yellow
      case 'MAINTENANCE_SCHEDULE':
      case 'MAINTENANCE_REMINDER':
      case 'MAINTENANCE_ASSIGNMENT':
        return {
          container: `${baseStyle} bg-yellow-50 border-yellow-300 hover:bg-yellow-100`,
          title: 'text-yellow-900',
          message: 'text-yellow-700',
          expandButton: 'text-yellow-600 hover:bg-yellow-100',
          badge: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
      
      // Device Status - Green
      case 'DEVICE_ASSIGNMENT':
      case 'DEVICE_CREATION':
      case 'DEVICE_UPDATE':
      case 'DEVICE_ONLINE':
        return {
          container: `${baseStyle} bg-green-50 border-green-300 hover:bg-green-100`,
          title: 'text-green-900',
          message: 'text-green-700',
          expandButton: 'text-green-600 hover:bg-green-100',
          badge: 'bg-green-100 text-green-800 border-green-200'
        };
      
      // Rules - Purple
      case 'RULE_TRIGGERED':
      case 'RULE_CREATED':
        return {
          container: `${baseStyle} bg-purple-50 border-purple-300 hover:bg-purple-100`,
          title: 'text-purple-900',
          message: 'text-purple-700',
          expandButton: 'text-purple-600 hover:bg-purple-100',
          badge: 'bg-purple-100 text-purple-800 border-purple-200'
        };
      
      // Sensor Alerts - Amber
      case 'TEMPERATURE_ALERT':
      case 'BATTERY_LOW':
        return {
          container: `${baseStyle} bg-amber-50 border-amber-300 hover:bg-amber-100`,
          title: 'text-amber-900',
          message: 'text-amber-700',
          expandButton: 'text-amber-600 hover:bg-amber-100',
          badge: 'bg-amber-100 text-amber-800 border-amber-200'
        };
      
      // System Updates - Blue
      case 'SYSTEM_UPDATE':
      case 'CUSTOM':
      default:
        return {
          container: `${baseStyle} bg-blue-50 border-blue-300 hover:bg-blue-100`,
          title: 'text-blue-900',
          message: 'text-blue-700',
          expandButton: 'text-blue-600 hover:bg-blue-100',
          badge: 'bg-blue-100 text-blue-800 border-blue-200'
        };
    }
  };

  const handleExpandClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isExpanded && !details) {
      setLoadingDetails(true);
      try {
        // Simulate API call to get notification details
        // In real implementation, this would call your API
        const mockDetails = {
          device: {
            name: "Sample Device",
            type: "SENSOR",
            status: "ONLINE",
            protocol: "MQTT",
            location: "Building A, Floor 2"
          },
          summary: {
            totalRules: 14,
            totalMaintenanceTasks: 22,
            totalSafetyPrecautions: 22
          }
        };
        
        setTimeout(() => {
          setDetails(mockDetails);
          setLoadingDetails(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to load notification details:', error);
        setLoadingDetails(false);
      }
    }
    
    setIsExpanded(!isExpanded);
  };

  const style = getNotificationStyle(notification);

  return (
    <div className={`p-4 transition-all duration-200 cursor-pointer ${style.container}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5 relative">
          {getNotificationIcon(notification.category)}
          {/* Colored dot indicator */}
          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white bg-${getCategoryColor(notification.category)}-500`}></div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <p className={`text-sm font-medium ${style.title}`}>
              {notification.title}
            </p>
            <div className="flex items-center gap-2">
              {!notification.read && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
              <span className="text-xs text-slate-400">
                {formatRelativeTime(notification.createdAt)}
              </span>
              <button
                onClick={handleExpandClick}
                className={`p-1 rounded-md transition-colors ${style.expandButton}`}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <p className={`text-sm mt-1 ${style.message}`}>
            {notification.message}
          </p>
          
          <div className="mt-2 flex items-center gap-2">
            {/* Category Badge */}
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${style.badge}`}>
              {notification.category.replace(/_/g, ' ')}
            </span>
            
            {/* Device Badge */}
            {notification.deviceId && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                Device: {notification.deviceId}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Clean Expanded Content - 70% width with just numbers */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          {loadingDetails ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-sm text-slate-500">Loading details...</span>
            </div>
          ) : details ? (
            <div className="w-[70%] mx-auto">
              {/* Device Information */}
              {details.device && (
                <div className="bg-white rounded-lg p-4 border border-slate-200 mb-4">
                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Device Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500">Name:</span>
                      <span className="ml-2 font-medium">{details.device.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Type:</span>
                      <span className="ml-2 font-medium">{details.device.type}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Status:</span>
                      <span className="ml-2 font-medium">{details.device.status}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Protocol:</span>
                      <span className="ml-2 font-medium">{details.device.protocol}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500">Location:</span>
                      <span className="ml-2 font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {details.device.location}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Clean Summary Statistics - Just Numbers */}
              {details.summary && (
                <div className="bg-white rounded-lg p-6 border border-slate-200">
                  <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Summary
                  </h4>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{details.summary.totalRules}</div>
                      <div className="text-sm text-slate-500 mt-1">monitoring rules</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{details.summary.totalMaintenanceTasks}</div>
                      <div className="text-sm text-slate-500 mt-1">maintenance tasks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">{details.summary.totalSafetyPrecautions}</div>
                      <div className="text-sm text-slate-500 mt-1">safety precautions</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick(notification);
                  }}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  View Device Details
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Mark as read functionality
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Mark as Read
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-slate-500">
              No detailed information available
            </div>
          )}
        </div>
      )}
    </div>
  );
};
