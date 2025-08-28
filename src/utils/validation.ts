// Comprehensive validation utility for real-time form validation
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  type?: 'email' | 'url' | 'number' | 'phone' | 'ip' | 'port';
}

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

export interface FieldValidation {
  [fieldName: string]: ValidationRule;
}

// Common validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/.+/,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
  IP_ADDRESS: /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  PORT: /^([1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  ALPHANUMERIC: /^[a-zA-Z0-9\s]+$/,
  NUMERIC: /^\d+$/,
  DECIMAL: /^\d+(\.\d+)?$/
};

// Validation functions
export const validateField = (value: any, rule: ValidationRule): ValidationResult => {
  // Handle null/undefined values
  if (value === null || value === undefined) {
    if (rule.required) {
      return { isValid: false, error: 'This field is required' };
    }
    return { isValid: true, error: null };
  }

  // Convert to string for validation
  const stringValue = String(value).trim();

  // Required validation
  if (rule.required && !stringValue) {
    return { isValid: false, error: 'This field is required' };
  }

  // Skip other validations if empty and not required
  if (!stringValue) {
    return { isValid: true, error: null };
  }

  // Length validations
  if (rule.minLength && stringValue.length < rule.minLength) {
    return { 
      isValid: false, 
      error: `Minimum length is ${rule.minLength} characters` 
    };
  }

  if (rule.maxLength && stringValue.length > rule.maxLength) {
    return { 
      isValid: false, 
      error: `Maximum length is ${rule.maxLength} characters` 
    };
  }

  // Type-specific validations
  if (rule.type) {
    const typeError = validateType(stringValue, rule.type);
    if (typeError) {
      return { isValid: false, error: typeError };
    }
  }

  // Pattern validation
  if (rule.pattern && !rule.pattern.test(stringValue)) {
    return { isValid: false, error: 'Invalid format' };
  }

  // Custom validation
  if (rule.custom) {
    const customError = rule.custom(value);
    if (customError) {
      return { isValid: false, error: customError };
    }
  }

  return { isValid: true, error: null };
};

const validateType = (value: string, type: string): string | null => {
  switch (type) {
    case 'email':
      return VALIDATION_PATTERNS.EMAIL.test(value) ? null : 'Please enter a valid email address';
    case 'url':
      return VALIDATION_PATTERNS.URL.test(value) ? null : 'Please enter a valid URL';
    case 'phone':
      return VALIDATION_PATTERNS.PHONE.test(value) ? null : 'Please enter a valid phone number';
    case 'ip':
      return VALIDATION_PATTERNS.IP_ADDRESS.test(value) ? null : 'Please enter a valid IP address';
    case 'port':
      return VALIDATION_PATTERNS.PORT.test(value) ? null : 'Please enter a valid port number (1-65535)';
    case 'number':
      return !isNaN(Number(value)) ? null : 'Please enter a valid number';
    default:
      return null;
  }
};

// Validate entire form
export const validateForm = (data: any, rules: FieldValidation): Record<string, string> => {
  const errors: Record<string, string> = {};

  Object.keys(rules).forEach(fieldName => {
    const value = data[fieldName];
    const rule = rules[fieldName];
    const result = validateField(value, rule);
    
    if (!result.isValid) {
      errors[fieldName] = result.error!;
    }
  });

  return errors;
};

// Real-time validation hook
export const useFormValidation = (initialData: any, validationRules: FieldValidation) => {
  const [data, setData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validate field on change
  const validateFieldOnChange = (fieldName: string, value: any) => {
    const rule = validationRules[fieldName];
    if (rule) {
      const result = validateField(value, rule);
      setErrors(prev => ({
        ...prev,
        [fieldName]: result.isValid ? '' : result.error!
      }));
    }
  };

  // Handle field change
  const handleChange = (fieldName: string, value: any) => {
    setData(prev => ({ ...prev, [fieldName]: value }));
    
    // Only validate if field has been touched
    if (touched[fieldName]) {
      validateFieldOnChange(fieldName, value);
    }
  };

  // Handle field blur
  const handleBlur = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    validateFieldOnChange(fieldName, data[fieldName]);
  };

  // Validate entire form
  const validateAll = () => {
    const formErrors = validateForm(data, validationRules);
    setErrors(formErrors);
    setTouched(Object.keys(validationRules).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
    return Object.keys(formErrors).length === 0;
  };

  // Reset form
  const reset = (newData?: any) => {
    setData(newData || initialData);
    setErrors({});
    setTouched({});
  };

  return {
    data,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    isValid: Object.keys(errors).length === 0
  };
};

// Predefined validation rules for common fields
export const COMMON_VALIDATION_RULES = {
  // User fields
  firstName: { required: true, minLength: 2, maxLength: 50 },
  lastName: { required: true, minLength: 1, maxLength: 50 },
  email: { required: true, type: 'email', maxLength: 100 },
  password: { required: true, minLength: 3, maxLength: 40 },
  phone: { type: 'phone', maxLength: 20 },

  // Device fields
  deviceName: { required: true, maxLength: 100 },
  location: { required: true, maxLength: 200 },
  manufacturer: { required: true, maxLength: 100 },
  model: { required: true, maxLength: 100 },
  description: { maxLength: 1000 },
  ipAddress: { type: 'ip' },
  port: { type: 'port' },

  // MQTT fields
  mqttBroker: { type: 'url' },
  mqttTopic: { pattern: /^[a-zA-Z0-9\/\-\_]+$/ },
  mqttUsername: { maxLength: 100 },
  mqttPassword: { maxLength: 255 },

  // HTTP fields
  httpEndpoint: { type: 'url' },
  httpMethod: { pattern: /^(GET|POST|PUT|DELETE|PATCH)$/ },

  // COAP fields
  coapHost: { type: 'ip' },
  coapPort: { type: 'port' },
  coapPath: { pattern: /^[a-zA-Z0-9\/\-\_]+$/ },

  // Notification fields
  templateName: { required: true, maxLength: 100 },
  templateTitle: { required: true, maxLength: 200 },
  templateMessage: { required: true, maxLength: 1000 },
  description: { maxLength: 500 },

  // Rule fields
  ruleName: { required: true, maxLength: 100 },
  ruleDescription: { maxLength: 500 },
  metric: { required: true, maxLength: 100 },
  operator: { required: true, pattern: /^(GREATER_THAN|LESS_THAN|EQUALS|GREATER_THAN_OR_EQUAL|LESS_THAN_OR_EQUAL)$/ },
  conditionValue: { required: true, maxLength: 255 },

  // Maintenance fields
  taskName: { required: true, maxLength: 255 },
  maintenanceDescription: { required: true, maxLength: 1000 },
  frequency: { required: true, maxLength: 100 },
  nextMaintenance: { required: true },
  estimatedDuration: { maxLength: 100 },
  requiredTools: { maxLength: 500 },
  safetyNotes: { maxLength: 1000 },

  // Safety fields
  safetyTitle: { required: true, maxLength: 255 },
  safetyDescription: { required: true, maxLength: 1000 },
  type: { required: true, pattern: /^(warning|procedure|caution|note)$/ },
  category: { required: true, maxLength: 100 },
  severity: { required: true, pattern: /^(LOW|MEDIUM|HIGH|CRITICAL)$/ },
  recommendedAction: { maxLength: 1000 },
  aboutReaction: { maxLength: 1000 },
  causes: { maxLength: 1000 },
  howToAvoid: { maxLength: 1000 },
  safetyInfo: { maxLength: 1000 },

  // Conversation config fields
  platformName: { required: true, maxLength: 100 },
  platformType: { required: true, pattern: /^(slack|discord|telegram|whatsapp|gmail|teams|google_chat|sms)$/ },
  botToken: { required: true, pattern: /^xoxb-[A-Za-z0-9-]+$/ },
  channelId: { required: true, pattern: /^[A-Z0-9]+$/ },
  webhookUrl: { required: true, type: 'url' },
  chatId: { required: true, pattern: /^-?[0-9]+$/ },
  accessToken: { required: true, pattern: /^EAA/ },
  phoneNumberId: { required: true, pattern: /^[0-9]+$/ },
  recipientPhone: { required: true, pattern: /^[0-9]+$/ },
  accountSid: { required: true, pattern: /^AC[a-f0-9]{32}$/ },
  authToken: { required: true, minLength: 10 },
  fromNumber: { required: true, pattern: /^\+[0-9]+$/ },
  toNumber: { required: true, pattern: /^\+[0-9]+$/ }
};

// Import React hooks
import { useState } from 'react';
