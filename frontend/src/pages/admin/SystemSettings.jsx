import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiSettings, FiLock, FiMail, FiShield } from 'react-icons/fi';
import './SystemSettings.css';

export default function SystemSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.getSettings();
      setSettings(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordPolicyChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      password_policy: {
        ...prev.password_policy,
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateSettings(settings);
      setSuccess('Settings updated successfully');
      setError('');
    } catch (err) {
      console.error('Error updating settings:', err);
      setError('Failed to update settings');
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !settings) return <div>Loading...</div>;

  return (
    <div className="system-settings">
      <h1><FiSettings /> System Settings</h1>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="settings-section">
          <h2><FiMail /> Email Settings</h2>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={settings?.require_email_verification || false}
                onChange={(e) => handleChange('require_email_verification', e.target.checked)}
              />
              Require Email Verification
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h2><FiShield /> Two-Factor Authentication</h2>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={settings?.enforce_2fa || false}
                onChange={(e) => handleChange('enforce_2fa', e.target.checked)}
              />
              Enforce 2FA for All Users
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h2><FiLock /> Password Policy</h2>
          <div className="form-group">
            <label>Minimum Length:</label>
            <input
              type="number"
              min="8"
              max="32"
              value={settings?.password_policy?.min_length || 8}
              onChange={(e) => handlePasswordPolicyChange('min_length', parseInt(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={settings?.password_policy?.require_uppercase || false}
                onChange={(e) => handlePasswordPolicyChange('require_uppercase', e.target.checked)}
              />
              Require Uppercase Letters
            </label>
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={settings?.password_policy?.require_lowercase || false}
                onChange={(e) => handlePasswordPolicyChange('require_lowercase', e.target.checked)}
              />
              Require Lowercase Letters
            </label>
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={settings?.password_policy?.require_numbers || false}
                onChange={(e) => handlePasswordPolicyChange('require_numbers', e.target.checked)}
              />
              Require Numbers
            </label>
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={settings?.password_policy?.require_symbols || false}
                onChange={(e) => handlePasswordPolicyChange('require_symbols', e.target.checked)}
              />
              Require Special Characters
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h2>Session Settings</h2>
          <div className="form-group">
            <label>Session Timeout (seconds):</label>
            <input
              type="number"
              min="300"
              max="86400"
              value={settings?.session_timeout || 3600}
              onChange={(e) => handleChange('session_timeout', parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading}>
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
