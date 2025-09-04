import { Notification } from '../types';

/**
 * Validates notification data structure and required fields
 */
export interface NotificationValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: Notification;
}

/**
 * Required fields for a valid notification
 */
const REQUIRED_FIELDS = [
  'id',
  'title', 
  'message',
  'category',
  'userId',
  'organizationId',
  'createdAt'
] as const;

/**
 * Valid notification categories
 */
const VALID_CATEGORIES = [
  'DEVICE_ASSIGNMENT',
  'DEVICE_CREATION', 
  'DEVICE_UPDATE',
  'MAINTENANCE_SCHEDULE',
  'MAINTENANCE_REMINDER',
  'MAINTENANCE_ASSIGNMENT',
  'DEVICE_OFFLINE',
  'DEVICE_ONLINE',
  'TEMPERATURE_ALERT',
  'BATTERY_LOW',
  'RULE_TRIGGERED',
  'RULE_CREATED',
  'SYSTEM_UPDATE',
  'SECURITY_ALERT',
  'PERFORMANCE_ALERT',
  'SAFETY_ALERT',
  'CUSTOM'
] as const;

/**
 * Validates a single notification object
 */
export function validateNotification(notification: any): NotificationValidationResult {
  const errors: string[] = [];

  // Check if notification exists
  if (!notification || typeof notification !== 'object') {
    return {
      isValid: false,
      errors: ['Notification data is required and must be an object']
    };
  }

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!notification[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate field types and formats
  if (notification.id && typeof notification.id !== 'string') {
    errors.push('ID must be a string');
  }

  if (notification.title) {
    if (typeof notification.title !== 'string') {
      errors.push('Title must be a string');
    } else if (notification.title.length > 200) {
      errors.push('Title must not exceed 200 characters');
    } else if (notification.title.trim().length === 0) {
      errors.push('Title cannot be empty');
    }
  }

  if (notification.message) {
    if (typeof notification.message !== 'string') {
      errors.push('Message must be a string');
    } else if (notification.message.length > 1000) {
      errors.push('Message must not exceed 1000 characters');
    } else if (notification.message.trim().length === 0) {
      errors.push('Message cannot be empty');
    }
  }

  if (notification.category && !VALID_CATEGORIES.includes(notification.category)) {
    errors.push(`Invalid category: ${notification.category}. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }

  if (notification.userId && typeof notification.userId !== 'string') {
    errors.push('User ID must be a string');
  }

  if (notification.organizationId && typeof notification.organizationId !== 'string') {
    errors.push('Organization ID must be a string');
  }

  if (notification.createdAt) {
    const date = new Date(notification.createdAt);
    if (isNaN(date.getTime())) {
      errors.push('Created date must be a valid date');
    }
  }

  // Validate optional fields
  if (notification.read !== undefined && typeof notification.read !== 'boolean') {
    errors.push('Read status must be a boolean');
  }

  if (notification.deviceId !== null && notification.deviceId !== undefined && typeof notification.deviceId !== 'string') {
    errors.push('Device ID must be a string or null');
  }

  if (notification.ruleId !== null && notification.ruleId !== undefined && typeof notification.ruleId !== 'string') {
    errors.push('Rule ID must be a string or null');
  }

  if (notification.metadata !== null && notification.metadata !== undefined && typeof notification.metadata !== 'object') {
    errors.push('Metadata must be an object or null');
  }

  // If there are errors, return them
  if (errors.length > 0) {
    return {
      isValid: false,
      errors
    };
  }

  // Sanitize and return valid data
  const sanitizedData: Notification = {
    id: String(notification.id),
    title: String(notification.title).trim(),
    message: String(notification.message).trim(),
    category: notification.category,
    read: Boolean(notification.read),
    deviceId: notification.deviceId || null,
    ruleId: notification.ruleId || null,
    userId: String(notification.userId),
    organizationId: String(notification.organizationId),
    createdAt: notification.createdAt,
    metadata: notification.metadata || null,
    
    // Enhanced device information fields
    deviceName: notification.deviceName || null,
    deviceType: notification.deviceType || null,
    deviceLocation: notification.deviceLocation || null,
    deviceStatus: notification.deviceStatus || null,
    maintenanceRulesCount: notification.maintenanceRulesCount || null,
    safetyRulesCount: notification.safetyRulesCount || null,
    totalRulesCount: notification.totalRulesCount || null,
    deviceManufacturer: notification.deviceManufacturer || null,
    deviceModel: notification.deviceModel || null
  };

  return {
    isValid: true,
    errors: [],
    sanitizedData
  };
}

/**
 * Validates an array of notifications
 */
export function validateNotifications(notifications: any[]): {
  valid: Notification[];
  invalid: { data: any; errors: string[] }[];
} {
  const valid: Notification[] = [];
  const invalid: { data: any; errors: string[] }[] = [];

  if (!Array.isArray(notifications)) {
    return {
      valid: [],
      invalid: [{ data: notifications, errors: ['Notifications must be an array'] }]
    };
  }

  for (const notification of notifications) {
    const result = validateNotification(notification);
    if (result.isValid && result.sanitizedData) {
      valid.push(result.sanitizedData);
    } else {
      invalid.push({
        data: notification,
        errors: result.errors
      });
    }
  }

  return { valid, invalid };
}

/**
 * Sanitizes notification data for safe display
 */
export function sanitizeNotificationForDisplay(notification: Notification): Notification {
  return {
    ...notification,
    title: notification.title?.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') || '',
    message: notification.message?.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') || '',
    deviceName: notification.deviceName?.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') || null,
    deviceLocation: notification.deviceLocation?.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') || null
  };
}

/**
 * Checks if notification data is fresh (less than 5 minutes old)
 */
export function isNotificationDataFresh(lastFetchTime: number): boolean {
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
  return (now - lastFetchTime) < fiveMinutes;
}

/**
 * Gets notification cache key for storage
 */
export function getNotificationCacheKey(organizationId: string, userId: string): string {
  return `notifications_${organizationId}_${userId}`;
}
