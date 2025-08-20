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

// Device Types
export interface Device {
  id: string;
  name: string;
  type: 'SENSOR' | 'ACTUATOR' | 'GATEWAY' | 'CONTROLLER';
  status: 'ONLINE' | 'OFFLINE' | 'WARNING' | 'ERROR';
  location: string;
  protocol: 'MQTT' | 'HTTP' | 'COAP';
  firmware: string;
  tags: string[];
  manufacturer: string;
  model: string;
  serialNumber: string;
  macAddress: string;
  ipAddress: string;
  port: number;
  description: string;
  installationNotes: string;
  maintenanceSchedule: string;
  warrantyInfo: string;
  wifiSsid: string;
  mqttBroker: string;
  mqttTopic: string;
  powerSource: string;
  powerConsumption: number;
  operatingTemperatureMin: number;
  operatingTemperatureMax: number;
  operatingHumidityMin: number;
  operatingHumidityMax: number;
  createdAt: string;
  updatedAt: string;
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
  title: string;
  description: string;
  type: 'PREVENTIVE' | 'CORRECTIVE' | 'PREDICTIVE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assignedTo?: string;
  deviceId?: string;
  scheduledDate: string;
  completedDate?: string;
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