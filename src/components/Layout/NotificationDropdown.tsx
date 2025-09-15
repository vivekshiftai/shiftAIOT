import React, { useRef, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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

  const handleViewAllNotifications = () => {
    onToggle(); // Close the dropdown
    navigate('/notifications'); // Navigate to notifications section
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={onToggle}
        className="relative p-2 hover:bg-gray-100 rounded-md transition-colors"
      >
        <Bell className={`w-5 h-5 ${getBellColor()}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Clean Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-16 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Simple Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <p className="text-sm text-gray-500">
                  {unreadCount} unread
                </p>
              </div>
              <button
                onClick={onToggle}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No notifications</p>
              </div>
            ) : (
              <div className="p-2">
                {notifications.map((notification) => (
                  <div key={notification.id} className="mb-1">
                    <CleanNotificationItem
                      notification={notification}
                      onClick={handleNotificationClick}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Simple Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200">
              <button 
                onClick={handleViewAllNotifications}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};