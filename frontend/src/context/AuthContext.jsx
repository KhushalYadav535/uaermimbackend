import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const { data } = await api.getProfile();
      if (data.user) {
        // Add isSuperAdmin flag from backend user data
        data.user.isSuperAdmin = data.user.isSuperAdmin || false;
        setUser(data.user);
        // Redirect to dashboard if on login/register page
        if (['/login', '/register'].includes(location.pathname)) {
          navigate('/dashboard');
        }
      } else {
        throw new Error('No user data received');
      }
      return data;
    } catch (err) {
      console.error('Error fetching user:', err);
      logout();
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const { data } = await api.login({ email, password });
      if (!data.token) {
        throw new Error('No token received from server');
      }
      localStorage.setItem('token', data.token);
      setToken(data.token);
      await fetchUser();
      navigate('/dashboard');
      return data;
    } catch (err) {
      console.error('Login error:', err);
      if (err.response?.data?.error) {
        throw { error: err.response.data.error };
      } else if (err.response?.data?.message) {
        throw { error: err.response.data.message };
      } else {
        throw { error: 'Login failed. Please try again.' };
      }
    }
  };

  const register = async (userData) => {
    try {
      const { data } = await api.register(userData);
      if (!data.token) {
        throw new Error('No token received from server');
      }
      localStorage.setItem('token', data.token);
      setToken(data.token);
      await fetchUser();
      navigate('/dashboard');
      return data;
    } catch (err) {
      console.error('Registration error:', err);
      if (err.response?.data?.errors) {
        // Handle validation errors from express-validator
        const validationErrors = err.response.data.errors.reduce((acc, error) => {
          acc[error.param] = error.msg;
          return acc;
        }, {});
        throw { validationErrors };
      } else if (err.response?.data?.error) {
        throw { error: err.response.data.error };
      } else {
        throw { error: 'Registration failed. Please try again.' };
      }
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
      navigate('/login');
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    fetchUser
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
