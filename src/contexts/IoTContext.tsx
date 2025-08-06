import React, { createContext, useContext, useState, useEffect } from 'react';
import { deviceAPI, ruleAPI, notificationAPI } from '../services/api';
import { Device, TelemetryData, Rule, Notification } from '../types';

interface IoTContextType {
  devices: Device[];
  telemetryData: TelemetryData[];
  rules: Rule[];
  notifications: Notification[];
  updateDeviceStatus: (deviceId: string, status: Device['status']) => void;
  addTelemetryData: (data: TelemetryData) => void;
  createRule: (rule: Omit<Rule, 'id' | 'createdAt'>) => void;
  markNotificationAsRead: (notificationId: string) => void;
}

const IoTContext = createContext<IoTContextType | undefined>(undefined);

export const useIoT = () => {
  const context = useContext(IoTContext);
  if (context === undefined) {
    throw new Error('useIoT must be used within an IoTProvider');
  }
  return context;
};

// Mock data
const mockDevices: Device[] = [
  {
    id: '1',
    name: 'Temperature Sensor A1',
    type: 'sensor',
    status: 'online',
    location: 'Building A - Floor 1',
    lastSeen: '2025-01-13T10:45:00Z',
    batteryLevel: 87,
    temperature: 22.5,
    humidity: 45,
    firmware: 'v1.2.3',
    protocol: 'MQTT',
    tags: ['temperature', 'humidity', 'critical']
  },
  {
    id: '2',
    name: 'Smart Actuator B2',
    type: 'actuator',
    status: 'online',
    location: 'Building B - Floor 2',
    lastSeen: '2025-01-13T10:44:00Z',
    batteryLevel: 92,
    firmware: 'v2.1.0',
    protocol: 'HTTP',
    tags: ['actuator', 'hvac']
  },
  {
    id: '3',
    name: 'IoT Gateway C1',
    type: 'gateway',
    status: 'warning',
    location: 'Building C - Main',
    lastSeen: '2025-01-13T10:40:00Z',
    firmware: 'v3.0.1',
    protocol: 'MQTT',
    tags: ['gateway', 'critical']
  },
  {
    id: '4',
    name: 'Pressure Sensor D1',
    type: 'sensor',
    status: 'error',
    location: 'Factory - Line 1',
    lastSeen: '2025-01-13T09:30:00Z',
    batteryLevel: 12,
    firmware: 'v1.1.8',
    protocol: 'CoAP',
    tags: ['pressure', 'maintenance']
  }
];

const mockRules: Rule[] = [
  {
    id: '1',
    name: 'High Temperature Alert',
    description: 'Alert when temperature exceeds 30°C',
    active: true,
    conditions: [
      {
        id: '1',
        type: 'telemetry_threshold',
        deviceId: '1',
        metric: 'temperature',
        operator: '>',
        value: 30
      }
    ],
    actions: [
      {
        id: '1',
        type: 'notification',
        config: { channels: ['email', 'slack'] }
      }
    ],
    createdAt: '2025-01-10T08:00:00Z'
  }
];

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Device Offline',
    message: 'Pressure Sensor D1 has gone offline',
    type: 'error',
    timestamp: '2025-01-13T09:30:00Z',
    read: false,
    userId: '1'
  },
  {
    id: '2',
    title: 'Low Battery Warning',
    message: 'Pressure Sensor D1 battery level is critically low (12%)',
    type: 'warning',
    timestamp: '2025-01-13T09:25:00Z',
    read: false,
    userId: '1'
  }
];

export const IoTProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [telemetryData, setTelemetryData] = useState<TelemetryData[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const [devicesRes, rulesRes, notificationsRes] = await Promise.all([
          deviceAPI.getAll(),
          ruleAPI.getAll(),
          notificationAPI.getAll()
        ]);

        setDevices(devicesRes.data);
        setRules(rulesRes.data);
        setNotifications(notificationsRes.data);
      } catch (error) {
        console.error('Failed to load data:', error);
        // Fallback to mock data
        setDevices(mockDevices);
        setRules(mockRules);
        setNotifications(mockNotifications);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Simulate real-time telemetry data
  useEffect(() => {
    const interval = setInterval(() => {
      const randomDevice = devices[Math.floor(Math.random() * devices.length)];
      if (randomDevice.status === 'online') {
        const newData: TelemetryData = {
          deviceId: randomDevice.id,
          timestamp: new Date().toISOString(),
          metrics: {
            temperature: 20 + Math.random() * 15,
            humidity: 40 + Math.random() * 30,
            pressure: 100 + Math.random() * 50
          }
        };
        setTelemetryData(prev => [...prev.slice(-99), newData]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [devices]);

  const updateDeviceStatus = async (deviceId: string, status: Device['status']) => {
    try {
      await deviceAPI.updateStatus(deviceId, status.toUpperCase());
      setDevices(prev => 
        prev.map(device => 
          device.id === deviceId 
            ? { ...device, status, lastSeen: new Date().toISOString() }
            : device
        )
      );
    } catch (error) {
      console.error('Failed to update device status:', error);
    }
  };

  const addTelemetryData = (data: TelemetryData) => {
    setTelemetryData(prev => [...prev, data]);
  };

  const createRule = async (rule: Omit<Rule, 'id' | 'createdAt'>) => {
    try {
      const response = await ruleAPI.create(rule);
      setRules(prev => [...prev, response.data]);
    } catch (error) {
      console.error('Failed to create rule:', error);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  return (
    <IoTContext.Provider value={{
      devices,
      telemetryData,
      rules,
      notifications,
      updateDeviceStatus,
      addTelemetryData,
      createRule,
      markNotificationAsRead
    }}>
      {children}
    </IoTContext.Provider>
  );
};