import React, { useState } from 'react';
import { AlertTriangle, Info, CheckCircle, Bell, Settings, Wrench, Zap, Clock } from 'lucide-react';
import { Notification } from '../../types';
import { formatRelativeTime } from '../../utils/dateUtils';
import { deviceAPI, ruleAPI, maintenanceAPI } from '../../services/api';

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

  const handleCardClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isExpanded && !details) {
      setLoadingDetails(true);
      try {
        const deviceId = notification.deviceId;
        if (!deviceId) {
          throw new Error('No device ID available');
        }

        // Fetch all device data in parallel
        const [deviceResponse, rulesResponse, maintenanceResponse] = await Promise.allSettled([
          deviceAPI.getById(deviceId),
          ruleAPI.getByDevice(deviceId),
          maintenanceAPI.getByDevice(deviceId)
        ]);

        // Process device information
        const deviceData = deviceResponse.status === 'fulfilled' ? deviceResponse.value.data : null;
        const device = {
          name: deviceData?.name || notification.deviceName || "Unknown Device",
          type: deviceData?.type || notification.deviceType || "UNKNOWN",
          status: deviceData?.status || notification.deviceStatus || "UNKNOWN",
          protocol: deviceData?.protocol || "MQTT",
          location: deviceData?.location || notification.deviceLocation || "Unknown Location"
        };

        // Process rules data
        const rulesData = rulesResponse.status === 'fulfilled' ? (rulesResponse.value.data || []) : [];
        const totalRules = Array.isArray(rulesData) ? rulesData.length : (notification.totalRulesCount || 0);
        const keyRules = Array.isArray(rulesData) ? rulesData.slice(0, 3).map((rule: any) => ({
          name: rule.name || rule.rule_name || 'Unnamed Rule',
          parameter: rule.metric || rule.parameter || 'unknown'
        })) : [];

        // Process maintenance data
        const maintenanceData = maintenanceResponse.status === 'fulfilled' 
          ? (maintenanceResponse.value.data?.maintenanceTasks || maintenanceResponse.value.data || [])
          : [];
        const totalMaintenanceTasks = Array.isArray(maintenanceData) ? maintenanceData.length : (notification.maintenanceRulesCount || 0);
        
        // Get upcoming maintenance tasks (next 3)
        const upcomingMaintenance = Array.isArray(maintenanceData) ? maintenanceData
          .filter((task: any) => {
            if (!task || !task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            const today = new Date();
            return dueDate >= today;
          })
          .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
          .slice(0, 3)
          .map((task: any) => ({
            task: task.taskName || task.name || task.description || 'Maintenance Task',
            dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : 'No date'
          })) : [];

        const details = {
          device,
          summary: {
            totalRules,
            totalMaintenanceTasks,
            totalSafetyPrecautions: notification.safetyRulesCount || 0
          },
          upcomingMaintenance,
          keyRules
        };
        
        setDetails(details);
        setLoadingDetails(false);
      } catch (error) {
        console.error('Failed to load notification details:', error);
        setLoadingDetails(false);
        // Set fallback data if API calls fail
        setDetails({
          device: {
            name: notification.deviceName || "Unknown Device",
            type: notification.deviceType || "UNKNOWN",
            status: notification.deviceStatus || "UNKNOWN",
            protocol: "MQTT",
            location: notification.deviceLocation || "Unknown Location"
          },
          summary: {
            totalRules: notification.totalRulesCount || 0,
            totalMaintenanceTasks: notification.maintenanceRulesCount || 0,
            totalSafetyPrecautions: notification.safetyRulesCount || 0
          },
          upcomingMaintenance: [],
          keyRules: []
        });
      }
    }
    
    setIsExpanded(!isExpanded);
  };

  const style = getNotificationStyle(notification);

  return (
    <div className={`transition-all duration-300 ${style.container} rounded-xl overflow-hidden`}>
      {/* Compact Card Header - Only Title */}
      <div 
        className="p-4 cursor-pointer hover:shadow-md transition-all duration-200 group"
        onClick={handleCardClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 relative">
              <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-all duration-200">
                {getNotificationIcon(notification.category)}
              </div>
              {!notification.read && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                {notification.title}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(notification.createdAt)}
                {!notification.read && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    New
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <button
            className={`p-2 rounded-lg transition-all duration-200 ${style.expandButton} text-sm font-bold min-w-[32px] h-8 flex items-center justify-center group-hover:scale-110 shadow-sm hover:shadow-md`}
          >
            {isExpanded ? "−" : "+"}
          </button>
        </div>
      </div>

      {/* Expanded Details Dropdown */}
      {isExpanded && (
        <div className="border-t border-slate-200/50 bg-gradient-to-br from-slate-50 to-white">
          {loadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-sm text-slate-600 font-medium">Loading device details...</span>
            </div>
          ) : details ? (
            <div className="p-6 space-y-6 animate-fadeIn">
              {/* Device Overview */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm hover:shadow-md transition-all duration-200">
                <h4 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <Settings className="w-5 h-5 text-blue-600" />
                  </div>
                  Device Overview
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-500 font-medium mb-1">Device</p>
                    <p className="font-bold text-slate-900">{details.device.name} ({details.device.type})</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-500 font-medium mb-1">Location</p>
                    <p className="font-bold text-slate-900 flex items-center gap-2">
                      📍 {details.device.location}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-500 font-medium mb-1">Protocol</p>
                    <p className="font-bold text-slate-900">{details.device.protocol}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-500 font-medium mb-1">Status</p>
                    <p className="font-bold text-green-600">{details.device.status}</p>
                  </div>
                </div>
              </div>

              {/* Summary Statistics */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm hover:shadow-md transition-all duration-200">
                <h4 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-xl">
                    <Bell className="w-5 h-5 text-green-600" />
                  </div>
                  Summary Statistics
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-xl">
                    <div className="text-3xl font-bold text-blue-600 mb-1">{details.summary?.totalRules || 0}</div>
                    <div className="text-sm text-slate-600 font-medium">monitoring rules</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-xl">
                    <div className="text-3xl font-bold text-green-600 mb-1">{details.summary?.totalMaintenanceTasks || 0}</div>
                    <div className="text-sm text-slate-600 font-medium">maintenance tasks</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-xl">
                    <div className="text-3xl font-bold text-orange-600 mb-1">{details.summary?.totalSafetyPrecautions || 0}</div>
                    <div className="text-sm text-slate-600 font-medium">safety precautions</div>
                  </div>
                </div>
              </div>

              {/* Key Monitoring Rules */}
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-500" />
                  Key Monitoring Rules
                </h4>
                {details.keyRules && details.keyRules.length > 0 ? (
                  <div className="space-y-3">
                    {details.keyRules.map((rule: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="font-medium text-slate-900">{rule.name}</span>
                        <span className="text-sm text-slate-500 font-mono">({rule.parameter})</span>
                      </div>
                    ))}
                    {details.summary && details.summary.totalRules > 3 && (
                      <p className="text-sm text-slate-500 text-center pt-2">
                        ... and {details.summary.totalRules - 3} more rules
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">
                    No monitoring rules configured for this device
                  </p>
                )}
              </div>

              {/* Upcoming Maintenance */}
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-yellow-500" />
                  Upcoming Maintenance
                </h4>
                {details.upcomingMaintenance && details.upcomingMaintenance.length > 0 ? (
                  <div className="space-y-3">
                    {details.upcomingMaintenance.map((task: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="font-medium text-slate-900">{task.task}</span>
                        <span className="text-sm text-slate-500">Due: {task.dueDate}</span>
                      </div>
                    ))}
                    {details.summary && details.summary.totalMaintenanceTasks > 3 && (
                      <p className="text-sm text-slate-500 text-center pt-2">
                        ... and {details.summary.totalMaintenanceTasks - 3} more tasks
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">
                    No upcoming maintenance tasks scheduled
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick(notification);
                  }}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  View Device Details
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Mark as read functionality
                  }}
                  className="px-6 py-3 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  Mark as Read
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Info className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p>No detailed information available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
