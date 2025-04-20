import React from 'react';
import { FaGoogle, FaFacebook, FaTwitter } from 'react-icons/fa';
import '../styles/SocialLogin.css';

const SocialLogin = () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  const handleSocialLogin = (provider) => {
    window.location.href = `${BACKEND_URL}/api/auth/${provider}`;
  };

  return (
    <div className="social-login">
      <p className="social-login-text">Or continue with</p>
      <div className="social-buttons">
        <button
          className="social-button google"
          onClick={() => handleSocialLogin('google')}
        >
          <FaGoogle /> Google
        </button>
        <button
          className="social-button facebook"
          onClick={() => handleSocialLogin('facebook')}
        >
          <FaFacebook /> Facebook
        </button>
        <button
          className="social-button twitter"
          onClick={() => handleSocialLogin('twitter')}
        >
          <FaTwitter /> Twitter
        </button>
      </div>
    </div>
  );
};

export default SocialLogin;
