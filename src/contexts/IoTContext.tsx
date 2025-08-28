import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { deviceAPI, ruleAPI, notificationAPI } from '../services/api';
import { unifiedOnboardingService } from '../services/unifiedOnboardingService';
import { getApiConfig } from '../config/api';
import { logInfo, logError, logWarn } from '../utils/logger';
import { Device, Rule, Notification, TelemetryData, Status } from '../types';
import { tokenService } from '../services/tokenService';
import NotificationService from '../services/notificationService';
import { websocketService } from '../services/websocketService';
import { useAuth } from './AuthContext';

interface IoTContextType {
  devices: Device[];
  rules: Rule[];
  notifications: Notification[];
  telemetryData: TelemetryData[];
  loading: boolean;
  error: string | null;
  updateDeviceStatus: (deviceId: string, status: Status) => void;
  addNotification: (notification: Notification) => void;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  addTelemetryData: (data: TelemetryData) => Promise<void>;
  createRule: (rule: Partial<Rule>) => Promise<void>;
  updateRule: (id: string, ruleUpdates: Partial<Rule>) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  toggleRule: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
  refreshDevices: () => Promise<void>;
  refreshRules: () => Promise<void>;
  createDevice: (device: Partial<Device>) => Promise<void>;
  assignDeviceToUser: (deviceId: string, userId: string) => Promise<void>;
  deleteDevice: (deviceId: string) => Promise<void>;
}

const IoTContext = createContext<IoTContextType | undefined>(undefined);

export const useIoT = () => {
  const context = useContext(IoTContext);
  if (context === undefined) {
    throw new Error('useIoT must be used within an IoTProvider');
  }
  return context;
};

interface IoTProviderProps {
  children: ReactNode;
}

export const IoTProvider: React.FC<IoTProviderProps> = ({ children }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [telemetryData, setTelemetryData] = useState<TelemetryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user, isLoading: authLoading } = useAuth();
  const notificationService = user ? NotificationService.getInstance() : null;

  // WebSocket connection management
  useEffect(() => {
    if (user?.organizationId) {
      // Set up WebSocket callbacks
      websocketService.setCallbacks({
        onDeviceStatusUpdate: (deviceId: string, status: string, deviceName: string) => {
          logInfo('IoT', 'WebSocket: Device status update received', { deviceId, status, deviceName });
          setDevices((prev: Device[]) => 
            prev.map((device: Device) => 
              device.id === deviceId 
                ? { ...device, status: status as Status }
                : device
            )
          );
        },
        onDeviceCreated: (device: Device) => {
          logInfo('IoT', 'WebSocket: Device created', { deviceId: device.id, deviceName: device.name });
          setDevices((prev: Device[]) => [...prev, device]);
        },
        onDeviceDeleted: (deviceId: string, deviceName: string) => {
          logInfo('IoT', 'WebSocket: Device deleted', { deviceId, deviceName });
          setDevices((prev: Device[]) => prev.filter((device: Device) => device.id !== deviceId));
        },
        onConnectionStatusChange: (connected: boolean) => {
          logInfo('IoT', 'WebSocket connection status changed', { connected });
        }
      });

      // Connect to WebSocket
      websocketService.connect(user.organizationId);

      // Cleanup on unmount
      return () => {
        websocketService.disconnect();
      };
    }
  }, [user?.organizationId]);

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
    logInfo('IoT', 'Starting data loading process');
    setLoading(true);
    setError(null);

    // Removed timeout for better user experience
    
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
      logInfo('IoT', 'Setting loading to false');
      setLoading(false);
    }
  };

  // Note: Removed telemetry simulation to prevent unwanted notifications and data interference

  // Load data only when user changes or component mounts
  useEffect(() => {
    if (user) {
      logInfo('IoT', 'Loading data on user change or mount');
      loadData();
    }
  }, [user]);

  const updateDeviceStatus = async (deviceId: string, status: Status) => {
    logInfo('IoT', 'Updating device status', { deviceId, status });
    
    try {
      // Find the device to get its name for logging
      const device = devices.find(d => d.id === deviceId);
      const deviceName = device?.name || 'Unknown Device';
      const oldStatus = device?.status || 'UNKNOWN';
      
      console.log(`🔄 Updating device status: ${deviceName} (${deviceId}) from ${oldStatus} to ${status}`);
      
      // Validate status value
      const validStatuses = ['ONLINE', 'OFFLINE', 'WARNING', 'ERROR'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
      }
      
      // Update local state immediately for responsive UI (optimistic update)
      setDevices((prev: Device[]) => 
        prev.map((device: Device) => 
          device.id === deviceId 
            ? { 
                ...device, 
                status,
                updatedAt: new Date().toISOString() // Update timestamp immediately
              }
            : device
        )
      );

      // Call backend API to update status using the dedicated status endpoint
      const response = await deviceAPI.updateStatus(deviceId, status);
      
      logInfo('IoT', 'Device status updated successfully', { 
        deviceId, 
        oldStatus, 
        newStatus: status, 
        deviceName,
        responseStatus: response?.status 
      });
      
      
      
      // The WebSocket will handle the real-time broadcast to other clients
      // No need to manually update again as the WebSocket callback will handle it
      
      return response;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      logError('IoT', 'Failed to update device status', error instanceof Error ? error : new Error(`Failed to update device status: ${errorMessage}`));
      
      console.error(`❌ Failed to update device status: ${deviceId} to ${status}`, error);
      
      // Revert local state on error by refreshing devices
      try {
        await refreshDevices();
      } catch (refreshError) {
        logError('IoT', 'Failed to refresh devices after status update error', refreshError instanceof Error ? refreshError : new Error('Unknown error'));
      }
      
      // Throw a more user-friendly error
      throw new Error(`Failed to update device status: ${errorMessage}`);
    }
  };

  const addNotification = (notification: Notification) => {
    logInfo('IoT', 'Adding notification', { notificationId: notification.id, type: notification.type });
    setNotifications((prev: Notification[]) => [notification, ...prev]);
  };

  const addTelemetryData = async (data: TelemetryData) => {
    try {
      logInfo('IoT', 'Adding telemetry data', { deviceId: data.deviceId, timestamp: data.timestamp });
      
      // Send telemetry data to backend
      // Note: getTelemetry method doesn't exist in deviceAPI, using getById instead
      await deviceAPI.getById(data.deviceId);
      
      // Update local state
      setTelemetryData(prev => [...prev.slice(-99), data]);
    } catch (error) {
      logError('IoT', 'Failed to add telemetry data', error instanceof Error ? error : new Error('Unknown error'));
    }
  };

  const createRule = async (rule: Partial<Rule>) => {
    try {
      logInfo('IoT', 'Creating rule', { ruleName: rule.name, deviceId: rule.deviceId });
      const response = await ruleAPI.create(rule);
      logInfo('IoT', 'Rule created successfully', { ruleId: response.data?.id });
      await refreshRules();
    } catch (error) {
      logError('IoT', 'Failed to create rule', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  };

  const updateRule = async (id: string, ruleUpdates: Partial<Rule>) => {
    try {
      logInfo('IoT', 'Updating rule', { ruleId: id, updates: ruleUpdates });
      const response = await ruleAPI.update(id, ruleUpdates);
      logInfo('IoT', 'Rule updated successfully', { ruleId: id });
      await refreshRules();
    } catch (error) {
      logError('IoT', 'Failed to update rule', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  };

  const deleteRule = async (id: string) => {
    try {
      logInfo('IoT', 'Deleting rule', { ruleId: id });
      await ruleAPI.delete(id);
      logInfo('IoT', 'Rule deleted successfully', { ruleId: id });
      await refreshRules();
    } catch (error) {
      logError('IoT', 'Failed to delete rule', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  };

  const toggleRule = async (id: string) => {
    try {
      logInfo('IoT', 'Toggling rule', { ruleId: id });
      const response = await ruleAPI.toggle(id);
      logInfo('IoT', 'Rule toggled successfully', { ruleId: id });
      await refreshRules();
    } catch (error) {
      logError('IoT', 'Failed to toggle rule', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  };

  const refreshData = async () => {
    logInfo('IoT', 'Refreshing all data');
    await loadData();
  };

  const refreshDevices = async () => {
    try {
      logInfo('IoT', 'Refreshing devices');
      const response = await deviceAPI.getAll();
      if (response.data) {
        setDevices(response.data);
        logInfo('IoT', 'Devices refreshed successfully', { count: response.data.length });
      }
    } catch (error) {
      logError('IoT', 'Failed to refresh devices', error instanceof Error ? error : new Error('Unknown error'));
    }
  };

  const refreshRules = async () => {
    try {
      logInfo('IoT', 'Refreshing rules');
      const response = await ruleAPI.getAll();
      if (response.data) {
        setRules(response.data);
        logInfo('IoT', 'Rules refreshed successfully', { count: response.data.length });
      }
    } catch (error) {
      logError('IoT', 'Failed to refresh rules', error instanceof Error ? error : new Error('Unknown error'));
    }
  };

  const createDevice = async (device: Partial<Device>) => {
    try {
      logInfo('IoT', 'Creating device', { deviceName: device.name, deviceType: device.type });
      const response = await deviceAPI.create(device);
      logInfo('IoT', 'Device created successfully', { deviceId: response.data?.id });
      await refreshDevices();
    } catch (error) {
      logError('IoT', 'Failed to create device', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  };

  const assignDeviceToUser = async (deviceId: string, userId: string) => {
    try {
      logInfo('IoT', 'Assigning device to user', { deviceId, userId });
      await deviceAPI.update(deviceId, { assignedUserId: userId });
      logInfo('IoT', 'Device assigned successfully', { deviceId, userId });
      await refreshDevices();
    } catch (error) {
      logError('IoT', 'Failed to assign device to user', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  };

  const deleteDevice = async (deviceId: string) => {
    try {
      logInfo('IoT', 'Deleting device', { deviceId });
      
      
      // Check token before deletion
      const token = tokenService.getToken();

      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      // Validate token before proceeding
      const isValidToken = await tokenService.validateToken();
      
      
      if (!isValidToken) {
        console.warn('⚠️ IoTContext: Token validation failed, attempting token refresh...');
        const refreshedToken = await tokenService.refreshToken();
        if (!refreshedToken) {
          throw new Error('Authentication token is invalid and could not be refreshed. Please log in again.');
        }
        
      }
      
      // First, verify the device exists
      try {

        const deviceCheck = await deviceAPI.getById(deviceId);
        
      } catch (checkError) {
        console.error('❌ IoTContext: Device not found during verification:', checkError);
        throw new Error(`Device not found: ${deviceId}`);
      }
      
      console.log('🔍 IoTContext: Proceeding with device deletion...');
      const response = await deviceAPI.delete(deviceId);
      console.log('✅ IoTContext: Device deletion API call successful:', response);
      logInfo('IoT', 'Device deleted successfully', { deviceId });
      await refreshDevices();
    } catch (error) {
      console.error('❌ IoTContext: Device deletion failed:', error);
      console.error('❌ IoTContext: Error details:', {
        deviceId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        response: error instanceof Error && 'response' in error ? (error as any).response : undefined
      });
      logError('IoT', 'Failed to delete device', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      logInfo('IoT', 'Marking notification as read', { notificationId });
      await notificationAPI.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      
      logInfo('IoT', 'Notification marked as read successfully', { notificationId });
    } catch (error) {
      logError('IoT', 'Failed to mark notification as read', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      logInfo('IoT', 'Marking all notifications as read');
      await notificationAPI.markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      logInfo('IoT', 'All notifications marked as read successfully');
    } catch (error) {
      logError('IoT', 'Failed to mark all notifications as read', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  };

  return (
    <IoTContext.Provider value={{
      devices,
      rules,
      notifications,
      telemetryData,
      loading,
      error,
      updateDeviceStatus,
      addNotification,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      addTelemetryData,
      createRule,
      updateRule,
      deleteRule,
      toggleRule,
      refreshData,
      refreshDevices,
      refreshRules,
      createDevice,
      assignDeviceToUser,
      deleteDevice
    }}>
      {children}
    </IoTContext.Provider>
  );
};