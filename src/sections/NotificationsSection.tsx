import React, { useEffect, useMemo, useState } from 'react';
import { Bell, Filter, Search, CheckCircle } from 'lucide-react';
import { useIoT } from '../contexts/IoTContext';
import { Notification } from '../types';
import { CleanNotificationItem } from '../components/Layout/CleanNotificationItem';
import { NotificationDetailModal } from '../components/UI/NotificationDetailModal';
import { logInfo } from '../utils/logger';

export const NotificationsSection: React.FC = () => {
  const { notifications, markAllNotificationsAsRead } = useIoT();
  const params = new URLSearchParams(window.location.search);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    const filter = params.get('filter');
    if (filter === 'maintenance') {
      setSearchTerm('maintenance');
    }
  }, []);

  const filteredNotifications = useMemo(() => notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || notification.category === typeFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'read' && notification.read) ||
                         (statusFilter === 'unread' && !notification.read);
    
    return matchesSearch && matchesType && matchesStatus;
  }), [notifications, searchTerm, typeFilter, statusFilter]);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Reset time to compare only dates
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    
    const groups = {
      today: [] as Notification[],
      yesterday: [] as Notification[],
      past: [] as Notification[]
    };
    
    filteredNotifications.forEach(notification => {
      const notificationDate = new Date(notification.createdAt);
      notificationDate.setHours(0, 0, 0, 0);
      
      if (notificationDate.getTime() === today.getTime()) {
        groups.today.push(notification);
      } else if (notificationDate.getTime() === yesterday.getTime()) {
        groups.yesterday.push(notification);
      } else {
        groups.past.push(notification);
      }
    });
    
    // Sort each group by creation time (newest first)
    groups.today.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    groups.yesterday.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    groups.past.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return groups;
  }, [filteredNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const totalCount = notifications.length;

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
  };


  const handleNotificationClick = (notification: Notification) => {
    // Open detail modal
    setSelectedNotification(notification);
    setIsDetailModalOpen(true);
    logInfo('NotificationsSection', 'Notification clicked', { notificationId: notification.id, category: notification.category });
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedNotification(null);
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Notification Center</h1>
          <p className="page-subtitle">
            Manage and view all your platform notifications
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-secondary">
            <Bell className="w-4 h-4" />
            <span>{unreadCount} unread</span>
            <span className="text-tertiary">•</span>
            <span>{totalCount} total</span>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2 btn-secondary"
            >
              <CheckCircle className="w-4 h-4" />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6 glass">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-light rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 futuristic-input"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-secondary-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-light rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 futuristic-input"
            >
              <option value="all">All Types</option>
              <option value="SECURITY_ALERT">Security Alerts</option>
              <option value="SAFETY_ALERT">Safety Alerts</option>
              <option value="MAINTENANCE_REMINDER">Maintenance</option>
              <option value="DEVICE_ASSIGNMENT">Device Assignment</option>
              <option value="DEVICE_OFFLINE">Device Status</option>
              <option value="PERFORMANCE_ALERT">Performance</option>
              <option value="RULE_TRIGGERED">Rules</option>
              <option value="TEMPERATURE_ALERT">Sensor Alerts</option>
              <option value="SYSTEM_UPDATE">System Updates</option>
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-light rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 futuristic-input"
            >
              <option value="all">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="card overflow-hidden glass">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
            <h3 className="subsection-header">No notifications found</h3>
            <p className="text-secondary">
              {notifications.length === 0 
                ? "You don't have any notifications yet."
                : "No notifications match your current filters."
              }
            </p>
          </div>
        ) : (
          <>

            {/* Date-wise Grouped Notifications */}
            <div className="space-y-8 px-4">
              {/* Today's Notifications */}
              {groupedNotifications.today.length > 0 && (
                <div className="px-4 py-6">
                  <div className="pb-4 border-b-2 border-pink-500">
                    <h3 className="text-lg font-bold text-pink-600">📅 Today ({groupedNotifications.today.length})</h3>
                  </div>
                  <div className="mt-6 divide-y divide-slate-200">
                    {groupedNotifications.today.map((notification) => (
                      <CleanNotificationItem
                        key={notification.id}
                        notification={notification}
                        onClick={handleNotificationClick}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Yesterday's Notifications */}
              {groupedNotifications.yesterday.length > 0 && (
                <div className="px-4 py-6">
                  <div className="pb-4 border-b-2 border-pink-500">
                    <h3 className="text-lg font-bold text-pink-600">🕒 Yesterday ({groupedNotifications.yesterday.length})</h3>
                  </div>
                  <div className="mt-6 divide-y divide-slate-200">
                    {groupedNotifications.yesterday.map((notification) => (
                      <CleanNotificationItem
                        key={notification.id}
                        notification={notification}
                        onClick={handleNotificationClick}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Past Notifications */}
              {groupedNotifications.past.length > 0 && (
                <div className="px-4 py-6">
                  <div className="pb-4 border-b-2 border-pink-500">
                    <h3 className="text-lg font-bold text-pink-600">📂 Past Messages ({groupedNotifications.past.length})</h3>
                  </div>
                  <div className="mt-6 divide-y divide-slate-200">
                    {groupedNotifications.past.map((notification) => (
                      <CleanNotificationItem
                        key={notification.id}
                        notification={notification}
                        onClick={handleNotificationClick}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Pagination/Stats */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          Showing {filteredNotifications.length} of {totalCount} notifications
        </span>
        <div className="flex items-center gap-4">
          <span>Unread: {unreadCount}</span>
          <span>Read: {totalCount - unreadCount}</span>
        </div>
      </div>

      {/* Notification Detail Modal */}
      <NotificationDetailModal
        notification={selectedNotification}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
      />

    </div>
  );
};
