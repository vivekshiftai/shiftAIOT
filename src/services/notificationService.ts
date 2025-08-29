import { Notification, Device, Rule, TelemetryData } from '../types';
import { notificationAPI } from './api';

export interface NotificationEvent {
  type: 'device_added' | 'device_assigned' | 'device_offline' | 'device_online' | 'rule_triggered' | 'temperature_alert' | 'battery_low' | 'maintenance_due';
  deviceId?: string;
  deviceName?: string;
  userId: string;
  data?: any;
}

class NotificationService {
  private static instance: NotificationService;
  private notifications: Notification[] = [];
  private listeners: ((notifications: Notification[]) => void)[] = [];

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Subscribe to notification updates
  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.notifications));
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
    const organizationId = user?.organizationId || '1';

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
      case 'device_added':
        return 'New Device Added';
      case 'device_assigned':
        return 'Device Assigned';
      case 'device_offline':
        return 'Device Offline';
      case 'device_online':
        return 'Device Online';
      case 'rule_triggered':
        return 'Rule Triggered';
      case 'temperature_alert':
        return 'Temperature Alert';
      case 'battery_low':
        return 'Low Battery Warning';
      case 'maintenance_due':
        return 'Maintenance Due';
      default:
        return 'System Notification';
    }
  }

  // Get notification message based on event type
  private getNotificationMessage(event: NotificationEvent): string {
    const deviceName = event.deviceName || 'Unknown Device';
    const ruleName = event.data?.ruleName || 'Unknown Rule';
    const temperature = event.data?.temperature || 'unknown';
    const batteryLevel = event.data?.batteryLevel || 'unknown';
    const additionalMessage = event.data?.message || '';

    switch (event.type) {
      case 'device_added':
        return `New device "${deviceName}" has been added to the platform.`;
      case 'device_assigned':
        return `Device "${deviceName}" has been assigned to your organization.`;
      case 'device_offline':
        return `Device "${deviceName}" has gone offline. Please check the connection.`;
      case 'device_online':
        return `Device "${deviceName}" is now online and reporting data.`;
      case 'rule_triggered':
        return `Rule "${ruleName}" has been triggered.${additionalMessage ? ` ${additionalMessage}` : ''}`;
      case 'temperature_alert':
        return `Temperature sensor "${deviceName}" reported ${temperature}°C, which exceeds the threshold.`;
      case 'battery_low':
        return `Device "${deviceName}" battery level is critically low (${batteryLevel}%). Please replace or recharge.`;
      case 'maintenance_due':
        return `Device "${deviceName}" is due for maintenance. Schedule a service appointment.`;
      default:
        return 'A system event has occurred.';
    }
  }

  // Get notification type based on event type
  private getNotificationType(event: NotificationEvent): Notification['type'] {
    switch (event.type) {
      case 'device_offline':
      case 'temperature_alert':
      case 'battery_low':
        return 'ERROR';
      case 'maintenance_due':
        return 'WARNING';
      case 'device_added':
      case 'device_assigned':
      case 'device_online':
        return 'SUCCESS';
      case 'rule_triggered':
        return 'INFO';
      default:
        return 'INFO';
    }
  }

  // Mark notification as read
  markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
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

  // Clear all notifications
  clearAll() {
    this.notifications = [];
    this.notifyListeners();
  }

  // Delete a specific notification
  async deleteNotification(notificationId: string): Promise<void> {
    // Validate input
    if (!notificationId || typeof notificationId !== 'string') {
      throw new Error('Valid notification ID is required');
    }

    try {
      await notificationAPI.delete(notificationId);
      // Remove from local state
      this.notifications = this.notifications.filter(n => n.id !== notificationId);
      this.notifyListeners();
      console.log('Notification deleted:', notificationId);
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
      console.log('All notifications deleted');
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
      throw error;
    }
  }

  // Check rules and trigger notifications (disabled to prevent unwanted notifications)
  checkRules(devices: Device[], rules: Rule[], telemetryData: TelemetryData[], userId: string) {
    // Disabled automatic rule checking to prevent unwanted notifications
    console.log('Rule checking disabled to prevent unwanted notifications');
  }

  // Evaluate a rule against current device and telemetry data
  private evaluateRule(rule: Rule, devices: Device[], telemetryData: TelemetryData[]): boolean {
    return rule.conditions.every(condition => {
      switch (condition.type) {
        case 'telemetry_threshold':
          return this.evaluateTelemetryThreshold(condition, telemetryData);
        case 'device_status':
          return this.evaluateDeviceStatus(condition, devices);
        case 'time_based':
          return this.evaluateTimeBased(condition);
        default:
          return false;
      }
    });
  }

  private evaluateTelemetryThreshold(condition: any, telemetryData: TelemetryData[]): boolean {
    const relevantData = telemetryData.filter(data => 
      !condition.deviceId || data.deviceId === condition.deviceId
    );

    if (relevantData.length === 0) return false;

    const latestData = relevantData[relevantData.length - 1];
    const value = latestData.metrics[condition.metric];

    if (value === undefined) return false;

    switch (condition.operator) {
      case '>':
        return value > condition.value;
      case '<':
        return value < condition.value;
      case '=':
        return value === condition.value;
      case '>=':
        return value >= condition.value;
      case '<=':
        return value <= condition.value;
      default:
        return false;
    }
  }

  private evaluateDeviceStatus(condition: any, devices: Device[]): boolean {
    const relevantDevices = devices.filter(device => 
      !condition.deviceId || device.id === condition.deviceId
    );

    return relevantDevices.some(device => device.status === condition.value);
  }

  private evaluateTimeBased(condition: any): boolean {
    const now = new Date();
    const hour = now.getHours();
    
    // Simple time-based evaluation - can be extended
    return hour >= 9 && hour <= 17; // Business hours
  }

  // Get notification details
  async getNotificationDetails(notificationId: string): Promise<any> {
    try {
      const response = await notificationAPI.getDetails(notificationId);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch notification details:', error);
      throw error;
    }
  }

  // Device event notifications
  async onDeviceAdded(device: Device, userId: string) {
    await this.createNotification({
      type: 'device_added',
      deviceId: device.id,
      deviceName: device.name,
      userId
    });
  }

  async onDeviceAssigned(device: Device, userId: string) {
    await this.createNotification({
      type: 'device_assigned',
      deviceId: device.id,
      deviceName: device.name,
      userId
    });
  }

  async onDeviceStatusChange(device: Device, userId: string) {
    if (device.status === 'OFFLINE') {
      await this.createNotification({
        type: 'device_offline',
        deviceId: device.id,
        deviceName: device.name,
        userId
      });
    } else if (device.status === 'ONLINE') {
      await this.createNotification({
        type: 'device_online',
        deviceId: device.id,
        deviceName: device.name,
        userId
      });
    }
  }

  async onTemperatureAlert(device: Device, temperature: number, userId: string) {
    await this.createNotification({
      type: 'temperature_alert',
      deviceId: device.id,
      deviceName: device.name,
      userId,
      data: { temperature }
    });
  }

  async onBatteryLow(device: Device, batteryLevel: number, userId: string) {
    await this.createNotification({
      type: 'battery_low',
      deviceId: device.id,
      deviceName: device.name,
      userId,
      data: { batteryLevel }
    });
  }

  async onMaintenanceDue(device: Device, userId: string) {
    await this.createNotification({
      type: 'maintenance_due',
      deviceId: device.id,
      deviceName: device.name,
      userId
    });
  }
}

export default NotificationService;
