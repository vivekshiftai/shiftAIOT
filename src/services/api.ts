import axios from 'axios';
import { getApiConfig } from '../config/api';
import { tokenService } from './tokenService';

const API_BASE_URL = getApiConfig().BACKEND_BASE_URL;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Initialize token service
tokenService.initializeToken();

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    // Skip authentication for public endpoints
    const isPublicEndpoint = config.url?.includes('/auth/') ||
                           config.url?.includes('/upload-pdf') ||
                           config.url?.includes('/generate/') ||
                           config.url?.includes('/pdfs') ||
                           config.url?.includes('/query') ||
                           config.url?.includes('/health') ||
                           config.url?.includes('/knowledge/');
    
    if (!isPublicEndpoint) {
      const token = tokenService.getToken();
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

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;

    // Handle 401/403 auth errors
    if ((status === 401 || status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt token refresh
        const newToken = await tokenService.refreshToken();
        if (newToken) {
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } else {
          // Token refresh failed, redirect to login
          console.warn('Token refresh failed, redirecting to login');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(error);
        }
      } catch (refreshErr: any) {
        console.warn('Token refresh failed:', refreshErr.message);
        // Token refresh failed, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    // Handle 500 errors for device-specific endpoints
    if (status === 500) {
      const url = error.config?.url || '';
      if (url.includes('/safety-precautions') || url.includes('/rules') || url.includes('/maintenance')) {
        console.warn(`Server error for endpoint: ${url}. This might be due to missing database columns or backend issues.`);
        // Return empty data instead of throwing error
        return Promise.resolve({ data: [] });
      }
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

  refresh: (token: string) => api.post('/auth/refresh', { token }),
};

// Device API
export const deviceAPI = {
  getAll: () => api.get('/api/devices'),
  getById: (id: string) => api.get(`/api/devices/${id}`),
  create: (device: any) => api.post('/api/devices', device),
  createSimple: (device: any) => api.post('/api/devices/simple', device),
  update: (id: string, device: any) => api.put(`/api/devices/${id}`, device),
  delete: (id: string) => api.delete(`/api/devices/${id}`),
  getByOrganization: (organizationId: string) => api.get(`/api/devices/organization/${organizationId}`),
  getStatus: (id: string) => api.get(`/api/devices/${id}/status`),
  updateStatus: (id: string, status: string) => api.patch(`/api/devices/${id}/status`, { status }),
  getTelemetry: (id: string) => api.get(`/api/devices/${id}/telemetry`),
  getDocumentation: (id: string) => api.get(`/api/devices/${id}/documentation`),
  getDebugData: (deviceId: string) => api.get(`/api/devices/${deviceId}/debug-data`),
  testAuth: () => api.get('/api/devices/auth-test'),
};

// Rule API
export const ruleAPI = {
  getAll: () => api.get('/api/rules'),
  getById: (id: string) => api.get(`/api/rules/${id}`),
  create: (rule: any) => api.post('/api/rules', rule),
  createBulk: (rules: any[]) => api.post('/api/rules/bulk', rules),
  update: (id: string, rule: any) => api.put(`/api/rules/${id}`, rule),
  delete: (id: string) => api.delete(`/api/rules/${id}`),
  getByDevice: (deviceId: string) => api.get(`/api/devices/${deviceId}/rules`),
  getByOrganization: (organizationId: string) => api.get(`/api/rules/organization/${organizationId}`),
  activate: (id: string) => api.patch(`/api/rules/${id}/activate`),
  deactivate: (id: string) => api.patch(`/api/rules/${id}/deactivate`),
};

// Analytics API
export const analyticsAPI = {
  getAll: () => api.get('/api/analytics'),
  getById: (id: string) => api.get(`/api/analytics/${id}`),
  create: (analytics: any) => api.post('/api/analytics', analytics),
  update: (id: string, analytics: any) => api.put(`/api/analytics/${id}`, analytics),
  delete: (id: string) => api.delete(`/api/analytics/${id}`),
  getByDevice: (deviceId: string) => api.get(`/api/devices/${deviceId}/analytics`),
  getByOrganization: (organizationId: string) => api.get(`/api/analytics/organization/${organizationId}`),
  getRealTime: (deviceId: string) => api.get(`/api/analytics/${deviceId}/realtime`),
  getHistorical: (deviceId: string, startDate: string, endDate: string) => 
    api.get(`/api/analytics/${deviceId}/historical`, { params: { startDate, endDate } }),
};

// Log API
export const logAPI = {
  getAll: () => api.get('/api/logs'),
  getById: (id: string) => api.get(`/api/logs/${id}`),
  create: (log: any) => api.post('/api/logs', log),
  update: (id: string, log: any) => api.put(`/api/logs/${id}`, log),
  delete: (id: string) => api.delete(`/api/logs/${id}`),
  getByDevice: (deviceId: string) => api.get(`/api/devices/${deviceId}/logs`),
  getByOrganization: (organizationId: string) => api.get(`/api/logs/organization/${organizationId}`),
  getByLevel: (level: string) => api.get(`/api/logs/level/${level}`),
  getByDateRange: (startDate: string, endDate: string) => 
    api.get('/api/logs/date-range', { params: { startDate, endDate } }),
  export: (deviceId: string, format: string = 'csv') => 
    api.get(`/api/logs/${deviceId}/export`, { params: { format }, responseType: 'blob' }),
};

// Maintenance API
export const maintenanceAPI = {
  getAll: () => api.get('/api/maintenance'),
  getById: (id: string) => api.get(`/api/maintenance/${id}`),
  create: (item: any) => api.post('/api/maintenance', item),
  createBulk: (items: any[]) => api.post('/api/maintenance/bulk', items),
  update: (id: string, item: any) => api.put(`/api/maintenance/${id}`, item),
  delete: (id: string) => api.delete(`/api/maintenance/${id}`),
  getByDevice: (deviceId: string) => api.get(`/api/devices/${deviceId}/maintenance`),
};

// Device Safety Precautions API
export const deviceSafetyPrecautionsAPI = {
  getAllByDevice: (deviceId: string) => api.get(`/api/devices/${deviceId}/safety-precautions`),
  getByDevice: (deviceId: string) => api.get(`/api/devices/${deviceId}/safety-precautions`),
  getActiveByDevice: (deviceId: string) => api.get(`/api/device-safety-precautions/device/${deviceId}/active`),
  getById: (id: string) => api.get(`/api/device-safety-precautions/${id}`),
  create: (safetyPrecaution: any) => api.post('/api/device-safety-precautions', safetyPrecaution),
  createBulk: (safetyPrecautions: any[]) => api.post('/api/device-safety-precautions/bulk', safetyPrecautions),
  update: (id: string, safetyPrecaution: any) => api.put(`/api/device-safety-precautions/${id}`, safetyPrecaution),
  delete: (id: string) => api.delete(`/api/device-safety-precautions/${id}`),
  deleteByDevice: (deviceId: string) => api.delete(`/api/device-safety-precautions/device/${deviceId}`),
  getByType: (deviceId: string, type: string) => api.get(`/api/device-safety-precautions/device/${deviceId}/type/${type}`),
  getByCategory: (deviceId: string, category: string) => api.get(`/api/device-safety-precautions/device/${deviceId}/category/${category}`),
  getBySeverity: (deviceId: string, severity: string) => api.get(`/api/device-safety-precautions/device/${deviceId}/severity/${severity}`),
  getCount: (deviceId: string) => api.get(`/api/device-safety-precautions/device/${deviceId}/count`),
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
  getAll: () => api.get('/api/conversation-configs'),
  getById: (id: string) => api.get(`/api/conversation-configs/${id}`),
  create: (config: any) => api.post('/api/conversation-configs', config),
  update: (id: string, config: any) => api.put(`/api/conversation-configs/${id}`, config),
  delete: (id: string) => api.delete(`/api/conversation-configs/${id}`),
  getActive: () => api.get('/api/conversation-configs/active'),
  getByPlatformType: (platformType: string) => api.get(`/api/conversation-configs/platform/${platformType}`),
};

// Device Connection API
export const deviceConnectionAPI = {
  getAll: () => api.get('/api/device-connections'),
  getById: (deviceId: string) => api.get(`/api/device-connections/${deviceId}`),
  create: (connection: any) => api.post('/api/device-connections', connection),
  update: (deviceId: string, connection: any) => api.put(`/api/device-connections/${deviceId}`, connection),
  delete: (deviceId: string) => api.delete(`/api/device-connections/${deviceId}`),
  connect: (deviceId: string) => api.post(`/api/device-connections/${deviceId}/connect`),
  disconnect: (deviceId: string) => api.post(`/api/device-connections/${deviceId}/disconnect`),
  getActive: () => api.get('/api/device-connections/active'),
  getStats: () => api.get('/api/device-connections/stats'),
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
    
    const params: any = { page, limit };
    if (deviceId) params.deviceId = deviceId;
    
    return pdfApi.get('/pdfs', { params });
  },

  // Download processed PDF
  downloadPDF: async (pdfName: string) => {
    // Create a separate axios instance without authentication for PDF downloads
    const pdfApi = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      responseType: 'blob',
    });
    
    return pdfApi.get(`/pdfs/${pdfName}/download`);
  },

  // Get PDF processing status
  getPDFStatus: async (pdfName: string) => {
    // Create a separate axios instance without authentication for PDF status
    const pdfApi = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });
    
    return pdfApi.get(`/pdfs/${pdfName}/status`);
  },

  // Generate rules from PDF
  generateRules: async (pdfName: string, deviceId?: string) => {
    // Create a separate axios instance without authentication for rule generation
    const pdfApi = axios.create({
      baseURL: API_BASE_URL,
      timeout: 60000, // 1 minute timeout for rule generation
    });
    
    const payload: any = { pdf_name: pdfName };
    if (deviceId) payload.deviceId = deviceId;
    
    return pdfApi.post('/generate-rules', payload);
  },

  // Generate maintenance schedule from PDF
  generateMaintenance: async (pdfName: string, deviceId?: string) => {
    // Create a separate axios instance without authentication for maintenance generation
    const pdfApi = axios.create({
      baseURL: API_BASE_URL,
      timeout: 60000, // 1 minute timeout for maintenance generation
    });
    
    const payload: any = { pdf_name: pdfName };
    if (deviceId) payload.deviceId = deviceId;
    
    return pdfApi.post('/generate-maintenance', payload);
  },

  // Generate safety precautions from PDF
  generateSafety: async (pdfName: string, deviceId?: string) => {
    // Create a separate axios instance without authentication for safety generation
    const pdfApi = axios.create({
      baseURL: API_BASE_URL,
      timeout: 60000, // 1 minute timeout for safety generation
    });
    
    const payload: any = { pdf_name: pdfName };
    if (deviceId) payload.deviceId = deviceId;
    
    return pdfApi.post('/generate-safety', payload);
  },
};