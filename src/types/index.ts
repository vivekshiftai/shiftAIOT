// User Types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ADMIN' | 'USER';
  organizationId: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

// Device Types - Updated to match backend schema
export interface Device {
  id: string;
  name: string;
  type: 'SENSOR' | 'ACTUATOR' | 'GATEWAY' | 'CONTROLLER';
  status: 'ONLINE' | 'OFFLINE' | 'WARNING' | 'ERROR';
  location: string;
  protocol: 'MQTT' | 'HTTP' | 'COAP';
  organizationId: string;
  assignedUserId?: string;
  assignedBy?: string;
  createdAt: string;
  updatedAt: string;
  
  // Basic device info (optional)
  manufacturer?: string;
  model?: string;
  description?: string;
  
  // Connection details (optional)
  ipAddress?: string;
  port?: number;
  
  // MQTT specific fields (optional)
  mqttBroker?: string;
  mqttTopic?: string;
  mqttUsername?: string;
  mqttPassword?: string;
  
  // HTTP specific fields (optional)
  httpEndpoint?: string;
  httpMethod?: string;
  httpHeaders?: string;
  
  // COAP specific fields (optional)
  coapHost?: string;
  coapPort?: number;
  coapPath?: string;
  
  // Collections (optional)
  tags?: string[];
  config?: Record<string, string>;
}

// Notification Types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'READ' | 'UNREAD';
  createdAt: string;
  updatedAt: string;
  userId?: string;
  deviceId?: string;
}

// Rule Types
export interface Rule {
  id: string;
  name: string;
  description: string;
  metric?: string;
  metricValue?: string;
  threshold?: string;
  consequence?: string;
  condition: string;
  action: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'ACTIVE' | 'INACTIVE';
  category: string;
  createdAt: string;
  updatedAt: string;
  deviceId?: string;
}

// Maintenance Types
export interface MaintenanceTask {
  id: string;
  taskName: string;
  description: string;
  deviceName?: string;
  componentName?: string;
  maintenanceType?: 'PREVENTIVE' | 'CORRECTIVE' | 'PREDICTIVE' | 'GENERAL';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'PENDING' | 'COMPLETED' | 'CANCELLED';
  assignedTo?: string;
  deviceId?: string;
  lastMaintenance?: string;
  nextMaintenance: string;
  estimatedDuration?: string;
  requiredTools?: string;
  safetyNotes?: string;
  estimatedCost?: number;
  frequency: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

// Analytics Types
export interface AnalyticsData {
  deviceId: string;
  timestamp: string;
  temperature?: number;
  humidity?: number;
  pressure?: number;
  voltage?: number;
  current?: number;
  power?: number;
  status: string;
}

// Telemetry Data Types
export interface TelemetryData {
  id: string;
  deviceId: string;
  timestamp: string;
  metrics: Record<string, number>;
  location?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// Form Types
export interface FileUpload {
  file: File;
  type: 'manual' | 'datasheet' | 'certificate';
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export interface AIGeneratedRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  action: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  isSelected: boolean;
}

// Error Types
export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

// Generic Types
export type Status = 'ONLINE' | 'OFFLINE' | 'WARNING' | 'ERROR';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
export type DeviceType = 'SENSOR' | 'ACTUATOR' | 'GATEWAY' | 'CONTROLLER';
export type Protocol = 'MQTT' | 'HTTP' | 'COAP';
export type UserRole = 'ADMIN' | 'USER';

// Device Connection Types
export interface DeviceConnection {
  id: string;
  deviceId: string;
  connectionType: 'MQTT' | 'HTTP' | 'WEBSOCKET' | 'COAP' | 'TCP' | 'UDP';
  status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR';
  brokerUrl?: string;
  username?: string;
  password?: string;
  topic?: string;
  port?: number;
  apiKey?: string;
  webhookUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceSafetyPrecaution {
  id: string;
  deviceId: string;
  title: string;
  description: string;
  type: 'warning' | 'procedure' | 'caution' | 'note';
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedAction?: string;
  aboutReaction?: string;
  causes?: string;
  howToAvoid?: string;
  safetyInfo?: string;
  isActive: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}