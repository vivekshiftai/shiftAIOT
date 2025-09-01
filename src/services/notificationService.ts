import { notificationAPI } from './api';
import { Notification, NotificationEvent } from '../types';

class NotificationService {
  private static instance: NotificationService;
  private notifications: Notification[] = [];
  private listeners: (() => void)[] = [];

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Add listener for notification updates
  addListener(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // Create a new notification
  async createNotification(event: NotificationEvent): Promise<Notification | null> {
    // Validate required fields
    if (!event) {
      console.error('Notification event is required');
      return null;
    }

    if (!event.type) {
      console.error('Notification event type is required');
      return null;
    }

    if (!event.userId) {
      console.error('User ID is required for notification');
      return null;
    }

    // Get current user from localStorage for organization ID
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const organizationId = user?.organizationId || 'default';

    const notification: any = {
      title: this.getNotificationTitle(event) || 'System Notification',
      message: this.getNotificationMessage(event) || 'A system event has occurred.',
      type: this.getNotificationType(event),
      read: false,
      userId: event.userId,
      deviceId: event.deviceId || null,
      organizationId: organizationId,
      metadata: event.data ? { ...event.data } : null
    };

    try {
      // Store notification in database - backend will handle preference checking
      const response = await notificationAPI.create(notification);
      const savedNotification = response.data;
      
      // Add to local state only if notification was created (not blocked by preferences)
      if (savedNotification) {
        this.notifications.unshift(savedNotification);
        this.notifyListeners();
        
        // Log notification creation for debugging
        console.log('Notification created:', {
          id: savedNotification.id,
          title: savedNotification.title,
          type: savedNotification.type,
          userId: savedNotification.userId
        });
      } else {
        console.log('Notification blocked by user preferences:', event.type);
      }
      
      return savedNotification;
    } catch (error) {
      console.error('Failed to save notification to database:', error);
      // Don't create fallback notification - let the error propagate
      throw error;
    }
  }

  // Get notification title based on event type
  private getNotificationTitle(event: NotificationEvent): string {
    switch (event.type) {
      case 'DEVICE_ASSIGNMENT':
        return 'Device Assignment';
      case 'DEVICE_CREATION':
        return 'Device Created';
      case 'MAINTENANCE_SCHEDULE':
        return 'Maintenance Scheduled';
      case 'RULE_TRIGGERED':
        return 'Rule Triggered';
      case 'DEVICE_OFFLINE':
        return 'Device Offline';
      case 'DEVICE_ONLINE':
        return 'Device Online';
      case 'SYSTEM_UPDATE':
        return 'System Update';
      case 'SECURITY_ALERT':
        return 'Security Alert';
      case 'PERFORMANCE_ALERT':
        return 'Performance Alert';
      default:
        return 'System Notification';
    }
  }

  // Get notification message based on event type
  private getNotificationMessage(event: NotificationEvent): string {
    switch (event.type) {
      case 'DEVICE_ASSIGNMENT':
        return `Device ${event.deviceId || 'Unknown'} has been assigned to you.`;
      case 'DEVICE_CREATION':
        return `New device ${event.deviceId || 'Unknown'} has been created.`;
      case 'MAINTENANCE_SCHEDULE':
        return `Maintenance task scheduled for device ${event.deviceId || 'Unknown'}.`;
      case 'RULE_TRIGGERED':
        return `Monitoring rule has been triggered for device ${event.deviceId || 'Unknown'}.`;
      case 'DEVICE_OFFLINE':
        return `Device ${event.deviceId || 'Unknown'} is now offline.`;
      case 'DEVICE_ONLINE':
        return `Device ${event.deviceId || 'Unknown'} is now online.`;
      case 'SYSTEM_UPDATE':
        return 'System has been updated with new features.';
      case 'SECURITY_ALERT':
        return 'Security alert detected. Please review immediately.';
      case 'PERFORMANCE_ALERT':
        return 'Performance issue detected. Please investigate.';
      default:
        return 'A system event has occurred.';
    }
  }

  // Get notification type based on event type
  private getNotificationType(event: NotificationEvent): 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' {
    switch (event.type) {
      case 'SECURITY_ALERT':
      case 'PERFORMANCE_ALERT':
        return 'ERROR';
      case 'DEVICE_OFFLINE':
      case 'RULE_TRIGGERED':
        return 'WARNING';
      case 'DEVICE_ASSIGNMENT':
      case 'DEVICE_CREATION':
      case 'MAINTENANCE_SCHEDULE':
        return 'SUCCESS';
      case 'DEVICE_ONLINE':
      case 'SYSTEM_UPDATE':
      default:
        return 'INFO';
    }
  }

  // Get all notifications
  getAll(): Notification[] {
    return this.notifications;
  }

  // Load notifications from database
  async loadFromDatabase(): Promise<void> {
    try {
      const response = await notificationAPI.getAll();
      
      // Validate response data
      if (response?.data && Array.isArray(response.data)) {
        // Filter out invalid notifications and ensure required fields
        this.notifications = response.data.filter((notification: any) => {
          return notification && 
                 notification.id && 
                 notification.title && 
                 notification.message && 
                 notification.type &&
                 notification.userId &&
                 notification.organizationId;
        }).map((notification: any) => ({
          ...notification,
          read: Boolean(notification.read),
          deviceId: notification.deviceId || null,
          ruleId: notification.ruleId || null,
          metadata: notification.metadata || null
        }));
      } else {
        console.warn('Invalid notification data received from server');
        this.notifications = [];
      }
      
      this.notifyListeners();
    } catch (error: any) {
      // Don't log 401 errors as they're expected when token is invalid
      if (error.response?.status !== 401) {
        console.error('Failed to load notifications from database:', error);
      }
      this.notifications = [];
      this.notifyListeners();
    }
  }

  // Get unread notifications
  getUnread(): Notification[] {
    return this.notifications.filter(n => !n.read);
  }

  // Get unread count
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await notificationAPI.markAsRead(notificationId);
      
      // Update local state
      const notification = this.notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    try {
      await notificationAPI.markAllAsRead();
      
      // Update local state
      this.notifications.forEach(n => n.read = true);
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await notificationAPI.delete(notificationId);
      
      // Remove from local state
      this.notifications = this.notifications.filter(n => n.id !== notificationId);
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }

  // Delete all notifications
  async deleteAllNotifications(): Promise<void> {
    try {
      await notificationAPI.deleteAll();
      
      // Clear local state
      this.notifications = [];
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
      throw error;
    }
  }

  // Clear notifications (remove from local state without deleting from database)
  clearNotifications(): void {
    this.notifications = [];
    this.notifyListeners();
  }

  // Get notifications by type
  getByType(type: Notification['type']): Notification[] {
    return this.notifications.filter(n => n.type === type);
  }

  // Get notifications by device
  getByDevice(deviceId: string): Notification[] {
    return this.notifications.filter(n => n.deviceId === deviceId);
  }

  // Get notifications by rule
  getByRule(ruleId: string): Notification[] {
    return this.notifications.filter(n => n.ruleId === ruleId);
  }

  // Search notifications
  search(query: string): Notification[] {
    const lowerQuery = query.toLowerCase();
    return this.notifications.filter(n => 
      n.title.toLowerCase().includes(lowerQuery) ||
      n.message.toLowerCase().includes(lowerQuery)
    );
  }

  // Get recent notifications (last N)
  getRecent(count: number = 10): Notification[] {
    return this.notifications.slice(0, count);
  }

  // Get notifications by date range
  getByDateRange(startDate: Date, endDate: Date): Notification[] {
    return this.notifications.filter(n => {
      const createdAt = new Date(n.createdAt);
      return createdAt >= startDate && createdAt <= endDate;
    });
  }
}

export const notificationService = NotificationService.getInstance();
