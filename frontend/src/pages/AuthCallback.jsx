import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');

        if (token) {
          // Store the token and update auth context
          localStorage.setItem('token', token);
          await login(token);
          navigate('/dashboard');
        } else {
          console.error('No token received');
          navigate('/login');
        }
      } catch (error) {
        console.error('Error handling auth callback:', error);
        navigate('/login');
      }
    };

    handleCallback();
  }, [location, navigate, login]);

  return (
    <div className="auth-callback">
      <div className="loading-spinner"></div>
      <p>Please wait while we complete your authentication...</p>
    </div>
  );
};

export default AuthCallback;
