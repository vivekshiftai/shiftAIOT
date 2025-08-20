import axios from 'axios';
import { getApiConfig } from '../config/api';

const API_BASE_URL = getApiConfig().BACKEND_BASE_URL;

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
let failedQueue: Array<{ resolve: (value: string) => void; reject: (error: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  
  failedQueue = [];
};

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    // Include authentication for all operations except PDF processing
    const isPDFProcessing = config.url?.includes('/upload-pdf') ||
                           config.url?.includes('/generate/') ||
                           config.url?.includes('/pdfs') ||
                           config.url?.includes('/query') ||
                           config.url?.includes('/health');
    
    if (!isPDFProcessing) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper to safely extract bearer token from axios defaults
const getTokenFromDefaults = (): string | null => {
  try {
    const hdr = (api.defaults.headers.common as any)?.Authorization as string | undefined;
    if (hdr && hdr.startsWith('Bearer ')) return hdr.slice(7);
    return null;
  } catch {
    return null;
  }
};

// Helper to refresh token
const refreshToken = async (): Promise<string> => {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      let currentToken = localStorage.getItem('token');
      if (!currentToken) {
        const fromHeader = getTokenFromDefaults();
        if (fromHeader) currentToken = fromHeader;
      }
      if (!currentToken) throw new Error('No token available for refresh');
      
      const res = await api.post('/auth/refresh', { token: currentToken });
      const newToken = res.data?.token;
      if (!newToken) throw new Error('No token in refresh response');
      
      localStorage.setItem('token', newToken);
      api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      
      processQueue(null, newToken);
      return newToken;
    } catch (error) {
      processQueue(error, null);
      throw error;
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

    // Only handle 401/403 auth errors
    if ((status === 401 || status === 403) && !originalRequest._retry) {
      // Ignore refresh attempts for auth endpoints
      const isAuthEndpoint = url.includes('/auth/signin') || url.includes('/auth/signup') || url.includes('/auth/refresh');

      if (!isAuthEndpoint) {
        originalRequest._retry = true;

        // Queue this request
        const retryOriginalRequest = new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });

        try {
          // Attempt token refresh
          await refreshToken();
          // Retry the original request
          return api(originalRequest);
        } catch (refreshErr: any) {
          console.warn('Token refresh failed:', refreshErr.message);
          // Never automatically logout the user - let them manually logout if needed
          // Just reject the request and let the UI handle it gracefully
          return Promise.reject(error);
        }
      }
    }

    // For other errors just reject without logging out
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) => {
    return api.post('/api/auth/signin', credentials);
  },
  
  register: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: 'ADMIN' | 'USER';
  }) => {
    return api.post('/api/auth/signup', userData);
  },

  refresh: (token: string) => api.post('/api/auth/refresh', { token }),
};

// Device API
export const deviceAPI = {
  getAll: (params?: { status?: string; type?: string; search?: string }) => {
    console.log('deviceAPI.getAll called with params:', params);
    console.log('API_BASE_URL:', API_BASE_URL);
    console.log('Full URL will be:', `${API_BASE_URL}/api/devices`);
    return api.get('/api/devices', { params });
  },
  
  getById: (id: string) => api.get(`/api/devices/${id}`),
  
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
    return api.post('/api/devices', processedDevice);
  },
  
  update: (id: string, device: any) => api.put(`/api/devices/${id}`, device),
  
  delete: (id: string) => api.delete(`/api/devices/${id}`),
  
  updateStatus: (id: string, status: string) => api.patch(`/api/devices/${id}/status`, { status }),
  
  postTelemetry: (deviceId: string, data: any) => api.post(`/api/devices/${deviceId}/telemetry`, data),
  
  getDocumentation: (deviceId: string) => api.get(`/api/devices/${deviceId}/documentation`),
  
  downloadDocumentation: (deviceId: string, type: string) => 
    api.get(`/api/devices/${deviceId}/documentation/${type}`, {
      responseType: 'blob'
    }),
};

// Rule API
export const ruleAPI = {
  getAll: () => api.get('/api/rules'),
  getById: (id: string) => api.get(`/api/rules/${id}`),
  create: (rule: any) => api.post('/api/rules', rule),
  update: (id: string, rule: any) => api.put(`/api/rules/${id}`, rule),
  delete: (id: string) => api.delete(`/api/rules/${id}`),
  toggle: (id: string) => api.patch(`/api/rules/${id}/toggle`),
  // Added new endpoint for rules generation
  generateRules: (request: {
    pdf_filename: string;
    chunk_size?: number;
    rule_types?: string[];
  }) => api.post('/api/rules/generate-rules', request),
  getStats: () => api.get('/api/rules/stats'),
};

// Maintenance API
export const maintenanceAPI = {
  getAll: () => api.get('/api/maintenance'),
  getById: (id: string) => api.get(`/api/maintenance/${id}`),
  create: (item: any) => api.post('/api/maintenance', item),
  update: (id: string, item: any) => api.put(`/api/maintenance/${id}`, item),
  delete: (id: string) => api.delete(`/api/maintenance/${id}`),
};

// Knowledge API
export const knowledgeAPI = {
  uploadDocument: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/knowledge/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  uploadPDF: (file: File, deviceId?: string, deviceName?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (deviceId) {
      formData.append('deviceId', deviceId);
    }
    if (deviceName) {
      formData.append('deviceName', deviceName);
    }
    return api.post('/api/knowledge/upload-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  getDocuments: (deviceId?: string) => {
    const params = deviceId ? { deviceId } : {};
    return api.get('/api/knowledge/documents', { params });
  },
  
  getDocumentsByDevice: (deviceId: string) => api.get(`/api/knowledge/documents/device/${deviceId}`),
  
  getGeneralDocuments: () => api.get('/api/knowledge/documents/general'),
  
  deleteDocument: (documentId: string) => api.delete(`/api/knowledge/documents/${documentId}`),
  
  downloadDocument: (documentId: string) => 
    api.get(`/api/knowledge/documents/${documentId}/download`, {
      responseType: 'blob'
    }),
  
  getDocumentStatus: (documentId: string) => api.get(`/api/knowledge/documents/${documentId}/status`),
  
  searchDocuments: (query: string, limit: number = 10) => 
    api.post('/api/knowledge/search', { query, limit }),
  
  sendChatMessage: (message: string, documentIds: string[]) => 
    api.post('/api/knowledge/chat', { message, documentIds }),
  
  getChatHistory: () => api.get('/api/knowledge/chat/history'),
  
  getStatistics: () => api.get('/api/knowledge/statistics'),
};

// Notification API
export const notificationAPI = {
  getAll: () => api.get('/api/notifications'),
  
  create: (notification: any) => api.post('/api/notifications', notification),
  
  markAsRead: (id: string) => api.patch(`/api/notifications/${id}/read`),
  
  markAllAsRead: () => api.patch('/api/notifications/read-all'),
  
  getUnreadCount: () => api.get('/api/notifications/unread-count'),
};

// Conversation Config API
export const conversationConfigAPI = {
  getAll: () => api.get('/conversation-configs'),
  getById: (id: string) => api.get(`/conversation-configs/${id}`),
  create: (config: any) => api.post('/conversation-configs', config),
  update: (id: string, config: any) => api.put(`/conversation-configs/${id}`, config),
  delete: (id: string) => api.delete(`/conversation-configs/${id}`),
  getActive: () => api.get('/conversation-configs/active'),
  getByPlatformType: (platformType: string) => api.get(`/conversation-configs/platform/${platformType}`),
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

// PDF Processing API
export const pdfAPI = {
  // Upload and process PDF files with MinerU extraction
  uploadPDF: async (file: File, deviceId?: string, deviceName?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (deviceId) formData.append('deviceId', deviceId);
    if (deviceName) formData.append('deviceName', deviceName);
    
    // Create a separate axios instance without authentication for PDF uploads
    const pdfApi = axios.create({
      baseURL: API_BASE_URL,
      timeout: 300000, // 5 minutes timeout for large files
    });
    
    return pdfApi.post('/upload-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Query PDF content with intelligent responses and context
  queryPDF: async (query: string, pdfName?: string, topK: number = 5) => {
    // Create a separate axios instance without authentication for PDF queries
    const pdfApi = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
    });
    
    return pdfApi.post('/query', {
      query,
      pdf_name: pdfName,
      top_k: topK
    });
  },

  // List all processed PDFs with pagination
  listPDFs: async (page: number = 1, limit: number = 10, deviceId?: string) => {
    // Create a separate axios instance without authentication for PDF listing
    const pdfApi = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });
    
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    if (deviceId) params.append('deviceId', deviceId);
    
    return pdfApi.get(`/pdfs?${params.toString()}`);
  },

  // Get PDF processing status
  getPDFStatus: async (pdfId: string) => {
    // Create a separate axios instance without authentication for PDF status
    const pdfApi = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });
    
    return pdfApi.get(`/knowledge/documents/${pdfId}/status`);
  },

  // Generate IoT monitoring rules from technical documentation
  generateRules: async (pdfName: string, deviceId: string) => {
    const pdfApi = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
    });
    
    return pdfApi.post('/generate/rules', {
      pdf_name: pdfName,
      device_id: deviceId
    });
  },

  // Generate maintenance schedules and tasks
  generateMaintenance: async (pdfName: string, deviceId: string) => {
    const pdfApi = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
    });
    
    return pdfApi.post('/generate/maintenance', {
      pdf_name: pdfName,
      device_id: deviceId
    });
  },

  // Extract safety information and procedures
  generateSafety: async (pdfName: string, deviceId: string) => {
    const pdfApi = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
    });
    
    return pdfApi.post('/generate/safety', {
      pdf_name: pdfName,
      device_id: deviceId
    });
  }
};

export default api;