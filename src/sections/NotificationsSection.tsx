import React, { useEffect, useMemo, useState } from 'react';
import { Bell, Filter, Search, Check, X, AlertTriangle, Info, CheckCircle, Trash2, Archive } from 'lucide-react';
import { useIoT } from '../contexts/IoTContext';
import { Notification } from '../types';
import { LoadingSpinner } from '../components/Loading/LoadingComponents';

export const NotificationsSection: React.FC = () => {
  const { notifications, markNotificationAsRead } = useIoT();
  const params = new URLSearchParams(window.location.search);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);

  useEffect(() => {
    const filter = params.get('filter');
    const range = params.get('range');
    if (filter === 'maintenance') {
      setSearchTerm('maintenance');
    }
    // "range" param is informational here; the dashboard card shows current week.
  }, []);

  const filteredNotifications = useMemo(() => notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'read' && notification.read) ||
                         (statusFilter === 'unread' && !notification.read);
    
    return matchesSearch && matchesType && matchesStatus;
  }), [notifications, searchTerm, typeFilter, statusFilter]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const totalCount = notifications.length;

  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    for (const notification of unreadNotifications) {
      await markNotificationAsRead(notification.id);
    }
  };

  const handleSelectNotification = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId) 
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-error-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success-500" />;
      default:
        return <Info className="w-5 h-5 text-secondary-500" />;
    }
  };

  const getNotificationBadge = (type: Notification['type']) => {
    switch (type) {
      case 'error':
        return 'bg-error-500/20 text-error-300';
      case 'warning':
        return 'bg-warning-500/20 text-warning-300';
      case 'success':
        return 'bg-success-500/20 text-success-300';
      default:
        return 'bg-secondary-500/20 text-secondary-300';
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Notification Center</h1>
          <p className="text-secondary mt-2">
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
              <Check className="w-4 h-4" />
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
              <option value="error">Errors</option>
              <option value="warning">Warnings</option>
              <option value="success">Success</option>
              <option value="info">Info</option>
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
            <h3 className="text-lg font-medium text-primary mb-2">No notifications found</h3>
            <p className="text-secondary">
              {notifications.length === 0 
                ? "You don't have any notifications yet."
                : "No notifications match your current filters."
              }
            </p>
          </div>
        ) : (
          <>
            {/* Bulk Actions */}
            {selectedNotifications.length > 0 && (
              <div className="p-4 bg-secondary-500/10 border-b border-light">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary-300">
                    {selectedNotifications.length} notification{selectedNotifications.length !== 1 ? 's' : ''} selected
                  </span>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-1 text-sm btn-secondary">
                      <Check className="w-3 h-3" />
                      Mark as read
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1 text-sm bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-all">
                      <Archive className="w-3 h-3" />
                      Archive
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all">
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications */}
            <div className="divide-y divide-slate-200">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-slate-50 transition-colors ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedNotifications.includes(notification.id)}
                      onChange={() => handleSelectNotification(notification.id)}
                      className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className={`text-lg font-semibold ${
                              !notification.read ? 'text-slate-900' : 'text-slate-700'
                            }`}>
                              {notification.title}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getNotificationBadge(notification.type)}`}>
                              {notification.type}
                            </span>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-slate-600 mb-3 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span>{formatTimestamp(notification.timestamp)}</span>
                            {notification.deviceId && (
                              <>
                                <span>•</span>
                                <span>Device: {notification.deviceId}</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-4">
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Archive"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
    </div>
  );
};
