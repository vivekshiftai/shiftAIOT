import React, { createContext, useContext, useState, useEffect } from 'react';
import { deviceAPI, ruleAPI, notificationAPI } from '../services/api';
import { Device, TelemetryData, Rule, Notification } from '../types';
import { useAuth } from './AuthContext';
import NotificationService from '../services/notificationService';

interface IoTContextType {
  devices: Device[];
  telemetryData: TelemetryData[];
  rules: Rule[];
  notifications: Notification[];
  loading: boolean;
  updateDeviceStatus: (deviceId: string, status: Device['status']) => Promise<void>;
  addTelemetryData: (data: TelemetryData) => Promise<void>;
  createRule: (rule: Omit<Rule, 'id' | 'createdAt'>) => Promise<void>;
  updateRule: (id: string, rule: Partial<Rule>) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  toggleRule: (id: string) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  refreshDevices: () => Promise<void>;
  refreshRules: () => Promise<void>;
  addDevice: (device: Omit<Device, 'id'>) => Promise<void>;
  assignDevice: (deviceId: string, userId: string) => Promise<void>;
  evaluateRules: (deviceId: string, telemetryData: TelemetryData) => Promise<void>;
}

const IoTContext = createContext<IoTContextType | undefined>(undefined);

export const useIoT = () => {
  const context = useContext(IoTContext);
  if (!context) {
    throw new Error('useIoT must be used within an IoTProvider');
  }
  return context;
};

interface IoTProviderProps {
  children: React.ReactNode;
}

export const IoTProvider: React.FC<IoTProviderProps> = ({ children }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [telemetryData, setTelemetryData] = useState<TelemetryData[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const notificationService = NotificationService.getInstance();

  // Subscribe to notification service updates
  useEffect(() => {
    const unsubscribe = notificationService.subscribe((newNotifications) => {
      setNotifications(newNotifications);
    });

    return unsubscribe;
  }, [notificationService]);

  // Load data from backend when user is authenticated
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        console.log('IoTContext - No user authenticated, clearing data');
        setDevices([]);
        setRules([]);
        setNotifications([]);
        return;
      }

      setLoading(true);
      try {
        console.log('IoTContext - Loading data from backend for authenticated user');
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('IoTContext - No token found');
          throw new Error('No authentication token');
        }

        // Load all data from backend
        const [devicesRes, rulesRes, notificationsRes] = await Promise.all([
          deviceAPI.getAll(),
          ruleAPI.getAll(),
          notificationAPI.getAll()
        ]);

        console.log('IoTContext - Data loaded from backend:', {
          devices: devicesRes.data.length,
          rules: rulesRes.data.length,
          notifications: notificationsRes.data.length
        });

        setDevices(devicesRes.data);
        setRules(rulesRes.data);
        setNotifications(notificationsRes.data);
      } catch (error) {
        console.error('IoTContext - Failed to load data from backend:', error);
        // Clear data on error - don't use mock data
        setDevices([]);
        setRules([]);
        setNotifications([]);
        throw new Error(`Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]); // Dependency on user

  // Simulate real-time telemetry data and evaluate rules
  useEffect(() => {
    if (!user || devices.length === 0) return;

    const interval = setInterval(async () => {
      const randomDevice = devices[Math.floor(Math.random() * devices.length)];
      if (randomDevice.status === 'online') {
        const newData: TelemetryData = {
          id: Math.random().toString(36).substr(2, 9), // Generate a random ID
          deviceId: randomDevice.id,
          timestamp: new Date().toISOString(),
          metrics: {
            temperature: 20 + Math.random() * 15,
            humidity: 40 + Math.random() * 30,
            pressure: 100 + Math.random() * 50
          }
        };

        // Add telemetry data to backend
        try {
          await addTelemetryData(newData);
        } catch (error) {
          console.error('Failed to add telemetry data:', error);
        }

        // Evaluate rules with new telemetry data
        try {
          await evaluateRules(randomDevice.id, newData);
        } catch (error) {
          console.error('Failed to evaluate rules:', error);
        }

        // Check for alerts and create notifications
        if (newData.metrics.temperature > 30) {
          notificationService.onTemperatureAlert(randomDevice, newData.metrics.temperature, user?.id || '1');
        }

        if (randomDevice.batteryLevel && randomDevice.batteryLevel < 20) {
          notificationService.onBatteryLow(randomDevice, randomDevice.batteryLevel, user?.id || '1');
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [devices, rules, user]);

  const updateDeviceStatus = async (deviceId: string, status: Device['status']) => {
    try {
      console.log('IoTContext - Updating device status:', deviceId, status);
      
      // Update status in backend first
      const response = await deviceAPI.updateStatus(deviceId, status);
      const updatedDevice = response.data;
      
      console.log('IoTContext - Device status updated in backend');
      
      // Update local state with the device returned from backend
      setDevices(prev => prev.map(device => 
        device.id === deviceId ? updatedDevice : device
      ));
      
      // Send notification for status change
      if (user?.id) {
        const device = devices.find(d => d.id === deviceId);
        if (device) {
          notificationService.onDeviceStatusChange(device, user.id);
        }
      }
    } catch (error) {
      console.error('Failed to update device status in backend:', error);
      // Don't update local state if backend fails
      throw new Error(`Failed to update device status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const addTelemetryData = async (data: TelemetryData) => {
    try {
      // Send telemetry data to backend
      await deviceAPI.postTelemetry(data.deviceId, data);
      
      // Update local state
      setTelemetryData(prev => [...prev.slice(-99), data]);
    } catch (error) {
      console.error('Failed to add telemetry data:', error);
      throw error;
    }
  };

  const createRule = async (rule: Omit<Rule, 'id' | 'createdAt'>) => {
    try {
      const response = await ruleAPI.create(rule);
      setRules(prev => [...prev, response.data]);
    } catch (error) {
      console.error('Failed to create rule:', error);
      throw error;
    }
  };

  const updateRule = async (id: string, ruleUpdates: Partial<Rule>) => {
    try {
      const response = await ruleAPI.update(id, ruleUpdates);
      setRules(prev => 
        prev.map(rule => 
          rule.id === id ? { ...rule, ...response.data } : rule
        )
      );
    } catch (error) {
      console.error('Failed to update rule:', error);
      throw error;
    }
  };

  const deleteRule = async (id: string) => {
    try {
      await ruleAPI.delete(id);
      setRules(prev => prev.filter(rule => rule.id !== id));
    } catch (error) {
      console.error('Failed to delete rule:', error);
      throw error;
    }
  };

  const toggleRule = async (id: string) => {
    try {
      const response = await ruleAPI.toggle(id);
      setRules(prev => 
        prev.map(rule => 
          rule.id === id ? { ...rule, active: response.data.active } : rule
        )
      );
    } catch (error) {
      console.error('Failed to toggle rule:', error);
      throw error;
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      notificationService.markAsRead(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  };

  const refreshDevices = async () => {
    try {
      console.log('IoTContext - Refreshing devices from backend');
      
      const response = await deviceAPI.getAll();
      const freshDevices = response.data;
      
      console.log('IoTContext - Loaded', freshDevices.length, 'devices from backend');
      
      setDevices(freshDevices);
    } catch (error) {
      console.error('Failed to refresh devices from backend:', error);
      throw new Error(`Failed to refresh devices: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const refreshRules = async () => {
    try {
      const response = await ruleAPI.getAll();
      setRules(response.data);
    } catch (error) {
      console.error('Failed to refresh rules:', error);
      throw error;
    }
  };

  const addDevice = async (device: Omit<Device, 'id'>) => {
    try {
      console.log('IoTContext - Adding device to backend:', device.name);
      
      // First, try to create device in backend
      const response = await deviceAPI.create(device);
      const newDevice = response.data;
      
      console.log('IoTContext - Device created in backend:', newDevice.id);
      
      // Update local state with the device returned from backend
      setDevices(prev => [...prev, newDevice]);
      
      // Send notification for new device
      if (user?.id) {
        notificationService.onDeviceAdded(newDevice, user.id);
      }
      
      return newDevice;
    } catch (error) {
      console.error('Failed to add device to backend:', error);
      // Don't update local state if backend fails
      throw new Error(`Failed to create device: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const assignDevice = async (deviceId: string, userId: string) => {
    try {
      // Update device assignment in backend
      await deviceAPI.update(deviceId, { assignedUserId: userId });
      
      const device = devices.find(d => d.id === deviceId);
      if (device) {
        notificationService.onDeviceAssigned(device, userId);
      }
    } catch (error) {
      console.error('Failed to assign device:', error);
      throw error;
    }
  };

  const evaluateRules = async (deviceId: string, telemetryData: TelemetryData) => {
    try {
      const activeRules = rules.filter(rule => rule.active);
      
      for (const rule of activeRules) {
        const triggered = rule.conditions.every(condition => {
          if (condition.type === 'telemetry_threshold') {
            const value = telemetryData.metrics[condition.metric || ''];
            if (value === undefined) return false;
            
            const threshold = parseFloat(condition.value.toString());
            switch (condition.operator) {
              case '>': return value > threshold;
              case '<': return value < threshold;
              case '=': return value === threshold;
              case '>=': return value >= threshold;
              case '<=': return value <= threshold;
              default: return false;
            }
          }
          return false;
        });

        if (triggered) {
          // Update rule with last triggered timestamp in backend
          await updateRule(rule.id, { lastTriggered: new Date().toISOString() });

          // Create notification for triggered rule
          if (user?.id) {
            notificationService.createNotification({
              type: 'rule_triggered',
              userId: user.id,
              data: {
                ruleName: rule.name,
                message: rule.description
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to evaluate rules:', error);
      throw error;
    }
  };

  return (
    <IoTContext.Provider value={{
      devices,
      telemetryData,
      rules,
      notifications,
      loading,
      updateDeviceStatus,
      addTelemetryData,
      createRule,
      updateRule,
      deleteRule,
      toggleRule,
      markNotificationAsRead,
      refreshDevices,
      refreshRules,
      addDevice,
      assignDevice,
      evaluateRules
    }}>
      {children}
    </IoTContext.Provider>
  );
};