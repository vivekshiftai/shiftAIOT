import React, { createContext, useContext, useState, useEffect } from 'react';
import { deviceAPI, ruleAPI, notificationAPI, userAPI, authAPI } from '../services/api';
import { Device, TelemetryData, Rule, Notification } from '../types';
import { useAuth } from './AuthContext';
import NotificationService from '../services/notificationService';
import api from '../services/api';
import { ensureValidToken } from '../utils/authUtils';

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
  const [loading, setLoading] = useState(true);
  
  const { user, isLoading: authLoading } = useAuth();
  const notificationService = user ? NotificationService.getInstance() : null;

  // Load notifications from database and subscribe to updates
  useEffect(() => {
    if (!user || !notificationService) {
      console.log('IoTContext - No user or notification service, skipping notification load');
      return;
    }

    const loadNotifications = async () => {
      try {
        await notificationService.loadFromDatabase();
      } catch (error) {
        console.error('IoTContext - Failed to load notifications:', error);
      }
    };

    // Load initial notifications
    loadNotifications();

    // Subscribe to notification service updates
    const unsubscribe = notificationService.subscribe((newNotifications) => {
      setNotifications(newNotifications);
    });

    return unsubscribe;
  }, [notificationService, user]);

  // Load data from backend when user is authenticated
  useEffect(() => {
    console.log('IoTContext - useEffect triggered, user:', user ? 'exists' : 'null', 'authLoading:', authLoading);
    
    // If AuthContext is still loading, keep IoTContext in loading state
    if (authLoading) {
      console.log('IoTContext - AuthContext still loading, keeping IoTContext in loading state');
      setLoading(true);
      return;
    }

    // AuthContext has finished loading, now check if we have a user
    if (!user) {
      console.log('IoTContext - No user after auth finished loading, setting loading to false and skipping data load');
      setLoading(false);
      setDevices([]);
      setRules([]);
      setNotifications([]);
      setTelemetryData([]);
      return;
    }

    // We have a user, check if user has valid token
    const token = localStorage.getItem('token');
    console.log('IoTContext - Token check:', token ? 'exists' : 'not found');
    
    if (!token) {
      console.log('IoTContext - No token found, setting loading to false and skipping data load');
      setLoading(false);
      setDevices([]);
      setRules([]);
      setNotifications([]);
      setTelemetryData([]);
      return;
    }

    // Validate token before making API calls
    const validateAndLoadData = async () => {
      try {
        const isValid = await ensureValidToken();
        
        if (!isValid) {
          console.warn('IoTContext - Token validation failed, but continuing with data load attempt');
          // Don't skip data load, try anyway with existing token
          setLoading(true);
          await loadData();
          return;
        }
        
        // Token is valid, proceed with data loading
        console.log('IoTContext - Token validated, starting data load');
        setLoading(true);
        await loadData();
      } catch (error) {
        console.error('IoTContext - Token validation failed:', error);
        // Don't stop loading, try to load data anyway
        console.log('IoTContext - Attempting data load despite token validation failure');
        setLoading(true);
        await loadData();
      }
    };

    validateAndLoadData();
  }, [user, authLoading]); // Add authLoading dependency to wait for AuthContext

  const loadData = async () => {
    console.log('IoTContext - Loading data from backend');
    setLoading(true);
    
    // Add a timeout to prevent getting stuck in loading state
    const timeoutId = setTimeout(() => {
      console.log('IoTContext - Loading timeout, setting loading to false');
      setLoading(false);
    }, 10000); // 10 second timeout
    
    try {
      // Load all data from backend independently to handle partial failures
      console.log('IoTContext - Starting to load data from backend...');
      
      // Load devices first (most important)
      try {
        const devicesRes = await deviceAPI.getAll();
        console.log('IoTContext - Raw device response:', devicesRes);
        
        if (devicesRes.data) {
          console.log('IoTContext - Setting devices:', devicesRes.data);
          setDevices(devicesRes.data);
        } else {
          console.log('IoTContext - No devices data in response');
          setDevices([]);
        }
      } catch (error) {
        console.error('IoTContext - Failed to load devices:', error);
        setDevices([]);
      }

      // Load rules (optional) - skip if endpoint doesn't exist
      try {
        const rulesRes = await ruleAPI.getAll();
        console.log('IoTContext - Raw rules response:', rulesRes);
        
        if (rulesRes.data) {
          setRules(rulesRes.data);
        } else {
          setRules([]);
        }
      } catch (error: any) {
        // Don't log 401 errors as they're expected when token is invalid
        if (error.response?.status !== 401) {
          console.error('IoTContext - Failed to load rules:', error);
        }
        setRules([]);
      }

      // Load notifications (optional) - skip if endpoint doesn't exist
      try {
        const notificationsRes = await notificationAPI.getAll();
        console.log('IoTContext - Raw notifications response:', notificationsRes);
        
        if (notificationsRes.data) {
          setNotifications(notificationsRes.data);
        } else {
          setNotifications([]);
        }
      } catch (error: any) {
        // Don't log 401 errors as they're expected when token is invalid
        if (error.response?.status !== 401) {
          console.error('IoTContext - Failed to load notifications:', error);
        }
        setNotifications([]);
      }

      console.log('IoTContext - Data loading completed');
    } catch (error) {
      console.error('IoTContext - Failed to load data from backend:', error);
      // Don't set any dummy data - let the UI show empty state if no data
      console.log('IoTContext - No data loaded from backend, showing empty state');
    } finally {
      clearTimeout(timeoutId);
      console.log('IoTContext - Setting loading to false');
      setLoading(false);
    }
  };

  // Note: Removed telemetry simulation to prevent unwanted notifications and data interference

  // Note: Removed periodic device refresh to prevent interference with database data

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
      
      // Note: Removed automatic status change notifications to prevent unwanted notifications
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
      if (notificationService) {
        notificationService.markAsRead(notificationId);
      }
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
      
      // Refresh the entire device list to ensure consistency
      await refreshDevices();
      
      // Note: Removed automatic device added notifications to prevent unwanted notifications
      
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
      if (device && notificationService) {
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

          // Note: Removed automatic rule triggered notifications to prevent unwanted notifications
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