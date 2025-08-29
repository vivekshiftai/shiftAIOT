import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, Info, CheckCircle, Bell, Clock, MapPin, Settings, Shield, Wrench } from 'lucide-react';
import { Notification } from '../../types';

interface EnhancedNotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
}

export const EnhancedNotificationItem: React.FC<EnhancedNotificationItemProps> = ({ 
  notification, 
  onClick 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'ERROR':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'SUCCESS':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationStyle = (notification: Notification) => {
    // Special styling for device assignment notifications
    if (notification.title?.includes('Device Assignment') || notification.title?.includes('Complete Overview')) {
      return {
        container: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500 hover:from-blue-100 hover:to-indigo-100',
        title: 'text-blue-900 font-semibold',
        message: 'text-blue-700',
        expandButton: 'text-blue-600 hover:text-blue-700'
      };
    }
    
    // Default styling
    return {
      container: !notification.read ? 'bg-slate-50 hover:bg-slate-100' : 'hover:bg-slate-50',
      title: !notification.read ? 'text-slate-900' : 'text-slate-600',
      message: 'text-slate-600',
      expandButton: 'text-slate-500 hover:text-slate-700'
    };
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const loadNotificationDetails = async () => {
    if (details || loadingDetails) return;
    
    setLoadingDetails(true);
    try {
      const response = await fetch(`/api/notifications/${notification.id}/details`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDetails(data);
      }
    } catch (error) {
      console.error('Failed to load notification details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
    if (!isExpanded && !details) {
      loadNotificationDetails();
    }
  };

  const style = getNotificationStyle(notification);

  return (
    <div className={`p-4 transition-all duration-200 cursor-pointer ${style.container}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type)}
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
                {formatTimestamp(notification.createdAt)}
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
          
          {notification.deviceId && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                Device: {notification.deviceId}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          {loadingDetails ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-sm text-slate-500">Loading details...</span>
            </div>
          ) : details ? (
            <div className="space-y-4">
              {/* Device Information */}
              {details.device && (
                <div className="bg-white rounded-lg p-4 border border-slate-200">
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

              {/* Summary Statistics */}
              {details.summary && (
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Summary
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{details.summary.totalRules}</div>
                      <div className="text-xs text-slate-500">Monitoring Rules</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{details.summary.totalMaintenanceTasks}</div>
                      <div className="text-xs text-slate-500">Maintenance Tasks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{details.summary.totalSafetyPrecautions}</div>
                      <div className="text-xs text-slate-500">Safety Precautions</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Rules */}
              {details.rules && details.rules.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Monitoring Rules ({details.rules.length})
                  </h4>
                  <div className="space-y-2">
                    {details.rules.slice(0, 5).map((rule: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                        <div>
                          <div className="font-medium text-sm">{rule.name}</div>
                          {rule.metric && (
                            <div className="text-xs text-slate-500">
                              {rule.metric}: {rule.threshold}
                            </div>
                          )}
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs ${
                          rule.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {rule.active ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    ))}
                    {details.rules.length > 5 && (
                      <div className="text-center text-sm text-slate-500">
                        ... and {details.rules.length - 5} more rules
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Maintenance Tasks */}
              {details.maintenance && details.maintenance.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    Maintenance Tasks ({details.maintenance.length})
                  </h4>
                  <div className="space-y-2">
                    {details.maintenance.slice(0, 5).map((task: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                        <div>
                          <div className="font-medium text-sm">{task.taskName}</div>
                          <div className="text-xs text-slate-500">
                            {task.frequency} • {task.maintenanceType}
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs ${
                          task.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                          task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {task.priority}
                        </div>
                      </div>
                    ))}
                    {details.maintenance.length > 5 && (
                      <div className="text-center text-sm text-slate-500">
                        ... and {details.maintenance.length - 5} more tasks
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Safety Precautions */}
              {details.safety && details.safety.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Safety Precautions ({details.safety.length})
                  </h4>
                  <div className="space-y-2">
                    {details.safety.slice(0, 5).map((safety: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                        <div>
                          <div className="font-medium text-sm">{safety.title}</div>
                          <div className="text-xs text-slate-500">
                            {safety.type} • {safety.category}
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs ${
                          safety.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                          safety.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                          safety.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {safety.severity}
                        </div>
                      </div>
                    ))}
                    {details.safety.length > 5 && (
                      <div className="text-center text-sm text-slate-500">
                        ... and {details.safety.length - 5} more precautions
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
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
