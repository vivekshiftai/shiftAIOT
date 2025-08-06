export interface Device {
  id: string;
  name: string;
  type: 'sensor' | 'actuator' | 'gateway' | 'controller';
  status: 'online' | 'offline' | 'warning' | 'error';
  location: string;
  lastSeen: string;
  batteryLevel?: number;
  temperature?: number;
  humidity?: number;
  firmware: string;
  protocol: 'MQTT' | 'HTTP' | 'CoAP';
  tags: string[];
}

export interface TelemetryData {
  deviceId: string;
  timestamp: string;
  metrics: {
    [key: string]: number;
  };
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  active: boolean;
  conditions: RuleCondition[];
  actions: RuleAction[];
  createdAt: string;
  lastTriggered?: string;
}

export interface RuleCondition {
  id: string;
  type: 'device_status' | 'telemetry_threshold' | 'time_based';
  deviceId?: string;
  metric?: string;
  operator: '>' | '<' | '=' | '>=' | '<=';
  value: string | number;
  logicOperator?: 'AND' | 'OR';
}

export interface RuleAction {
  id: string;
  type: 'notification' | 'device_control' | 'webhook' | 'log';
  config: {
    [key: string]: any;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'org_admin' | 'device_manager' | 'operator' | 'viewer';
  avatar?: string;
  lastLogin: string;
  permissions: string[];
  organizationId?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  read: boolean;
  userId: string;
}

export interface KnowledgeDocument {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'docx';
  uploadedAt: string;
  processedAt?: string;
  size: number;
  status: 'processing' | 'completed' | 'error';
  extractedText?: string;
  vectorized: boolean;
}