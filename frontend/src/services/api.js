import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 
           (window.location.hostname === 'localhost' 
             ? 'http://localhost:5000/api' 
             : 'https://uaermimbackend.onrender.com/api'),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

// Request interceptor for adding auth token
api.interceptors.request.use(function (config) {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
}, function (error) {
  return Promise.reject(error);
});

// Response interceptor for handling errors
api.interceptors.response.use(function (response) {
  return response;
}, function (error) {
  console.error('API Error:', {
    message: error.message,
    response: error.response?.data,
    status: error.response?.status
  });

  if (error.response && error.response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  return Promise.reject(error);
});

const apiService = {
  // Auth endpoints
  login: (credentials) => api.post('/auth/login', credentials),
  adminLogin: (credentials) => api.post('/auth/admin/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  resetAccountLock: (email) => api.post('/auth/reset-lock', { email }),

  // User endpoints
  updateProfile: (userData) => api.put('/users/profile', userData),
  changePassword: (data) => api.put('/users/change-password', data),

  // Admin endpoints
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  updateUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
  deactivateUser: (userId) => api.put(`/admin/users/${userId}/deactivate`),
  resetUserPassword: (userId) => api.post(`/admin/users/${userId}/reset-password`),
  resetUser2FA: (userId) => api.post(`/admin/users/${userId}/reset-2fa`),

  // Role Management
  getRoles: (params) => api.get('/admin/roles', { params }),
  createRole: (roleData) => api.post('/admin/roles', roleData),
  updateRole: (id, roleData) => api.put(`/admin/roles/${id}`, roleData),
  deleteRole: (id) => api.delete(`/admin/roles/${id}`),
  getPermissions: () => api.get('/admin/permissions'),

  // System Settings
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (settings) => api.put('/admin/settings', settings),

  // Logs
  getActivityLogs: (params = {}) => api.get('/admin/logs/activity', { params }),
  getLoginLogs: (params = {}) => api.get('/admin/logs/login', { params }),
  getAuditLogs: (params) => api.get('/admin/logs/audit', { params }),
  clearAuditLogs: () => api.delete('/admin/logs/audit'),
  getLoginHistory: (userId, params) => api.get(`/admin/users/${userId}/login-history`, { params }),
  getSecuritySettings: () => api.get('/admin/settings/security'),
  updateSecuritySettings: (settings) => api.put('/admin/settings/security', settings),
  exportLogs: (format) => api.get('/admin/logs/export', { params: { format } }),
};

// Add axios instance methods to apiService
['get', 'post', 'put', 'delete', 'patch'].forEach(method => {
  apiService[method] = function (url, data, config) {
    return api[method](url, data, config);
  };
});

export default apiService;
