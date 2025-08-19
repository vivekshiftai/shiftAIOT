import axios from 'axios';

const API_BASE_URL = import.meta.env.DEV ? '/api' : 'http://20.57.36.66:8100/api';

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
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
  
  getDocumentation: (deviceId: string) => api.get(`/devices/${deviceId}/documentation`),
  
  downloadDocumentation: (deviceId: string, type: string) => 
    api.get(`/devices/${deviceId}/documentation/${type}`, {
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
  // Added new endpoint for rules generation
  generateRules: (request: {
    pdf_filename: string;
    chunk_size?: number;
    rule_types?: string[];
  }) => api.post('/rules/generate-rules', request),
  getStats: () => api.get('/rules/stats'),
};

// Maintenance API
export const maintenanceAPI = {
  getAll: () => api.get('/maintenance'),
  getById: (id: string) => api.get(`/maintenance/${id}`),
  create: (item: any) => api.post('/maintenance', item),
  update: (id: string, item: any) => api.put(`/maintenance/${id}`, item),
  delete: (id: string) => api.delete(`/maintenance/${id}`),
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
  
  uploadPDF: (file: File, deviceId?: string, deviceName?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (deviceId) {
      formData.append('deviceId', deviceId);
    }
    if (deviceName) {
      formData.append('deviceName', deviceName);
    }
    return api.post('/knowledge/upload-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  getDocuments: (deviceId?: string) => {
    const params = deviceId ? { deviceId } : {};
    return api.get('/knowledge/documents', { params });
  },
  
  getDocumentsByDevice: (deviceId: string) => api.get(`/knowledge/documents/device/${deviceId}`),
  
  getGeneralDocuments: () => api.get('/knowledge/documents/general'),
  
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
    
    return api.post('/upload-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 minutes timeout for large files
    });
  },

  // Query PDF content with intelligent responses and context
  queryPDF: async (query: string, pdfIds?: string[]) => {
    return api.post('/query', {
      query,
      pdfIds: pdfIds || []
    });
  },

  // List all processed PDFs with pagination
  listPDFs: async (page: number = 1, limit: number = 10, deviceId?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    if (deviceId) params.append('deviceId', deviceId);
    
    return api.get(`/pdfs?${params.toString()}`);
  },

  // Get PDF processing status
  getPDFStatus: async (pdfId: string) => {
    return api.get(`/pdfs/${pdfId}/status`);
  }
};

export default api;