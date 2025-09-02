/**
 * Device validation utilities for the IoT platform
 * Provides validation functions for device operations including deletion
 */

export interface DeviceValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates device ID format and content
 */
export const validateDeviceId = (deviceId: string): DeviceValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!deviceId) {
    errors.push('Device ID is required');
    return { isValid: false, errors, warnings };
  }
  
  if (typeof deviceId !== 'string') {
    errors.push('Device ID must be a string');
    return { isValid: false, errors, warnings };
  }
  
  const trimmedId = deviceId.trim();
  
  if (trimmedId.length === 0) {
    errors.push('Device ID cannot be empty or contain only whitespace');
    return { isValid: false, errors, warnings };
  }
  
  if (trimmedId.length < 3) {
    warnings.push('Device ID seems unusually short');
  }
  
  if (trimmedId.length > 100) {
    warnings.push('Device ID seems unusually long');
  }
  
  // Check for common invalid characters
  if (/[<>:"\\|?*]/.test(trimmedId)) {
    warnings.push('Device ID contains special characters that might cause issues');
  }
  
  return { isValid: true, errors, warnings };
};

/**
 * Validates device data before deletion
 */
export const validateDeviceForDeletion = (device: any): DeviceValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!device) {
    errors.push('Device data is required');
    return { isValid: false, errors, warnings };
  }
  
  if (!device.id) {
    errors.push('Device ID is missing');
  }
  
  if (!device.name) {
    warnings.push('Device name is missing');
  }
  
  if (device.status === 'ONLINE') {
    warnings.push('Device is currently online - deletion may cause disruption');
  }
  
  if (device.status === 'ERROR') {
    warnings.push('Device is in error state - deletion may be appropriate');
  }
  
  // Check for active connections or maintenance
  if (device.connectionStatus === 'CONNECTED') {
    warnings.push('Device has active connections - consider disconnecting first');
  }
  
  if (device.maintenanceCount && device.maintenanceCount > 0) {
    warnings.push(`Device has ${device.maintenanceCount} maintenance tasks - these will be deleted`);
  }
  
  if (device.rulesCount && device.rulesCount > 0) {
    warnings.push(`Device has ${device.rulesCount} automation rules - these will be deleted`);
  }
  
  return { 
    isValid: errors.length === 0, 
    errors, 
    warnings 
  };
};

/**
 * Formats validation errors and warnings for user display
 */
export const formatValidationMessages = (result: DeviceValidationResult): string => {
  const messages: string[] = [];
  
  if (result.errors.length > 0) {
    messages.push('Errors:');
    result.errors.forEach(error => messages.push(`• ${error}`));
  }
  
  if (result.warnings.length > 0) {
    if (messages.length > 0) messages.push('');
    messages.push('Warnings:');
    result.warnings.forEach(warning => messages.push(`• ${warning}`));
  }
  
  return messages.join('\n');
};

/**
 * Checks if a device deletion error is retryable
 */
export const isDeviceDeletionRetryable = (error: Error | string): boolean => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const lowerError = errorMessage.toLowerCase();
  
  // Non-retryable errors
  if (lowerError.includes('authentication failed') || 
      lowerError.includes('unauthorized') ||
      lowerError.includes('permission denied') ||
      lowerError.includes('forbidden') ||
      lowerError.includes('device not found') ||
      lowerError.includes('not found') ||
      lowerError.includes('404')) {
    return false;
  }
  
  // Retryable errors
  if (lowerError.includes('server error') ||
      lowerError.includes('500') ||
      lowerError.includes('network error') ||
      lowerError.includes('timeout') ||
      lowerError.includes('connection error') ||
      lowerError.includes('temporary')) {
    return true;
  }
  
  // Default to retryable for unknown errors
  return true;
};

/**
 * Gets user-friendly error message for device deletion failures
 */
export const getDeviceDeletionErrorMessage = (error: Error | string): { type: string; message: string } => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const lowerError = errorMessage.toLowerCase();
  
  if (lowerError.includes('authentication failed') || lowerError.includes('unauthorized') || lowerError.includes('401')) {
    return {
      type: 'Authentication Error',
      message: 'Your session has expired. Please log in again to continue.'
    };
  }
  
  if (lowerError.includes('permission denied') || lowerError.includes('forbidden') || lowerError.includes('403')) {
    return {
      type: 'Permission Denied',
      message: 'You do not have the required permissions to delete devices. Please contact your administrator.'
    };
  }
  
  if (lowerError.includes('device not found') || lowerError.includes('not found') || lowerError.includes('404')) {
    return {
      type: 'Device Not Found',
      message: 'The device was not found. It may have already been deleted by another user.'
    };
  }
  
  if (lowerError.includes('connection deletion failed') || lowerError.includes('device in use')) {
    return {
      type: 'Device In Use',
      message: 'The device is currently in use and cannot be deleted. Please disconnect it first and try again.'
    };
  }
  
  if (lowerError.includes('rules deletion failed') || lowerError.includes('configuration error')) {
    return {
      type: 'Configuration Error',
      message: 'Failed to delete device rules and configurations. The device may have active automation rules.'
    };
  }
  
  if (lowerError.includes('maintenance deletion failed') || lowerError.includes('maintenance error')) {
    return {
      type: 'Maintenance Error',
      message: 'Failed to delete maintenance schedules. The device may have active maintenance tasks.'
    };
  }
  
  if (lowerError.includes('500') || lowerError.includes('server error') || lowerError.includes('internal error')) {
    return {
      type: 'Server Error',
      message: 'A server error occurred. Please try again in a few minutes.'
    };
  }
  
  if (lowerError.includes('network error') || lowerError.includes('fetch') || lowerError.includes('timeout')) {
    return {
      type: 'Network Error',
      message: 'Network connection error. Please check your internet connection and try again.'
    };
  }
  
  if (lowerError.includes('validation failed') || lowerError.includes('invalid')) {
    return {
      type: 'Validation Error',
      message: 'Invalid device data. Please refresh the page and try again.'
    };
  }
  
  return {
    type: 'Unknown Error',
    message: errorMessage || 'An unexpected error occurred while deleting the device.'
  };
};
