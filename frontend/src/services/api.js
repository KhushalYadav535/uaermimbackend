
import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api') + '/users',
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

export default {
  // Auth endpoints
  login: function (credentials) {
    return api.post('/login', credentials);
  },
  register: function (userData) {
    return api.post('/register', userData);
  },
  logout: function () {
    return api.post('/logout');
  },
  getProfile: function () {
    return api.get('/profile');
  },
  resetAccountLock: function (email) {
    return api.post('/reset-account-lock', { email: email });
  },

  // Admin endpoints
  getUsers: function (params) {
    return api.get('/users', { params: params });
  },
  getUser: function (id) {
    return api.get('/users/' + id);
  },
  updateUser: function (id, userData) {
    return api.put('/users/' + id, userData);
  },
  deleteUser: function (id) {
    return api.delete('/users/' + id);
  },
  getRoles: function (params) {
    return api.get('/roles', { params: params });
  },
  getAuditLogs: function (params) {
    return api.get('/audit-logs', { params: params });
  },
  clearAuditLogs: function () {
    return api.delete('/audit-logs');
  }
};
