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
  // IoT Connection Settings
  mqttBrokerUrl?: string;
  mqttUsername?: string;
  mqttPassword?: string;
  apiKey?: string;
  webhookUrl?: string;
  connectionType?: 'MQTT' | 'HTTP' | 'WEBSOCKET' | 'COAP';
}

export interface Device {
  id: string;
  name: string;
  type: 'SENSOR' | 'ACTUATOR' | 'GATEWAY' | 'CONTROLLER';
  status: 'ONLINE' | 'OFFLINE' | 'WARNING' | 'ERROR';
  location: string;
  lastSeen: string;
  batteryLevel?: number;
  temperature?: number;
  humidity?: number;
  firmware?: string;
  protocol: 'MQTT' | 'HTTP' | 'COAP';
  tags?: string[];
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  macAddress?: string;
  ipAddress?: string;
  port?: number;
  powerSource?: string;
  powerConsumption?: number;
  operatingTemperatureMin?: number;
  operatingTemperatureMax?: number;
  operatingHumidityMin?: number;
  operatingHumidityMax?: number;
  wifiSsid?: string;
  mqttBroker?: string;
  mqttTopic?: string;
  description?: string;
  installationNotes?: string;
  maintenanceSchedule?: string;
  warrantyInfo?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceConnection {
  id: string;
  deviceId: string;
  connectionType: 'MQTT' | 'HTTP' | 'WEBSOCKET' | 'COAP' | 'TCP' | 'UDP';
  brokerUrl?: string;
  username?: string;
  password?: string;
  topic?: string;
  port?: number;
  apiKey?: string;
  webhookUrl?: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR' | 'TIMEOUT';
  lastConnected?: string;
  lastDisconnected?: string;
  config?: Record<string, string>;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TelemetryData {
  id: string;
  deviceId: string;
  timestamp: string;
  metrics: Record<string, number>;
  location?: string;
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  active: boolean;
  conditions: RuleCondition[];
  actions: RuleAction[];
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  lastTriggered?: string;
}

export interface RuleCondition {
  id: string;
  type: 'telemetry_threshold' | 'device_status' | 'time_based';
  deviceId?: string;
  metric?: string;
  operator: '>' | '<' | '=' | '>=' | '<=';
  value: number | string;
  logicOperator?: 'AND' | 'OR';
}

export interface RuleAction {
  id: string;
  type: 'notification' | 'device_control' | 'webhook' | 'log';
  config: Record<string, any>;
}

export interface Notification {
  id?: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  read: boolean;
  userId: string;
  deviceId?: string;
  organizationId?: string;
  createdAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
}

export interface JwtResponse {
  token: string;
  type: string;
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  authorities: string[];
}

export interface DeviceCreateRequest {
  name: string;
  type: 'SENSOR' | 'ACTUATOR' | 'GATEWAY' | 'CONTROLLER';
  location: string;
  protocol: 'MQTT' | 'HTTP' | 'COAP';
  firmware?: string;
  tags?: string[];
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  macAddress?: string;
  ipAddress?: string;
  port?: number;
  powerSource?: string;
  powerConsumption?: number;
  operatingTemperatureMin?: number;
  operatingTemperatureMax?: number;
  operatingHumidityMin?: number;
  operatingHumidityMax?: number;
  wifiSsid?: string;
  mqttBroker?: string;
  mqttTopic?: string;
  description?: string;
  installationNotes?: string;
  maintenanceSchedule?: string;
  warrantyInfo?: string;
}

export interface DeviceConnectionRequest {
  deviceId: string;
  connectionType: 'MQTT' | 'HTTP' | 'WEBSOCKET' | 'COAP';
  brokerUrl?: string;
  username?: string;
  password?: string;
  topic?: string;
  port?: number;
  apiKey?: string;
  webhookUrl?: string;
  connectionConfig?: Record<string, string>;
}

export interface MqttConnectionRequest {
  deviceId: string;
  brokerUrl: string;
  username?: string;
  password?: string;
  topic: string;
  port?: number;
}

export interface HttpConnectionRequest {
  deviceId: string;
  webhookUrl: string;
  apiKey?: string;
}

export interface WebSocketConnectionRequest {
  deviceId: string;
  brokerUrl: string;
  port?: number;
}

export interface CoapConnectionRequest {
  deviceId: string;
  brokerUrl: string;
  port?: number;
}