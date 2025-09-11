import axios from 'axios';
import { getApiConfig } from '../config/api';
import { tokenService } from './tokenService';
import { logInfo, logWarn, logError } from '../utils/logger';
import { NotificationTemplateRequest } from '../types';

// Custom error class for authentication errors
class AuthenticationError extends Error {
  public status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'AuthenticationError';
    this.status = status;
  }
}

const API_BASE_URL = getApiConfig().BACKEND_BASE_URL;

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  // Removed timeout for better user experience
});

// Initialize token service
tokenService.initializeToken();

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    // Skip authentication for public endpoints
    const isPublicEndpoint = config.url?.includes('/auth/') ||
                           config.url?.includes('/api/auth/') ||
                           config.url?.includes('/health') ||
                           config.url?.includes('/api/health/') ||
                           config.url?.includes('/upload-pdf') ||
                           config.url?.includes('/query') ||
                           config.url?.includes('/pdfs/') ||
                           config.url?.includes('/knowledge/suggestions'); // Temporarily make suggestions public for testing
    
    if (!isPublicEndpoint) {
      const token = tokenService.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        logInfo('API', `Adding auth header for protected endpoint: ${config.url}`);
      } else {
        logWarn('API', `No token found for protected endpoint: ${config.url}`);
      }
    } else {
      logInfo('API', `Public endpoint, no auth header needed: ${config.url}`);
    }

    // Set Content-Type for JSON requests only
    if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

    // Log multipart requests for debugging
    if (config.data instanceof FormData) {
      
      // Ensure Content-Type is not set for multipart requests
      delete config.headers['Content-Type'];
      
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

    // Log the actual error response from backend
    if (error.response?.data) {
    }

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
          // Token refresh failed
          logWarn('API', 'Token refresh failed');
          
          // Create a more user-friendly error for auth failures
          const authError = new AuthenticationError('Authentication failed. Please log in again.', status);
          return Promise.reject(authError);
        }
      } catch (refreshErr: any) {
        logError('API', 'Token refresh error', refreshErr instanceof Error ? refreshErr : new Error('Unknown error'));
        
        // Create a more user-friendly error for auth failures
        const authError = new AuthenticationError('Authentication failed. Please log in again.', status);
        return Promise.reject(authError);
      }
    }

    // Handle 500 errors for device-specific endpoints
    if (status === 500) {
      const url = error.config?.url || '';
      if (url.includes('/safety-precautions') || url.includes('/rules') || url.includes('/maintenance')) {
        logWarn('API', `Server error for endpoint: ${url}. This might be due to missing database columns or backend issues.`);
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
  create: (deviceData: any) => api.post('/api/devices', deviceData),
  update: (id: string, deviceData: any) => api.put(`/api/devices/${id}`, deviceData),
  delete: (id: string) => api.delete(`/api/devices/${id}`),
  updateStatus: (id: string, status: string) => api.patch(`/api/devices/${id}/status`, status),
  getDocumentation: (deviceId: string) => api.get(`/api/devices/${deviceId}/documentation`),
  downloadDocumentation: (deviceId: string, type: string) => api.get(`/api/devices/${deviceId}/documentation/${type}/download`),
  healthCheck: () => api.get('/api/devices/health'),
  deviceOnboard: (formData: FormData) => api.post('/api/devices/unified-onboarding', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  getDevicePDFResults: (deviceId: string) => api.get(`/api/devices/${deviceId}/pdf-references`),
  getOnboardingProgress: (deviceId: string) => api.get(`/api/devices/${deviceId}/onboarding-progress`),
};

// Rule API
export const ruleAPI = {
  getAll: () => api.get('/api/rules'),
  getById: (id: string) => api.get(`/api/rules/${id}`),
  create: (rule: any) => api.post('/api/rules', rule),
  createBulk: (rules: any[]) => api.post('/api/rules/bulk', rules),
  update: (id: string, rule: any) => api.put(`/api/rules/${id}`, rule),
  delete: (id: string) => api.delete(`/api/rules/${id}`),
  getByDevice: (deviceId: string) => api.get(`/api/rules/device/${deviceId}`),
  getByOrganization: (organizationId: string) => api.get(`/api/rules/organization/${organizationId}`),
  activate: (id: string) => api.patch(`/api/rules/${id}/activate`),
  deactivate: (id: string) => api.patch(`/api/rules/${id}/deactivate`),
  toggle: (id: string) => api.patch(`/api/rules/${id}/toggle`),
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
  getByDevice: (deviceId: string) => api.get(`/api/maintenance/device/${deviceId}`),
  getUpcoming: () => api.get('/api/devices/maintenance/upcoming'),
  getDayWise: () => api.get('/api/maintenance/daywise'),
  getToday: () => api.get('/api/maintenance/today'),
  completeTask: (id: string) => api.patch(`/api/maintenance/${id}/complete`),
  assignTask: (id: string, assigneeId: string) => api.patch(`/api/maintenance/${id}/assign`, { assigneeId }),
  triggerNotifications: () => api.post('/api/maintenance/trigger-notifications'),
  updateDeviceNames: () => api.post('/api/maintenance/update-device-names'),
};

// Maintenance Scheduler API
export const maintenanceSchedulerAPI = {
  manualUpdate: () => api.post('/api/maintenance-scheduler/update'),
  getAttentionNeeded: () => api.get('/api/maintenance-scheduler/attention-needed'),
  getStatus: () => api.get('/api/maintenance-scheduler/status'),
};

// Device Safety Precautions API
export const deviceSafetyPrecautionsAPI = {
  getAll: () => api.get('/api/device-safety-precautions'),
  getAllByDevice: (deviceId: string) => api.get(`/api/device-safety-precautions/device/${deviceId}`),
  getByDevice: (deviceId: string) => api.get(`/api/device-safety-precautions/device/${deviceId}`),
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
    return api.post('/api/knowledge/upload', formData);
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
    return api.post('/api/knowledge/upload-pdf', formData);
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
  delete: (id: string) => api.delete(`/api/notifications/${id}`),
  deleteAll: () => api.delete('/api/notifications'),
  getDetails: (id: string) => api.get(`/api/notifications/${id}/details`),
};

// Notification Template API
export const notificationTemplateAPI = {
  getAll: () => api.get('/api/notification-templates'),
  getById: (id: string) => api.get(`/api/notification-templates/${id}`),
  create: (template: NotificationTemplateRequest) => api.post('/api/notification-templates', template),
  update: (id: string, template: NotificationTemplateRequest) => api.put(`/api/notification-templates/${id}`, template),
  delete: (id: string) => api.delete(`/api/notification-templates/${id}`),
  toggleStatus: (id: string) => api.patch(`/api/notification-templates/${id}/toggle`),
  process: (id: string, variables: Record<string, string>) => api.post(`/api/notification-templates/${id}/process`, variables),
  getVariables: (id: string) => api.get(`/api/notification-templates/${id}/variables`),
  getByType: (type: string) => api.get(`/api/notification-templates/type/${type}`),
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
  getAll: () => api.get('/api/users'),
  getById: (id: string) => api.get(`/api/users/${id}`),
  update: (id: string, userData: any) => api.put(`/api/users/${id}`, userData),
  delete: (id: string) => api.delete(`/api/users/${id}`),
  getProfile: () => api.get('/api/users/profile'),
  getComprehensiveProfile: () => api.get('/api/users/profile/comprehensive'),
  getStats: () => api.get('/api/users/stats'),
  changePassword: (passwordData: any) => api.post('/api/users/change-password', passwordData),
  updateIntegrationIds: (integrationIds: { gmailId?: string | null; slackId?: string | null; teamId?: string | null }) => 
    api.post('/api/users/update-integration-ids', integrationIds),
  // Preferences
  getPreferences: () => api.get('/api/user-preferences'),
  savePreferences: (prefs: any) => api.post('/api/user-preferences', prefs),
  
  // Notification Settings
  getNotificationSettings: () => api.get('/api/user-settings/notifications'),
  updateNotificationSettings: (settings: any) => api.put('/api/user-settings/notifications', settings),
  
  // Dashboard Settings
  getDashboardSettings: () => api.get('/api/user-settings/dashboard'),
  updateDashboardSettings: (settings: any) => api.put('/api/user-settings/dashboard', settings),
};

// Organization API
export const organizationAPI = {
  getAll: () => api.get('/api/organizations'),
  getActive: () => api.get('/api/organizations/active'),
  getById: (id: string) => api.get(`/api/organizations/${id}`),
  create: (organization: any) => api.post('/api/organizations', organization),
  update: (id: string, organization: any) => api.put(`/api/organizations/${id}`, organization),
  delete: (id: string) => api.delete(`/api/organizations/${id}`),
  activate: (id: string) => api.put(`/api/organizations/${id}/activate`),
  deactivate: (id: string) => api.put(`/api/organizations/${id}/deactivate`),
  getBySubscriptionPlan: (plan: string) => api.get('/api/organizations/by-plan', { params: { plan } }),
  getStats: () => api.get('/api/organizations/stats'),
  getDefault: () => api.get('/api/organizations/default'),
};

// PDF Processing API - All calls go through backend
export const pdfAPI = {
  // Upload and process PDF files through backend (authenticated)
  uploadPDF: async (file: File, deviceId?: string, deviceName?: string) => {
    // Get user from localStorage to get organizationId
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const organizationId = user?.organizationId || 'default';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('organizationId', organizationId);
    if (deviceId) formData.append('deviceId', deviceId);
    if (deviceName) formData.append('deviceName', deviceName);
    
    return api.post('/api/pdf/upload', formData);
  },

  // Upload and process PDF files through backend (public endpoint)
  uploadPDFPublic: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post('/api/pdf/upload-pdf', formData);
  },

  // Query PDF content through backend
  queryPDF: async (query: string, pdfName?: string, topK: number = 5) => {
    return api.post('/api/pdf/query', {
      query,
      pdf_name: pdfName,
      top_k: topK
    });
  },

  // List all processed PDFs through backend
  listPDFs: async (page: number = 1, limit: number = 10, deviceId?: string) => {
    const params: any = { page, limit };
    if (deviceId) params.deviceId = deviceId;
    
    return api.get('/api/pdf/list', { params });
  },

  // List PDFs in external service format
  listPDFsExternal: async (page: number = 1, limit: number = 10) => {
    return api.get('/api/pdf/pdfs', { 
      params: { page, limit }
    });
  },

  // Download processed PDF through backend
  downloadPDF: async (pdfName: string) => {
    return api.get(`/api/pdf/download/${pdfName}`, {
      responseType: 'blob'
    });
  },

  // Get PDF processing status through backend
  getPDFStatus: async (pdfName: string) => {
    return api.get(`/api/pdf/status/${pdfName}`);
  },

  // Generate rules from PDF through backend
  generateRules: async (pdfName: string, deviceId?: string) => {
    const payload: any = { pdf_name: pdfName };
    if (deviceId) payload.deviceId = deviceId;
    
    return api.post('/api/pdf/generate-rules', payload);
  },

  // Generate rules using external service format
  generateRulesExternal: async (pdfName: string) => {
    return api.post(`/api/pdf/generate-rules/${pdfName}`, {});
  },

  // Generate maintenance schedule from PDF through backend
  generateMaintenance: async (pdfName: string, deviceId?: string) => {
    const payload: any = { pdf_name: pdfName };
    if (deviceId) payload.deviceId = deviceId;
    
    return api.post('/api/pdf/generate-maintenance', payload);
  },

  // Generate maintenance using external service format
  generateMaintenanceExternal: async (pdfName: string) => {
    return api.post(`/api/pdf/generate-maintenance/${pdfName}`, {});
  },

  // Generate safety precautions from PDF through backend
  generateSafety: async (pdfName: string, deviceId?: string) => {
    const payload: any = { pdf_name: pdfName };
    if (deviceId) payload.deviceId = deviceId;
    
    return api.post('/api/pdf/generate-safety', payload);
  },

  // Generate safety using external service format
  generateSafetyExternal: async (pdfName: string) => {
    return api.post(`/api/pdf/generate-safety/${pdfName}`, {});
  },

  // Delete PDF through backend
  deletePDF: async (pdfName: string) => {
    
    const startTime = Date.now();
    
    try {
      const response = await api.delete(`/api/pdf/delete/${pdfName}`);
      
      return response;
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      logError('API', `PDF deletion failed: "${pdfName}"`, error instanceof Error ? error : new Error('Unknown error'), {
        duration: `${duration}ms`,
        error: error
      });
      
      throw error;
    }
  },

  // Delete PDF using external service format
  deletePDFExternal: async (pdfName: string) => {
    return api.delete(`/api/pdf/pdfs/${pdfName}`, {
      timeout: 30000,
    });
  },

  // Health check
  healthCheck: async () => {
    return api.get('/api/pdf/health');
  },

  // Global health check
  globalHealthCheck: async () => {
    return api.get('/api/pdf/health/global');
  },

  // Service info
  getServiceInfo: async () => {
    return api.get('/api/pdf/info');
  },

  // List all collections from external service
  listAllCollections: async () => {
    return api.get('/api/pdf/collections');
  },
};

// Push Notification API
export const pushNotificationAPI = {
  // Get VAPID public key
  getVapidPublicKey: async () => {
    return api.get('/api/push-notifications/vapid-public-key');
  },

  // Subscribe to push notifications
  subscribe: async (subscription: any) => {
    return api.post('/api/push-notifications/subscribe', subscription);
  },

  // Unsubscribe from push notifications
  unsubscribe: async () => {
    return api.post('/api/push-notifications/unsubscribe');
  },

  // Get subscription status
  getStatus: async () => {
    return api.get('/api/push-notifications/status');
  }
};