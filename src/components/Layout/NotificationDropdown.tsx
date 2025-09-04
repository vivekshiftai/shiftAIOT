import React, { useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
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
      <button
        onClick={onToggle}
        className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <Bell className={`w-5 h-5 ${getBellColor()}`} />
        {unreadCount > 0 && (
          <span className={`absolute -top-1 -right-1 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ${
            getBellColor().includes('red') ? 'bg-red-500' :
            getBellColor().includes('orange') ? 'bg-orange-500' :
            getBellColor().includes('yellow') ? 'bg-yellow-500' :
            getBellColor().includes('green') ? 'bg-green-500' :
            getBellColor().includes('purple') ? 'bg-purple-500' :
            getBellColor().includes('amber') ? 'bg-amber-500' :
            'bg-blue-500'
          }`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-[9999] max-h-96 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Notifications</h3>
              <button
                onClick={onToggle}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <CleanNotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={handleNotificationClick}
                  />
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-4 border-t border-slate-200">
              <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};