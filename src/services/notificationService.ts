import { Notification, Device, Rule, TelemetryData } from '../types';

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
  createNotification(event: NotificationEvent): Notification {
    const notification: Notification = {
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: this.getNotificationTitle(event),
      message: this.getNotificationMessage(event),
      type: this.getNotificationType(event),
      timestamp: new Date().toISOString(),
      read: false,
      userId: event.userId,
      deviceId: event.deviceId
    };

    this.notifications.unshift(notification);
    this.notifyListeners();
    return notification;
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
    switch (event.type) {
      case 'device_added':
        return `New device "${event.deviceName}" has been added to the platform.`;
      case 'device_assigned':
        return `Device "${event.deviceName}" has been assigned to your organization.`;
      case 'device_offline':
        return `Device "${event.deviceName}" has gone offline. Please check the connection.`;
      case 'device_online':
        return `Device "${event.deviceName}" is now online and reporting data.`;
      case 'rule_triggered':
        return `Rule "${event.data?.ruleName}" has been triggered. ${event.data?.message || ''}`;
      case 'temperature_alert':
        return `Temperature sensor "${event.deviceName}" reported ${event.data?.temperature}°C, which exceeds the threshold.`;
      case 'battery_low':
        return `Device "${event.deviceName}" battery level is critically low (${event.data?.batteryLevel}%). Please replace or recharge.`;
      case 'maintenance_due':
        return `Device "${event.deviceName}" is due for maintenance. Schedule a service appointment.`;
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
        return 'error';
      case 'maintenance_due':
        return 'warning';
      case 'device_added':
      case 'device_assigned':
      case 'device_online':
        return 'success';
      case 'rule_triggered':
        return 'info';
      default:
        return 'info';
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

  // Get unread notifications
  getUnread(): Notification[] {
    return this.notifications.filter(n => !n.read);
  }

  // Clear all notifications
  clearAll() {
    this.notifications = [];
    this.notifyListeners();
  }

  // Check rules and trigger notifications
  checkRules(devices: Device[], rules: Rule[], telemetryData: TelemetryData[], userId: string) {
    rules.forEach(rule => {
      if (!rule.active) return;

      const triggered = this.evaluateRule(rule, devices, telemetryData);
      if (triggered) {
        this.createNotification({
          type: 'rule_triggered',
          userId,
          data: {
            ruleName: rule.name,
            message: rule.description
          }
        });
      }
    });
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

  // Device event notifications
  onDeviceAdded(device: Device, userId: string) {
    this.createNotification({
      type: 'device_added',
      deviceId: device.id,
      deviceName: device.name,
      userId
    });
  }

  onDeviceAssigned(device: Device, userId: string) {
    this.createNotification({
      type: 'device_assigned',
      deviceId: device.id,
      deviceName: device.name,
      userId
    });
  }

  onDeviceStatusChange(device: Device, userId: string) {
    if (device.status === 'offline') {
      this.createNotification({
        type: 'device_offline',
        deviceId: device.id,
        deviceName: device.name,
        userId
      });
    } else if (device.status === 'online') {
      this.createNotification({
        type: 'device_online',
        deviceId: device.id,
        deviceName: device.name,
        userId
      });
    }
  }

  onTemperatureAlert(device: Device, temperature: number, userId: string) {
    this.createNotification({
      type: 'temperature_alert',
      deviceId: device.id,
      deviceName: device.name,
      userId,
      data: { temperature }
    });
  }

  onBatteryLow(device: Device, batteryLevel: number, userId: string) {
    this.createNotification({
      type: 'battery_low',
      deviceId: device.id,
      deviceName: device.name,
      userId,
      data: { batteryLevel }
    });
  }

  onMaintenanceDue(device: Device, userId: string) {
    this.createNotification({
      type: 'maintenance_due',
      deviceId: device.id,
      deviceName: device.name,
      userId
    });
  }
}

export default NotificationService;
