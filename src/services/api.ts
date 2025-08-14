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

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
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

// Helper to refresh token
const refreshToken = async (): Promise<string> => {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const currentToken = localStorage.getItem('token');
      if (!currentToken) throw new Error('No token available for refresh');
      const res = await api.post('/auth/refresh', { token: currentToken });
      const newToken = res.data?.token;
      if (!newToken) throw new Error('No token in refresh response');
      localStorage.setItem('token', newToken);
      return newToken;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();
  return refreshPromise;
};

// Add response interceptor to handle auth errors and token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;
    const url: string = originalRequest?.url || '';

    console.error('API Response Error:', status, url, error.message);

    // Ignore refresh attempts for auth endpoints
    const isAuthEndpoint = url.includes('/auth/signin') || url.includes('/auth/signup') || url.includes('/auth/refresh');

    if (status === 401 && !isAuthEndpoint) {
      try {
        if (originalRequest._retry) {
          // Already retried, clear and fail
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          return Promise.reject(error);
        }

        originalRequest._retry = true;

        // Attempt token refresh
        const newToken = await refreshToken();
        // Set header on defaults and this request
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        // Retry the original request
        return api(originalRequest);
      } catch (refreshErr) {
        console.error('Token refresh failed:', refreshErr);
        // Clear auth data on refresh failure
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return Promise.reject(refreshErr);
      }
    }

    // For other errors just reject
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

  refresh: (token: string) => api.post('/auth/refresh', { token }),
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
    };
    return api.post('/devices', processedDevice);
  },
  
  update: (id: string, device: any) => api.put(`/devices/${id}`, device),
  
  delete: (id: string) => api.delete(`/devices/${id}`),
  
  updateStatus: (id: string, status: string) => api.patch(`/devices/${id}/status`, { status }),
  
  postTelemetry: (deviceId: string, data: any) => api.post(`/devices/${deviceId}/telemetry`, data),
};

// Rule API
export const ruleAPI = {
  getAll: () => api.get('/rules'),
  getById: (id: string) => api.get(`/rules/${id}`),
  create: (rule: any) => api.post('/rules', rule),
  update: (id: string, rule: any) => api.put(`/rules/${id}`, rule),
  delete: (id: string) => api.delete(`/rules/${id}`),
  toggle: (id: string) => api.patch(`/rules/${id}/toggle`),
  // Added new endpoint for rules generation
  generateRules: (request: {
    pdf_filename: string;
    chunk_size?: number;
    rule_types?: string[];
  }) => api.post('/rules/generate-rules', request),
};

// Knowledge API
export const knowledgeAPI = {
  uploadDocument: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/knowledge/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  uploadPDF: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/knowledge/upload-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  getDocuments: () => api.get('/knowledge/documents'),
  
  deleteDocument: (documentId: string) => api.delete(`/knowledge/documents/${documentId}`),
  
  downloadDocument: (documentId: string) => 
    api.get(`/knowledge/documents/${documentId}/download`, {
      responseType: 'blob'
    }),
  
  getDocumentStatus: (documentId: string) => api.get(`/knowledge/documents/${documentId}/status`),
  
  searchDocuments: (query: string, limit: number = 10) => 
    api.post('/knowledge/search', { query, limit }),
  
  sendChatMessage: (message: string, documentIds: string[]) => 
    api.post('/knowledge/chat', { message, documentIds }),
  
  getChatHistory: () => api.get('/knowledge/chat/history'),
  
  getStatistics: () => api.get('/knowledge/statistics'),
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
  
  changePassword: (payload: { currentPassword: string; newPassword: string; confirmPassword: string }) => 
    api.post('/users/change-password', payload),
  
  // Preferences
  getPreferences: () => api.get('/user-preferences'),
  savePreferences: (prefs: any) => api.post('/user-preferences', prefs),
};

export default api;