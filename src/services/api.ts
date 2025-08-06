import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.history.pushState({}, '', '/login');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/signin', credentials),
  
  register: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber: string;
    role: string;
    organizationId: string;
  }) => api.post('/auth/signup', userData),
};

// Device API
export const deviceAPI = {
  getAll: (params?: { status?: string; type?: string; search?: string }) =>
    api.get('/devices', { params }),
  
  getById: (id: string) => api.get(`/devices/${id}`),
  
  create: (device: any) => api.post('/devices', device),
  
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

export default api;