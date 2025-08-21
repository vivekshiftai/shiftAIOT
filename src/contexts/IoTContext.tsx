import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { deviceAPI, ruleAPI, notificationAPI, maintenanceAPI } from '../services/api';
import { useAuth } from './AuthContext';
import NotificationService from '../services/notificationService';
import { Device, Rule, Notification, TelemetryData, Status } from '../types';
import { getApiConfig } from '../config/api';
import { tokenService } from '../services/tokenService';
import { logInfo, logWarn, logError, logComponentMount, logComponentError } from '../utils/logger';

interface IoTContextType {
  devices: Device[];
  telemetryData: TelemetryData[];
  rules: Rule[];
  notifications: Notification[];
  loading: boolean;
  updateDeviceStatus: (deviceId: string, status: Status) => Promise<void>;
  addTelemetryData: (data: TelemetryData) => Promise<void>;
  createRule: (rule: Omit<Rule, 'id' | 'createdAt'>) => Promise<void>;
  updateRule: (id: string, rule: Partial<Rule>) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  toggleRule: (id: string) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  refreshDevices: () => Promise<void>;
  refreshRules: () => Promise<void>;
  refreshMaintenance: () => Promise<void>;
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
      logInfo('IoT', 'No user or notification service, skipping notification load');
      return;
    }

    const loadNotifications = async () => {
      try {
        await notificationService.loadFromDatabase();
      } catch (error) {
        logError('IoT', 'Failed to load notifications', error instanceof Error ? error : new Error('Unknown error'));
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
    logInfo('IoT', `useEffect triggered, user: ${user ? 'exists' : 'null'}, authLoading: ${authLoading}`);
    
    // If AuthContext is still loading, keep IoTContext in loading state
    if (authLoading) {
      logInfo('IoT', 'AuthContext still loading, keeping IoTContext in loading state');
      setLoading(true);
      return;
    }

    // AuthContext has finished loading, now check if we have a user
    if (!user) {
      logInfo('IoT', 'No user after auth finished loading, setting loading to false and skipping data load');
      setLoading(false);
      setDevices([]);
      setRules([]);
      setNotifications([]);
      setTelemetryData([]);
      return;
    }

    // We have a user, check if user has valid token
    const token = localStorage.getItem('token');
    logInfo('IoT', `Token check: ${token ? 'exists' : 'not found'}`);
    
    if (!token) {
      logInfo('IoT', 'No token found, setting loading to false and skipping data load');
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
        const isValid = await tokenService.validateToken();
        
        if (!isValid) {
          logWarn('IoT', 'Token validation failed, but continuing with data load attempt');
          // Don't skip data load, try anyway with existing token
          setLoading(true);
          await loadData();
          return;
        }
        
        // Token is valid, proceed with data loading
        logInfo('IoT', 'Token validated, starting data load');
        setLoading(true);
        await loadData();
      } catch (error) {
        logError('IoT', 'Token validation failed', error instanceof Error ? error : new Error('Unknown error'));
        // Don't stop loading, try to load data anyway
        logInfo('IoT', 'Attempting data load despite token validation failure');
        setLoading(true);
        await loadData();
      }
    };

    validateAndLoadData();
  }, [user, authLoading]); // Add authLoading dependency to wait for AuthContext

  const loadData = async () => {
    logInfo('IoT', 'Loading data from backend');
    setLoading(true);
    
    // Add a timeout to prevent getting stuck in loading state
    const timeoutId = setTimeout(() => {
      logInfo('IoT', 'Loading timeout, setting loading to false');
      setLoading(false);
    }, 10000); // 10 second timeout
    
    try {
      // Load all data from backend independently to handle partial failures
      logInfo('IoT', 'Starting to load data from backend...');
      
      // Load devices first (most important)
      try {
        logInfo('IoT', 'About to call deviceAPI.getAll()');
        logInfo('IoT', `Current API base URL: ${getApiConfig().BACKEND_BASE_URL}`);
        logInfo('IoT', `Current token: ${localStorage.getItem('token') ? 'exists' : 'not found'}`);
        
        const devicesRes = await deviceAPI.getAll();
        logInfo('IoT', 'Raw device response', devicesRes);
        
        if (devicesRes.data) {
          logInfo('IoT', 'Setting devices', devicesRes.data);
          setDevices(devicesRes.data);
        } else {
          logInfo('IoT', 'No devices data in response');
          setDevices([]);
        }
      } catch (error: unknown) {
        logError('IoT', 'Failed to load devices', error instanceof Error ? error : new Error('Unknown error'));
        setDevices([]);
      }

      // Load rules (optional) - skip if endpoint doesn't exist
      try {
        const rulesRes = await ruleAPI.getAll();
        logInfo('IoT', 'Raw rules response', rulesRes);
        
        if (rulesRes.data) {
          setRules(rulesRes.data);
        } else {
          setRules([]);
        }
      } catch (error: any) {
        // Don't log 401 errors as they're expected when token is invalid
        if (error.response?.status !== 401) {
          logError('IoT', 'Failed to load rules', error);
        }
        setRules([]);
      }

      // Load notifications (optional) - skip if endpoint doesn't exist
      try {
        const notificationsRes = await notificationAPI.getAll();
        logInfo('IoT', 'Raw notifications response', notificationsRes);
        
        if (notificationsRes.data) {
          setNotifications(notificationsRes.data);
        } else {
          setNotifications([]);
        }
      } catch (error: unknown) {
        logError('IoT', 'Failed to load notifications', error instanceof Error ? error : new Error('Unknown error'));
        setNotifications([]);
      }

      logInfo('IoT', 'Data loading completed');
    } catch (error) {
      logError('IoT', 'Failed to load data from backend', error instanceof Error ? error : new Error('Unknown error'));
      // Don't set any dummy data - let the UI show empty state if no data
      logInfo('IoT', 'No data loaded from backend, showing empty state');
    } finally {
      clearTimeout(timeoutId);
      logInfo('IoT', 'Setting loading to false');
      setLoading(false);
    }
  };

  // Note: Removed telemetry simulation to prevent unwanted notifications and data interference

  // Note: Removed periodic device refresh to prevent interference with database data

  const updateDeviceStatus = (deviceId: string, status: Status) => {
    setDevices((prev: Device[]) => 
      prev.map((device: Device) => 
        device.id === deviceId ? { ...device, status } : device
      )
    );
  };

  const addNotification = (notification: Notification) => {
    setNotifications((prev: Notification[]) => [notification, ...prev]);
  };

  const addTelemetryData = async (data: TelemetryData) => {
    try {
      // Send telemetry data to backend
      await deviceAPI.postTelemetry(data.deviceId, data);
      
      // Update local state
      setTelemetryData(prev => [...prev.slice(-99), data]);
    } catch (error) {
      logError('IoT', 'Failed to add telemetry data', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  };

  const createRule = async (rule: Omit<Rule, 'id' | 'createdAt'>) => {
    try {
      const response = await ruleAPI.create(rule);
      setRules(prev => [...prev, response.data]);
    } catch (error) {
      logError('IoT', 'Failed to create rule', error instanceof Error ? error : new Error('Unknown error'));
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
      logError('IoT', 'Failed to update rule', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  };

  const deleteRule = async (id: string) => {
    try {
      await ruleAPI.delete(id);
      setRules(prev => prev.filter(rule => rule.id !== id));
    } catch (error) {
      logError('IoT', 'Failed to delete rule', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  };

  const toggleRule = async (id: string) => {
    try {
      const response = await ruleAPI.toggle(id);
      setRules(prev => 
        prev.map(rule => 
          rule.id === id ? { ...rule, status: response.data.status } : rule
        )
      );
    } catch (error) {
      logError('IoT', 'Failed to toggle rule', error instanceof Error ? error : new Error('Unknown error'));
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
      logError('IoT', 'Failed to mark notification as read', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  };

  const refreshDevices = async () => {
    try {
      logInfo('IoT', 'Refreshing devices from backend');
      
      const response = await deviceAPI.getAll();
      const freshDevices = response.data;
      
      logInfo('IoT', `Loaded ${freshDevices.length} devices from backend`);
      
      setDevices(freshDevices);
    } catch (error) {
      logError('IoT', 'Failed to refresh devices from backend', error instanceof Error ? error : new Error('Unknown error'));
      throw new Error(`Failed to refresh devices: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const refreshRules = async () => {
    try {
      const response = await ruleAPI.getAll();
      setRules(response.data);
    } catch (error) {
      logError('IoT', 'Failed to refresh rules', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  };

  const refreshMaintenance = async () => {
    try {
      // This function can be used to refresh maintenance data
      // For now, we'll just refresh devices which might include maintenance info
      await refreshDevices();
    } catch (error) {
      logError('IoT', 'Failed to refresh maintenance', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  };

  const addDevice = async (device: Omit<Device, 'id'>) => {
    try {
      logInfo('IoT', `Adding device to backend: ${device.name}`);
      
      // First, try to create device in backend
      const response = await deviceAPI.create(device);
      const newDevice = response.data;
      
      logInfo('IoT', `Device created in backend: ${newDevice.id}`);
      
      // Refresh the entire device list to ensure consistency
      await refreshDevices();
      
      // Note: Removed automatic device added notifications to prevent unwanted notifications
      
      return newDevice;
    } catch (error) {
      logError('IoT', 'Failed to add device to backend', error instanceof Error ? error : new Error('Unknown error'));
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
      logError('IoT', 'Failed to assign device', error instanceof Error ? error : new Error('Unknown error'));
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
      logError('IoT', 'Failed to evaluate rules', error instanceof Error ? error : new Error('Unknown error'));
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
      refreshMaintenance,
      addDevice,
      assignDevice,
      evaluateRules
    }}>
      {children}
    </IoTContext.Provider>
  );
};