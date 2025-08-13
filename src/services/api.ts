import axios from 'axios';

const API_BASE_URL = import.meta.env.DEV ? '/api' : 'http://20.75.50.202:8100/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    
    // For device endpoints, don't require authentication
    if (config.url?.includes('/devices/') && !config.url?.includes('/auth/')) {
      // Remove any existing Authorization header for device endpoints
      delete config.headers.Authorization;
      return config;
    }
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors and token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.error('API Response Error:', error.response?.status, error.config?.url, error.message);
    
    // Handle 401 errors - just redirect to login without trying to refresh
    if (error.response?.status === 401) {
      console.log('API - 401 Unauthorized, redirecting to login');
      console.log('API - Current pathname:', window.location.pathname);
      
          // Check if we're in the middle of a login process or initial load
    const isLoggingIn = sessionStorage.getItem('isLoggingIn') === 'true';
    const isInitialLoad = sessionStorage.getItem('isInitialLoad') === 'true';
    
    if (isLoggingIn || isInitialLoad) {
      console.log('API - Login or initial load in progress, not redirecting');
      return Promise.reject(error);
    }
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        console.log('API - Removing token and user from localStorage');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        console.log('API - Redirecting to login page');
        window.location.href = '/login';
      } else {
        console.log('API - Already on login page, not redirecting');
      }
    }
    
    // Handle network errors gracefully
    if (!error.response) {
      console.warn('Network error - no response from server');
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) => {
    return api.post('/auth/signin', credentials);
  },
  
  register: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: 'ADMIN' | 'USER';
  }) => {
    return api.post('/auth/signup', userData);
  },
};

// Device API
export const deviceAPI = {
  getAll: (params?: { status?: string; type?: string; search?: string }) => {
    return api.get('/devices', { params });
  },
  
  getById: (id: string) => api.get(`/devices/${id}`),
  
  create: (device: any) => {
    // Ensure device has proper enum values and handle null/undefined values
    const processedDevice = {
      ...device,
      status: device.status?.toUpperCase() || 'ONLINE',
      type: device.type?.toUpperCase() || 'SENSOR',
      protocol: device.protocol?.toUpperCase() || 'MQTT',
      // Ensure all required fields are present
      name: device.name || '',
      location: device.location || '',
      manufacturer: device.manufacturer || '',
      model: device.model || '',
      serialNumber: device.serialNumber || '',
      macAddress: device.macAddress || '',
      ipAddress: device.ipAddress || '',
              port: device.port || 8100,
      firmware: device.firmware || '',
      description: device.description || '',
      installationNotes: device.installationNotes || '',
      maintenanceSchedule: device.maintenanceSchedule || '',
      warrantyInfo: device.warrantyInfo || '',
      powerSource: device.powerSource || '',
      powerConsumption: device.powerConsumption || 0,
      operatingTemperatureMin: device.operatingTemperatureMin || 0,
      operatingTemperatureMax: device.operatingTemperatureMax || 50,
      operatingHumidityMin: device.operatingHumidityMin || 0,
      operatingHumidityMax: device.operatingHumidityMax || 100,
      wifiSsid: device.wifiSsid || '',
      mqttBroker: device.mqttBroker || '',
      mqttTopic: device.mqttTopic || '',
      tags: device.tags || []
    };
    return api.post('/devices', processedDevice);
  },
  
  createWithFiles: (deviceData: any, files: { manual?: File; datasheet?: File; certificate?: File }) => {
    const formData = new FormData();
    
    // Ensure device data has proper enum values and handle null/undefined values
    const processedDeviceData = {
      ...deviceData,
      status: deviceData.status?.toUpperCase() || 'ONLINE',
      type: deviceData.type?.toUpperCase() || 'SENSOR',
      protocol: deviceData.protocol?.toUpperCase() || 'MQTT',
      // Ensure all required fields are present
      name: deviceData.name || '',
      location: deviceData.location || '',
      manufacturer: deviceData.manufacturer || '',
      model: deviceData.model || '',
      serialNumber: deviceData.serialNumber || '',
      macAddress: deviceData.macAddress || '',
      ipAddress: deviceData.ipAddress || '',
      port: deviceData.port || 8100,
      firmware: deviceData.firmware || '',
      description: deviceData.description || '',
      installationNotes: deviceData.installationNotes || '',
      maintenanceSchedule: deviceData.maintenanceSchedule || '',
      warrantyInfo: deviceData.warrantyInfo || '',
      powerSource: deviceData.powerSource || '',
      powerConsumption: deviceData.powerConsumption || 0,
      operatingTemperatureMin: deviceData.operatingTemperatureMin || 0,
      operatingTemperatureMax: deviceData.operatingTemperatureMax || 50,
      operatingHumidityMin: deviceData.operatingHumidityMin || 0,
      operatingHumidityMax: deviceData.operatingHumidityMax || 100,
      wifiSsid: deviceData.wifiSsid || '',
      mqttBroker: deviceData.mqttBroker || '',
      mqttTopic: deviceData.mqttTopic || '',
      tags: deviceData.tags || []
    };
    
    formData.append('deviceData', JSON.stringify(processedDeviceData));
    
    if (files.manual) formData.append('manualFile', files.manual);
    if (files.datasheet) formData.append('datasheetFile', files.datasheet);
    if (files.certificate) formData.append('certificateFile', files.certificate);
    
    return api.post('/devices/with-files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  onboardWithAI: (deviceData: any, files: { manual?: File; datasheet?: File; certificate?: File }, aiRules: any[]) => {
    const formData = new FormData();
    
    // Ensure device data has proper enum values and handle null/undefined values
    const processedDeviceData = {
      ...deviceData,
      status: deviceData.status?.toUpperCase() || 'ONLINE',
      type: deviceData.type?.toUpperCase() || 'SENSOR',
      protocol: deviceData.protocol?.toUpperCase() || 'MQTT',
      // Ensure all required fields are present
      name: deviceData.name || '',
      location: deviceData.location || '',
      manufacturer: deviceData.manufacturer || '',
      model: deviceData.model || '',
      serialNumber: deviceData.serialNumber || '',
      macAddress: deviceData.macAddress || '',
      ipAddress: deviceData.ipAddress || '',
      port: deviceData.port || 8100,
      firmware: deviceData.firmware || '',
      description: deviceData.description || '',
      installationNotes: deviceData.installationNotes || '',
      maintenanceSchedule: deviceData.maintenanceSchedule || '',
      warrantyInfo: deviceData.warrantyInfo || '',
      powerSource: deviceData.powerSource || '',
      powerConsumption: deviceData.powerConsumption || 0,
      operatingTemperatureMin: deviceData.operatingTemperatureMin || 0,
      operatingTemperatureMax: deviceData.operatingTemperatureMax || 50,
      operatingHumidityMin: deviceData.operatingHumidityMin || 0,
      operatingHumidityMax: deviceData.operatingHumidityMax || 100,
      wifiSsid: deviceData.wifiSsid || '',
      mqttBroker: deviceData.mqttBroker || '',
      mqttTopic: deviceData.mqttTopic || '',
      tags: deviceData.tags || []
    };
    
    formData.append('deviceData', JSON.stringify(processedDeviceData));
    
    if (files.manual) formData.append('manualFile', files.manual);
    if (files.datasheet) formData.append('datasheetFile', files.datasheet);
    if (files.certificate) formData.append('certificateFile', files.certificate);
    
    if (aiRules && aiRules.length > 0) {
      formData.append('aiRules', JSON.stringify(aiRules));
    }
    
    return api.post('/devices/onboard-with-ai', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  update: (id: string, device: any) => api.put(`/devices/${id}`, device),
  
  delete: (id: string) => api.delete(`/devices/${id}`),
  
  updateStatus: (id: string, status: string) =>
    api.patch(`/devices/${id}/status`, status, {
      headers: { 'Content-Type': 'text/plain' }
    }),
  
  getTelemetry: (id: string, range: string = '1h') =>
    api.get(`/devices/${id}/telemetry`, { params: { range } }),
  
  postTelemetry: (id: string, data: any) =>
    api.post(`/devices/${id}/telemetry`, data),
  
  getStats: () => api.get('/devices/stats'),
  
  getDocumentation: (id: string) => api.get(`/devices/${id}/documentation`),
  
  downloadDocumentation: (id: string, type: string) => 
    api.get(`/devices/${id}/documentation/${type}`, {
      responseType: 'blob'
    }),
};

// Rule API
export const ruleAPI = {
  getAll: () => api.get('/rules'),
  
  getById: (id: string) => api.get(`/rules/${id}`),
  
  create: (rule: any) => api.post('/rules', rule),
  
  update: (id: string, rule: any) => api.put(`/rules/${id}`, rule),
  
  delete: (id: string) => api.delete(`/rules/${id}`),
  
  toggle: (id: string) => api.patch(`/rules/${id}/toggle`),
};

// Notification API
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  
  create: (notification: any) => api.post('/notifications', notification),
  
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  
  markAllAsRead: () => api.patch('/notifications/read-all'),
  
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

// Device Connection API
export const deviceConnectionAPI = {
  getAll: () => api.get('/device-connections'),
  
  getById: (deviceId: string) => api.get(`/device-connections/${deviceId}`),
  
  create: (connection: any) => api.post('/device-connections', connection),
  
  update: (deviceId: string, connection: any) => api.put(`/device-connections/${deviceId}`, connection),
  
  delete: (deviceId: string) => api.delete(`/device-connections/${deviceId}`),
  
  connect: (deviceId: string) => api.post(`/device-connections/${deviceId}/connect`),
  
  disconnect: (deviceId: string) => api.post(`/device-connections/${deviceId}/disconnect`),
  
  getActive: () => api.get('/device-connections/active'),
  
  getStats: () => api.get('/device-connections/stats'),
};

// User API
export const userAPI = {
  getAll: () => api.get('/users'),
  
  getById: (id: string) => api.get(`/users/${id}`),
  
  update: (id: string, user: any) => api.put(`/users/${id}`, user),
  
  delete: (id: string) => api.delete(`/users/${id}`),
  
  getProfile: () => api.get('/users/profile'),
};

export default api;