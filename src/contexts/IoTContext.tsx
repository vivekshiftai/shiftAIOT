import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { deviceAPI, ruleAPI, notificationAPI } from '../services/api';
// import { unifiedOnboardingService } from '../services/unifiedOnboardingService'; // Not used in this context
import { getApiConfig } from '../config/api';
import { logInfo, logError, logWarn } from '../utils/logger';
import { Device, Rule, Notification, TelemetryData, Status } from '../types';
import { tokenService } from '../services/tokenService';
import { NotificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';
import { cacheService, CacheConfigs } from '../utils/cacheService';

interface IoTContextType {
  devices: Device[];
  rules: Rule[];
  notifications: Notification[];
  telemetryData: TelemetryData[];
  loading: boolean;
  error: string | null;
  isOnboarding: boolean;
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
  clearCache: () => void;
  createDevice: (device: Partial<Device>) => Promise<void>;
  assignDeviceToUser: (deviceId: string, userId: string) => Promise<void>;
  deleteDevice: (deviceId: string) => Promise<void>;
  setOnboardingState: (isOnboarding: boolean) => void;
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
  const [isOnboarding, setIsOnboarding] = useState(false);
  
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

  // Load data from backend when user is authenticated - only once per user session
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates if component unmounts
    
    logInfo('IoT', `useEffect triggered, user: ${user ? 'exists' : 'null'}, authLoading: ${authLoading}`);
    
    // If AuthContext is still loading, keep IoTContext in loading state
    if (authLoading) {
      logInfo('IoT', 'AuthContext still loading, keeping IoTContext in loading state');
      if (isMounted) setLoading(true);
      return;
    }

    // AuthContext has finished loading, now check if we have a user
    if (!user) {
      logInfo('IoT', 'No user after auth finished loading, setting loading to false and skipping data load');
      if (isMounted) {
        setLoading(false);
        setDevices([]);
        setRules([]);
        setNotifications([]);
        setTelemetryData([]);
      }
      return;
    }

    // We have a user, check if user has valid token
    const token = localStorage.getItem('token');
    logInfo('IoT', `Token check: ${token ? 'exists' : 'not found'}`);
    
    if (!token) {
      logInfo('IoT', 'No token found, setting loading to false and skipping data load');
      if (isMounted) {
        setLoading(false);
        setDevices([]);
        setRules([]);
        setNotifications([]);
        setTelemetryData([]);
      }
      return;
    }

    // Validate token before making API calls
    const validateAndLoadData = async () => {
      try {
        const isValid = await tokenService.validateToken();
        
        if (!isValid) {
          logWarn('IoT', 'Token validation failed, but continuing with data load attempt');
          // Don't skip data load, try anyway with existing token
          if (isMounted) setLoading(true);
          if (isMounted) await loadData();
          return;
        }
        
        // Token is valid, proceed with data loading
        logInfo('IoT', 'Token validated, starting data load');
        if (isMounted) setLoading(true);
        if (isMounted) await loadData();
      } catch (error) {
        logError('IoT', 'Token validation failed', error instanceof Error ? error : new Error('Unknown error'));
        // Don't stop loading, try to load data anyway
        logInfo('IoT', 'Attempting data load despite token validation failure');
        if (isMounted) setLoading(true);
        if (isMounted) await loadData();
      }
    };

    validateAndLoadData();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [user?.id, authLoading]); // Only depend on user.id and authLoading to prevent unnecessary re-runs

  const loadData = async () => {
    // Check if we already have cached data to avoid unnecessary loading
    const hasCachedDevices = cacheService.has(`devices_${user?.id}`);
    const hasCachedRules = cacheService.has(`rules_${user?.id}`);
    
    if (hasCachedDevices && hasCachedRules && devices.length > 0) {
      logInfo('IoT', 'Data already cached and loaded, skipping fetch');
      setLoading(false);
      return;
    }
    
    logInfo('IoT', 'Starting data loading process', { 
      hasCachedDevices, 
      hasCachedRules, 
      devicesLoaded: devices.length > 0 
    });
    setLoading(true);
    setError(null);

    // Add minimum loading time to ensure loading screen is visible
    const startTime = Date.now();
    const minLoadingTime = 800; // 800ms minimum loading time
    
    try {
      // Load all data from backend independently to handle partial failures
      logInfo('IoT', 'Starting to load data from backend...');
      
      // Load devices first (most important) with caching
      try {
        logInfo('IoT', 'Loading devices with cache...');
        
        const devicesRes = await cacheService.cachedApiCall(
          `devices_${user?.id}`,
          () => deviceAPI.getAll(),
          CacheConfigs.MEDIUM // 5 minute cache
        );
        
        logInfo('IoT', 'Devices loaded (cached or fresh)', devicesRes);
        
        if (devicesRes.data) {
          // Deduplicate devices by ID to prevent duplicates
          const uniqueDevices = devicesRes.data.filter((device: Device, index: number, self: Device[]) => 
            index === self.findIndex(d => d.id === device.id)
          );
          logInfo('IoT', 'Deduplicated devices', { original: devicesRes.data.length, unique: uniqueDevices.length });
          setDevices(uniqueDevices);
        } else {
          logInfo('IoT', 'No devices data in response');
          setDevices([]);
        }
      } catch (error: unknown) {
        logError('IoT', 'Failed to load devices', error instanceof Error ? error : new Error('Unknown error'));
        setDevices([]);
      }

      // Load rules (optional) with caching
      try {
        const rulesRes = await cacheService.cachedApiCall(
          `rules_${user?.id}`,
          () => ruleAPI.getAll(),
          CacheConfigs.MEDIUM // 5 minute cache
        );
        
        logInfo('IoT', 'Rules loaded (cached or fresh)', rulesRes);
        
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

      // Load notifications using the notification service with caching and validation
      try {
        if (user?.organizationId && user?.id) {
          // Use the notification service which handles caching and validation
          const notificationService = NotificationService.getInstance();
          await notificationService.loadFromDatabase(user.organizationId, user.id);
          setNotifications(notificationService.getAll());
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
      // Ensure minimum loading time for better UX
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      
      if (remainingTime > 0) {
        logInfo('IoT', `Waiting ${remainingTime}ms to complete minimum loading time`);
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      
      logInfo('IoT', 'Setting loading to false');
      setLoading(false);
    }
  };

  // Note: Removed telemetry simulation to prevent unwanted notifications and data interference

  // Note: Removed duplicate useEffect that was causing double loading
  // Data loading is already handled in the main useEffect above (lines 131-193)

  const updateDeviceStatus = async (deviceId: string, status: Status) => {
    logInfo('IoT', 'Updating device status', { deviceId, status });
    
    try {
      // Find the device to get its name for logging
      const device = devices.find(d => d.id === deviceId);
      const deviceName = device?.name || 'Unknown Device';
      const oldStatus = device?.status || 'UNKNOWN';
      
      
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
      
      
      
      
      return response;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      logError('IoT', `Failed to update device status: ${deviceId} to ${status}`, error instanceof Error ? error : new Error('Unknown error'));
      
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
    logInfo('IoT', 'Adding notification', { notificationId: notification.id });
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
      // Clear rules cache since we added a new rule
      cacheService.remove(`rules_${user?.id}`);
      await refreshRules();
    } catch (error) {
      logError('IoT', 'Failed to create rule', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  };

  const updateRule = async (id: string, ruleUpdates: Partial<Rule>) => {
    try {
      logInfo('IoT', 'Updating rule', { ruleId: id, updates: ruleUpdates });
      await ruleAPI.update(id, ruleUpdates);
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
      await ruleAPI.toggle(id);
      logInfo('IoT', 'Rule toggled successfully', { ruleId: id });
      await refreshRules();
    } catch (error) {
      logError('IoT', 'Failed to toggle rule', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  };

  const clearCache = () => {
    logInfo('IoT', 'Clearing all cache data');
    cacheService.clearAll();
  };

  const refreshData = async () => {
    logInfo('IoT', 'Manually refreshing data - clearing cache first');
    // Clear cache before refreshing to force fresh data
    cacheService.remove(`devices_${user?.id}`);
    cacheService.remove(`rules_${user?.id}`);
    await loadData();
  };

  const refreshDevices = async () => {
    try {
      logInfo('IoT', 'Refreshing devices with navigation-aware caching');
      
      const response = await cacheService.navigationCachedApiCall(
        `devices_${user?.id}`,
        () => deviceAPI.getAll(),
        true // Mark as navigation to use shorter cache
      );
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
      logInfo('IoT', 'Manually refreshing rules - clearing cache first');
      // Clear rules cache before refreshing
      cacheService.remove(`rules_${user?.id}`);
      
      const response = await cacheService.cachedApiCall(
        `rules_${user?.id}`,
        () => ruleAPI.getAll(),
        CacheConfigs.MEDIUM
      );
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
      
      
      // Create notification for device creation
      try {
        const { notificationService } = await import('../services/notificationService');
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (currentUser.id) {
          await notificationService.createNotification({
            type: 'DEVICE_CREATION',
            deviceId: response.data?.id,
            deviceName: device.name || 'Unknown Device',
            userId: currentUser.id,
            data: {
              deviceType: device.type,
              deviceLocation: device.location,
              deviceStatus: device.status
            }
          });
          logInfo('IoT', 'Device creation notification sent successfully');
        }
      } catch (notificationError) {
        logError('IoT', 'Failed to send device creation notification', notificationError instanceof Error ? notificationError : new Error('Unknown notification error'));
        // Don't fail device creation if notification fails
      }
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
        logWarn('IoT', 'Token validation failed, attempting token refresh');
        const refreshedToken = await tokenService.refreshToken();
        if (!refreshedToken) {
          throw new Error('Authentication token is invalid and could not be refreshed. Please log in again.');
        }
      }
      
      // First, verify the device exists
      try {
        await deviceAPI.getById(deviceId);
      } catch (checkError) {
        logError('IoT', 'Device not found during verification', checkError instanceof Error ? checkError : new Error('Unknown error'));
        throw new Error(`Device not found: ${deviceId}. The device may have already been deleted or you don't have access to it.`);
      }
      
      await deviceAPI.delete(deviceId);
      logInfo('IoT', 'Device deleted successfully', { deviceId });
      await refreshDevices();
      
    } catch (error) {
      logError('IoT', 'Device deletion failed', error instanceof Error ? error : new Error('Unknown error'));
      
      // Enhanced error logging
      const errorDetails = {
        deviceId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      };
      
      logError('IoT', 'Failed to delete device', error instanceof Error ? error : new Error('Unknown error'), errorDetails);
      
      // Re-throw with enhanced error message
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(`Failed to delete device: ${String(error)}`);
      }
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      logInfo('IoT', 'Marking notification as read', { notificationId });
      
      if (user?.organizationId && user?.id) {
        // Use the notification service which handles caching
        const notificationService = NotificationService.getInstance();
        await notificationService.markAsRead(notificationId, user.organizationId, user.id);
        setNotifications(notificationService.getAll());
      } else {
        // Fallback to direct API call
        await notificationAPI.markAsRead(notificationId);
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true }
              : notification
          )
        );
      }
      
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
      isOnboarding,
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
      clearCache,
      createDevice,
      assignDeviceToUser,
      deleteDevice,
      setOnboardingState: setIsOnboarding
    }}>
      {children}
    </IoTContext.Provider>
  );
};