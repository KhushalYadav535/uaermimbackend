import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function SecuritySettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    requireEmailVerification: false,
    enforce2FA: false,
    enforce2FARoles: [],
    socialLoginProviders: {
      google: false,
      apple: false,
      facebook: false
    },
    requireEmailVerificationForSocial: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.getSecuritySettings();
        setSettings(data.settings);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch security settings');
      } finally {
        setLoading(false);
      }
    };

    if (user?.isAdmin) {
      fetchSettings();
    }
  }, [user]);

  const handleToggle = async (setting) => {
    try {
      setLoading(true);
      const newSettings = {
        ...settings,
        [setting]: !settings[setting]
      };
      await api.updateSecuritySettings(newSettings);
      setSettings(newSettings);
      setSuccess('Settings updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLoginToggle = async (provider) => {
    try {
      setLoading(true);
      const newSettings = {
        ...settings,
        socialLoginProviders: {
          ...settings.socialLoginProviders,
          [provider]: !settings.socialLoginProviders[provider]
        }
      };
      await api.updateSecuritySettings(newSettings);
      setSettings(newSettings);
      setSuccess('Social login settings updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update social login settings');
    } finally {
      setLoading(false);
    }
  };

  if (!user?.isAdmin) {
    return <div>Unauthorized</div>;
  }

  if (loading) {
    return <div>Loading security settings...</div>;
  }

  return (
    <div className="admin-container">
      <h1>Security Settings</h1>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="settings-section">
        <h2>Authentication Settings</h2>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.requireEmailVerification}
              onChange={() => handleToggle('requireEmailVerification')}
              disabled={loading}
            />
            Require Email Verification
          </label>
          <p className="setting-description">
            Users must verify their email address before accessing the platform
          </p>
        </div>

        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.enforce2FA}
              onChange={() => handleToggle('enforce2FA')}
              disabled={loading}
            />
            Enforce Two-Factor Authentication
          </label>
          <p className="setting-description">
            Users must enable 2FA for their accounts
          </p>
        </div>

        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.requireEmailVerificationForSocial}
              onChange={() => handleToggle('requireEmailVerificationForSocial')}
              disabled={loading}
            />
            Require Email Verification for Social Logins
          </label>
          <p className="setting-description">
            Users must verify their email even when using social login
          </p>
        </div>
      </div>

      <div className="settings-section">
        <h2>Social Login Providers</h2>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.socialLoginProviders.google}
              onChange={() => handleSocialLoginToggle('google')}
              disabled={loading}
            />
            Google Login
          </label>
        </div>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.socialLoginProviders.apple}
              onChange={() => handleSocialLoginToggle('apple')}
              disabled={loading}
            />
            Apple Login
          </label>
        </div>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.socialLoginProviders.facebook}
              onChange={() => handleSocialLoginToggle('facebook')}
              disabled={loading}
            />
            Facebook Login
          </label>
        </div>
      </div>
    </div>
  );
} 