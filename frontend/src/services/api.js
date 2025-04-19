import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
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
  if (error.response && error.response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
  } else if (error.response && error.response.status === 403) {
    return Promise.reject(error);
  }
  return Promise.reject(error);
});

const apiService = {
  // Auth endpoints
  login: function (credentials) {
    return api.post('/users/login', credentials);
  },
  register: function (userData) {
    return api.post('/users/register', userData);
  },
  logout: function () {
    return api.post('/users/logout');
  },
  getProfile: function () {
    return api.get('/users/profile');
  },
  resetAccountLock: function (email) {
    return api.post('/users/reset-account-lock', { email: email });
  },

  // Admin endpoints
  getUsers: function (params) {
    return api.get('/admin/users', { params: params });
  },
  getUser: function (id) {
    return api.get(`/admin/users/${id}`);
  },
  updateUser: function (id, userData) {
    return api.put(`/admin/users/${id}`, userData);
  },
  deleteUser: function (id) {
    return api.delete(`/admin/users/${id}`);
  },
  updateUserRole: function (userId, role) {
    return api.patch(`/admin/users/${userId}/role`, { role_id: role });
  },
  deactivateUser: function (userId) {
    return api.post(`/admin/users/${userId}/deactivate`);
  },
  resetUserPassword: function (userId) {
    return api.post(`/admin/users/${userId}/reset-password`);
  },
  resetUser2FA: function (userId) {
    return api.post(`/admin/users/${userId}/reset-2fa`);
  },
  // Role Management
  getRoles: function (params) {
    return api.get('/admin/roles', { params: params });
  },
  createRole: function (roleData) {
    return api.post('/admin/roles', roleData);
  },
  updateRole: function (id, roleData) {
    return api.put(`/admin/roles/${id}`, roleData);
  },
  deleteRole: function (id) {
    return api.delete(`/admin/roles/${id}`);
  },
  getPermissions: function () {
    return api.get('/users/permissions');
  },
  // System Settings
  getSettings: function () {
    return api.get('/admin/settings');
  },
  updateSettings: function (settings) {
    return api.put('/admin/settings/auth', settings);
  },

  // Logs
  getActivityLogs: function (params) {
    return api.get('/admin/activity-logs', { params });
  },
  getLoginLogs: function (params) {
    return api.get('/admin/login-logs', { params });
  },
  getAuditLogs: function (params) {
    return api.get('/users/audit-logs', { params });
  },
  clearAuditLogs: function () {
    return api.delete('/users/audit-logs');
  },
  getLoginHistory: function (userId, params) {
    return api.get(`/users/users/${userId}/login-history`, { params: params });
  },
  getSecuritySettings: function () {
    return api.get('/users/settings/security');
  },
  updateSecuritySettings: function (settings) {
    return api.put('/users/settings/security', settings);
  },
  exportLogs: function (format) {
    return api.get(`/users/logs/export?format=${format}`);
  }
};

// Add axios instance methods to apiService
['get', 'post', 'put', 'delete', 'patch'].forEach(method => {
  apiService[method] = function (url, data, config) {
    return api[method](url, data, config);
  };
});

export default apiService;
