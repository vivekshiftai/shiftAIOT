import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

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
    console.log('API Request:', config.method?.toUpperCase(), config.url, config.data);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url, response.data);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.config?.url, error.message);
    
    // Only handle 401 errors for non-auth endpoints
    if (error.response?.status === 401 && !error.config.url?.includes('/auth/')) {
      // For development, don't logout on 401 errors
      if (process.env.NODE_ENV === 'development') {
        console.warn('401 error detected, but staying logged in for development');
        return Promise.reject(error);
      }
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Handle network errors gracefully
    if (!error.response) {
      console.warn('Network error, using mock data for development');
      if (process.env.NODE_ENV === 'development') {
        // Return mock data for development
        return Promise.reject(new Error('Network error - using mock data'));
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) => {
    console.log('authAPI.login called with:', credentials);
    return api.post('/auth/signin', credentials);
  },
  
  register: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: 'ADMIN' | 'USER';
  }) => {
    console.log('authAPI.register called with:', userData);
    return api.post('/auth/signup', userData);
  },
};

// Device API
export const deviceAPI = {
  getAll: (params?: { status?: string; type?: string; search?: string }) => {
    return api.get('/devices', { params });
  },
  
  getById: (id: string) => api.get(`/devices/${id}`),
  
  create: (device: any) => api.post('/devices', device),
  
  createWithFiles: (deviceData: any, files: { manual?: File; datasheet?: File; certificate?: File }) => {
    const formData = new FormData();
    formData.append('deviceData', JSON.stringify(deviceData));
    
    if (files.manual) formData.append('manualFile', files.manual);
    if (files.datasheet) formData.append('datasheetFile', files.datasheet);
    if (files.certificate) formData.append('certificateFile', files.certificate);
    
    return api.post('/devices/with-files', formData, {
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

export default api;