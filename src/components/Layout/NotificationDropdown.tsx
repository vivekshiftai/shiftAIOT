import React, { useRef, useEffect } from 'react';
import { Bell, X, Filter } from 'lucide-react';
import { useIoT } from '../../contexts/IoTContext';
import { Notification } from '../../types';
import { CleanNotificationItem } from './CleanNotificationItem';

interface NotificationDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ 
  isOpen, 
  onToggle 
}) => {
  const { notifications, markNotificationAsRead } = useIoT();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onToggle();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggle]);

  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Get the most critical notification color for the bell icon
  const getBellColor = () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length === 0) return 'text-slate-600';
    
    // Priority order: Critical > Performance > Maintenance > Device > Rules > Sensor > System
    const hasCritical = unreadNotifications.some(n => n.category === 'SECURITY_ALERT' || n.category === 'SAFETY_ALERT');
    const hasPerformance = unreadNotifications.some(n => n.category === 'PERFORMANCE_ALERT' || n.category === 'DEVICE_OFFLINE');
    const hasMaintenance = unreadNotifications.some(n => n.category.includes('MAINTENANCE'));
    const hasDevice = unreadNotifications.some(n => n.category.includes('DEVICE'));
    const hasRules = unreadNotifications.some(n => n.category.includes('RULE'));
    const hasSensor = unreadNotifications.some(n => n.category === 'TEMPERATURE_ALERT' || n.category === 'BATTERY_LOW');
    
    if (hasCritical) return 'text-red-600';
    if (hasPerformance) return 'text-orange-600';
    if (hasMaintenance) return 'text-yellow-600';
    if (hasDevice) return 'text-green-600';
    if (hasRules) return 'text-purple-600';
    if (hasSensor) return 'text-amber-600';
    return 'text-blue-600';
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Handle notification click - could navigate to device details or mark as read
    await markNotificationAsRead(notification.id);
    onToggle(); // Close the dropdown
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={onToggle}
        className="relative p-3 hover:bg-slate-50 rounded-xl transition-all duration-200 group"
      >
        <Bell className={`w-6 h-6 ${getBellColor()} transition-all duration-200 group-hover:scale-110`} />
        {unreadCount > 0 && (
          <span className={`absolute -top-1 -right-1 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-semibold shadow-lg animate-pulse ${
            getBellColor().includes('red') ? 'bg-gradient-to-r from-red-500 to-red-600' :
            getBellColor().includes('orange') ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
            getBellColor().includes('yellow') ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
            getBellColor().includes('green') ? 'bg-gradient-to-r from-green-500 to-green-600' :
            getBellColor().includes('purple') ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
            getBellColor().includes('amber') ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
            'bg-gradient-to-r from-blue-500 to-blue-600'
          }`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Enhanced Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-16 w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200/50 backdrop-blur-sm z-[9999] max-h-[500px] overflow-hidden animate-scaleIn">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 border-b border-slate-200/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Notifications</h3>
                  <p className="text-sm text-slate-600 mt-0.5">
                    {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={onToggle}
                className="p-2 hover:bg-white/80 rounded-xl transition-all duration-200 group"
              >
                <X className="w-5 h-5 text-slate-500 group-hover:text-slate-700" />
              </button>
            </div>
            
            {/* Filter Options */}
            <div className="mt-4 flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <select className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                <option>All Types</option>
                <option>Device Alerts</option>
                <option>Maintenance</option>
                <option>Security</option>
              </select>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-slate-400" />
                </div>
                <h4 className="text-lg font-semibold text-slate-700 mb-2">No notifications</h4>
                <p className="text-slate-500 text-sm">You're all caught up! New notifications will appear here.</p>
              </div>
            ) : (
              <div className="p-2">
                {notifications.map((notification) => (
                  <div key={notification.id} className="mb-2">
                    <CleanNotificationItem
                      notification={notification}
                      onClick={handleNotificationClick}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-4 border-t border-slate-200/50">
              <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};