import { logInfo, logWarn, logError } from './logger';

export interface DeviceValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
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
 * Validates device data for updates, ensuring all fields can accept null values
 * and providing proper validation feedback
 */
export const validateDeviceUpdate = (deviceData: any): DeviceValidationResult => {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};
  
  logInfo('DeviceValidation', 'Validating device update data', { deviceData });

  // Check for required fields that should not be null
  if (deviceData.id === null || deviceData.id === undefined) {
    errors.id = 'Device ID is required';
  }

  // Validate string field lengths (allow null values)
  if (deviceData.name !== null && deviceData.name !== undefined && deviceData.name.length > 100) {
    errors.name = 'Device name must be less than 100 characters';
  }

  if (deviceData.location !== null && deviceData.location !== undefined && deviceData.location.length > 200) {
    errors.location = 'Location must be less than 200 characters';
  }

  if (deviceData.manufacturer !== null && deviceData.manufacturer !== undefined && deviceData.manufacturer.length > 100) {
    errors.manufacturer = 'Manufacturer must be less than 100 characters';
  }

  if (deviceData.model !== null && deviceData.model !== undefined && deviceData.model.length > 100) {
    errors.model = 'Model must be less than 100 characters';
  }

  if (deviceData.description !== null && deviceData.description !== undefined && deviceData.description.length > 500) {
    errors.description = 'Description must be less than 500 characters';
  }

  if (deviceData.ipAddress !== null && deviceData.ipAddress !== undefined && deviceData.ipAddress.length > 45) {
    errors.ipAddress = 'IP address must be less than 45 characters';
  }

  // Validate port numbers (allow null values)
  if (deviceData.port !== null && deviceData.port !== undefined) {
    if (deviceData.port < 1 || deviceData.port > 65535) {
      errors.port = 'Port must be between 1 and 65535';
    }
  }

  if (deviceData.coapPort !== null && deviceData.coapPort !== undefined) {
    if (deviceData.coapPort < 1 || deviceData.coapPort > 65535) {
      errors.coapPort = 'COAP port must be between 1 and 65535';
    }
  }

  // Validate MQTT fields (allow null values)
  if (deviceData.mqttBroker !== null && deviceData.mqttBroker !== undefined && deviceData.mqttBroker.length > 255) {
    errors.mqttBroker = 'MQTT broker must be less than 255 characters';
  }

  if (deviceData.mqttTopic !== null && deviceData.mqttTopic !== undefined && deviceData.mqttTopic.length > 255) {
    errors.mqttTopic = 'MQTT topic must be less than 255 characters';
  }

  if (deviceData.mqttUsername !== null && deviceData.mqttUsername !== undefined && deviceData.mqttUsername.length > 100) {
    errors.mqttUsername = 'MQTT username must be less than 100 characters';
  }

  if (deviceData.mqttPassword !== null && deviceData.mqttPassword !== undefined && deviceData.mqttPassword.length > 255) {
    errors.mqttPassword = 'MQTT password must be less than 255 characters';
  }

  // Validate HTTP fields (allow null values)
  if (deviceData.httpEndpoint !== null && deviceData.httpEndpoint !== undefined && deviceData.httpEndpoint.length > 500) {
    errors.httpEndpoint = 'HTTP endpoint must be less than 500 characters';
  }

  if (deviceData.httpMethod !== null && deviceData.httpMethod !== undefined && deviceData.httpMethod.length > 10) {
    errors.httpMethod = 'HTTP method must be less than 10 characters';
  }

  if (deviceData.httpHeaders !== null && deviceData.httpHeaders !== undefined && deviceData.httpHeaders.length > 1000) {
    errors.httpHeaders = 'HTTP headers must be less than 1000 characters';
  }

  // Validate COAP fields (allow null values)
  if (deviceData.coapHost !== null && deviceData.coapHost !== undefined && deviceData.coapHost.length > 255) {
    errors.coapHost = 'COAP host must be less than 255 characters';
  }

  if (deviceData.coapPath !== null && deviceData.coapPath !== undefined && deviceData.coapPath.length > 255) {
    errors.coapPath = 'COAP path must be less than 255 characters';
  }

  // Log validation results
  const isValid = Object.keys(errors).length === 0;
  
  if (isValid) {
    logInfo('DeviceValidation', 'Device validation passed successfully');
  } else {
    logWarn('DeviceValidation', 'Device validation failed', { errors });
  }

  if (Object.keys(warnings).length > 0) {
    logWarn('DeviceValidation', 'Device validation warnings', { warnings });
  }

  return {
    isValid,
    errors,
    warnings
  };
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
 * Sanitizes device data for API calls, ensuring proper null handling
 */
export const sanitizeDeviceData = (deviceData: any): any => {
  const sanitized: any = {};
  
  Object.keys(deviceData).forEach(key => {
    const value = deviceData[key];
    
    // Convert empty strings to null for better backend handling
    if (value === '') {
      sanitized[key] = null;
    } else if (value !== undefined) {
      sanitized[key] = value;
    }
  });
  
  logInfo('DeviceValidation', 'Device data sanitized', { 
    original: deviceData, 
    sanitized 
  });
  
  return sanitized;
};

/**
 * Checks if a field value has changed from the original device
 */
export const hasFieldChanged = (originalValue: any, newValue: any): boolean => {
  // Handle null/undefined cases
  if (originalValue === null && newValue === null) return false;
  if (originalValue === undefined && newValue === undefined) return false;
  if (originalValue === null || newValue === null) return true;
  if (originalValue === undefined || newValue === undefined) return true;
  
  // Handle string comparisons
  if (typeof originalValue === 'string' && typeof newValue === 'string') {
    return originalValue.trim() !== newValue.trim();
  }
  
  // Handle other types
  return originalValue !== newValue;
};

/**
 * Gets only the changed fields from the device update
 */
export const getChangedFields = (originalDevice: any, updatedDevice: any): any => {
  const changedFields: any = {};
  
  Object.keys(updatedDevice).forEach(key => {
    if (hasFieldChanged(originalDevice[key], updatedDevice[key])) {
      changedFields[key] = updatedDevice[key];
    }
  });
  
  logInfo('DeviceValidation', 'Changed fields identified', { 
    changedFields,
    totalFields: Object.keys(updatedDevice).length 
  });
  
  return changedFields;
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
