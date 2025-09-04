import { notificationAPI } from './api';
import { Notification, NotificationEvent } from '../types';
import { validateNotifications, sanitizeNotificationForDisplay } from '../utils/notificationValidation';
import { notificationCacheService } from './notificationCacheService';

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
      category: this.getNotificationCategory(event),
      read: false,
      userId: event.userId,
      deviceId: event.deviceId || null,
      organizationId: organizationId,
      metadata: event.data ? { ...event.data } : null
    };

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(notification)
      });

      if (response.ok) {
        const createdNotification = await response.json();
        this.notifyListeners();
        return createdNotification;
      } else {
        console.error('Failed to create notification:', response.statusText);
        return null;
      }
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  // Get notification title based on event type
  private getNotificationTitle(event: NotificationEvent): string {
    switch (event.type) {
      case 'DEVICE_CREATION':
        return 'New Device Created';
      case 'DEVICE_ASSIGNMENT':
        return 'Device Assignment';
      case 'DEVICE_UPDATE':
        return 'Device Updated';
      case 'MAINTENANCE_SCHEDULE':
        return 'Maintenance Scheduled';
      case 'MAINTENANCE_REMINDER':
        return 'Maintenance Reminder';
      case 'DEVICE_OFFLINE':
        return 'Device Offline Alert';
      case 'DEVICE_ONLINE':
        return 'Device Online';
      case 'TEMPERATURE_ALERT':
        return 'Temperature Alert';
      case 'BATTERY_LOW':
        return 'Battery Low Alert';
      case 'RULE_TRIGGERED':
        return 'Rule Triggered';
      case 'RULE_CREATED':
        return 'New Rule Created';
      case 'SYSTEM_UPDATE':
        return 'System Update';
      case 'SECURITY_ALERT':
        return 'Security Alert';
      case 'PERFORMANCE_ALERT':
        return 'Performance Alert';
      case 'SAFETY_ALERT':
        return 'Safety Alert';
      default:
        return 'System Notification';
    }
  }

  // Get notification message based on event type
  private getNotificationMessage(event: NotificationEvent): string {
    switch (event.type) {
      case 'DEVICE_CREATION':
        return `A new device has been created: ${event.deviceName || 'Unknown Device'}`;
      case 'DEVICE_ASSIGNMENT':
        return `You have been assigned a new device: ${event.deviceName || 'Unknown Device'}`;
      case 'DEVICE_UPDATE':
        return `Device ${event.deviceName || 'Unknown Device'} has been updated`;
      case 'MAINTENANCE_SCHEDULE':
        return `Maintenance has been scheduled for device: ${event.deviceName || 'Unknown Device'}`;
      case 'MAINTENANCE_REMINDER':
        return `Maintenance reminder for device: ${event.deviceName || 'Unknown Device'}`;
      case 'DEVICE_OFFLINE':
        return `Device ${event.deviceName || 'Unknown Device'} is offline`;
      case 'DEVICE_ONLINE':
        return `Device ${event.deviceName || 'Unknown Device'} is back online`;
      case 'TEMPERATURE_ALERT':
        return `Temperature alert for device: ${event.deviceName || 'Unknown Device'}`;
      case 'BATTERY_LOW':
        return `Battery low alert for device: ${event.deviceName || 'Unknown Device'}`;
      case 'RULE_TRIGGERED':
        return `Monitoring rule triggered for device: ${event.deviceName || 'Unknown Device'}`;
      case 'RULE_CREATED':
        return `New monitoring rule created for device: ${event.deviceName || 'Unknown Device'}`;
      case 'SYSTEM_UPDATE':
        return 'System has been updated';
      case 'SECURITY_ALERT':
        return 'Security alert detected';
      case 'PERFORMANCE_ALERT':
        return 'Performance issue detected';
      case 'SAFETY_ALERT':
        return 'Safety alert detected';
      default:
        return 'A system event has occurred';
    }
  }

  // Get notification category based on event type
  private getNotificationCategory(event: NotificationEvent): string {
    return event.type; // The event type directly maps to the notification category
  }

  private getAuthToken(): string {
    return localStorage.getItem('token') || '';
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private getNotificationIcon(notification: Notification): string {
    switch (notification.category) {
      case 'DEVICE_ASSIGNMENT':
      case 'DEVICE_CREATION':
      case 'DEVICE_UPDATE':
        return 'device';
      case 'MAINTENANCE_SCHEDULE':
      case 'MAINTENANCE_REMINDER':
      case 'MAINTENANCE_ASSIGNMENT':
        return 'maintenance';
      case 'RULE_TRIGGERED':
      case 'RULE_CREATED':
        return 'rule';
      case 'DEVICE_OFFLINE':
      case 'DEVICE_ONLINE':
        return 'status';
      case 'TEMPERATURE_ALERT':
      case 'BATTERY_LOW':
        return 'alert';
      case 'SECURITY_ALERT':
      case 'SAFETY_ALERT':
        return 'security';
      case 'PERFORMANCE_ALERT':
        return 'performance';
      case 'SYSTEM_UPDATE':
        return 'system';
      default:
        return 'info';
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private getNotificationColor(notification: Notification): string {
    switch (notification.category) {
      case 'DEVICE_ASSIGNMENT':
      case 'DEVICE_CREATION':
      case 'DEVICE_UPDATE':
        return 'blue';
      case 'MAINTENANCE_SCHEDULE':
      case 'MAINTENANCE_REMINDER':
      case 'MAINTENANCE_ASSIGNMENT':
        return 'orange';
      case 'RULE_TRIGGERED':
      case 'RULE_CREATED':
        return 'purple';
      case 'DEVICE_OFFLINE':
        return 'red';
      case 'DEVICE_ONLINE':
        return 'green';
      case 'TEMPERATURE_ALERT':
      case 'BATTERY_LOW':
        return 'yellow';
      case 'SECURITY_ALERT':
      case 'SAFETY_ALERT':
        return 'red';
      case 'PERFORMANCE_ALERT':
        return 'yellow';
      case 'SYSTEM_UPDATE':
        return 'blue';
      default:
        return 'gray';
    }
  }

  // Get all notifications
  getAll(): Notification[] {
    return this.notifications;
  }

  // Load notifications from database with caching and validation
  async loadFromDatabase(organizationId?: string, userId?: string): Promise<void> {
    try {
      // Check cache first if we have user context
      if (organizationId && userId) {
        const cachedNotifications = notificationCacheService.getCachedNotifications(organizationId, userId);
        if (cachedNotifications) {
          console.log('📦 Using cached notifications');
          this.notifications = cachedNotifications;
          this.notifyListeners();
          return;
        }
      }

      console.log('🌐 Fetching notifications from API...');
      const response = await notificationAPI.getAll();
      
      // Validate and sanitize response data
      if (response?.data && Array.isArray(response.data)) {
        const validationResult = validateNotifications(response.data);
        
        if (validationResult.invalid.length > 0) {
          console.warn('⚠️ Found invalid notifications:', validationResult.invalid);
        }
        
        // Use only valid notifications and sanitize them
        this.notifications = validationResult.valid.map(notification => 
          sanitizeNotificationForDisplay(notification)
        );
        
        // Cache the valid notifications if we have user context
        if (organizationId && userId) {
          notificationCacheService.setCachedNotifications(organizationId, userId, this.notifications);
        }
        
        console.log(`✅ Loaded ${this.notifications.length} valid notifications`);
      } else {
        console.warn('❌ Invalid notification data received from server');
        this.notifications = [];
      }
      
      this.notifyListeners();
    } catch (error: any) {
      // Don't log 401 errors as they're expected when token is invalid
      if (error.response?.status !== 401) {
        console.error('❌ Failed to load notifications from database:', error);
      }
      this.notifications = [];
      this.notifyListeners();
    }
  }

  // Get unread notifications
  getUnread(): Notification[] {
    return this.notifications.filter(n => !n.read);
  }

  // Mark notification as read
  async markAsRead(notificationId: string, organizationId?: string, userId?: string): Promise<void> {
    try {
      await notificationAPI.markAsRead(notificationId);
      
      // Update local state
      const notification = this.notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
        
        // Update cache if we have user context
        if (organizationId && userId) {
          notificationCacheService.updateCachedNotification(organizationId, userId, notification);
        }
      }
      
      this.notifyListeners();
    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error);
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

  // Get notifications by category
  getByCategory(category: Notification['category']): Notification[] {
    return this.notifications.filter(n => n.category === category);
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

  // Subscribe to notification updates (alias for addListener for compatibility)
  subscribe(callback: (notifications: Notification[]) => void): () => void {
    const listener = () => callback([...this.notifications]);
    return this.addListener(listener);
  }

  // Get current notifications
  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  // Get unread count
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }
}

// Export both the class and singleton instance
export { NotificationService };
export const notificationService = NotificationService.getInstance();
