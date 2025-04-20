import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext();

const DEV_EMAIL = 'superadmin@example.com'; // Should match backend temp-config.js

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
      setIsAuthenticated(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const { data } = await api.getProfile();
      if (data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        
        // Only redirect if on login/register pages
        if (['/login', '/register'].includes(location.pathname)) {
          // Redirect based on role
          if (data.user.role === 'admin' || data.user.role === 'super_admin') {
            navigate('/admin/dashboard');
          } else {
            navigate('/dashboard');
          }
        }
      }
    } catch (err) {
      console.error('Error fetching user:', err);
      // Only logout if it's not a 401 error from profile endpoint
      if (!(err.response?.status === 401 && err.config?.url?.includes('/profile'))) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('Attempting login with:', { email });
      let response;
      
      // Use admin login for super admin
      if (email === DEV_EMAIL) {
        response = await api.adminLogin({ email, password });
      } else {
        response = await api.login({ email, password });
      }
      
      const { data } = response;
      console.log('Login response:', data);
      
      if (data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        setIsAuthenticated(true);
        
        // Redirect based on role
        if (data.user.role === 'admin' || data.user.role === 'super_admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
        return data;
      }
      throw new Error('No token received');
    } catch (err) {
      console.error('Login error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      if (err.response?.data?.errors) {
        const errorMessage = err.response.data.errors
          .map(error => error.msg)
          .join(', ');
        throw new Error(errorMessage);
      }
      if (err.response?.data?.error) {
        throw new Error(err.response.data.error);
      }
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      // Remove confirm_password before sending to API
      const { confirm_password, ...registrationData } = userData;
      
      const { data } = await api.register(registrationData);
      if (data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        setIsAuthenticated(true);
        
        // After registration, redirect to dashboard
        navigate('/dashboard');
        return data;
      }
      throw new Error('No token received');
    } catch (err) {
      console.error('Registration error:', err);
      if (err.response?.data?.errors) {
        const errorMessage = err.response.data.errors
          .map(error => error.msg)
          .join(', ');
        throw new Error(errorMessage);
      }
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      navigate('/login');
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
