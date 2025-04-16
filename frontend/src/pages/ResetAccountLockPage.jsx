import { useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';

export default function ResetAccountLockPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      await api.resetAccountLock(email);
      setMessage('Account lock reset successfully. You can now try logging in again.');
      setEmail('');
    } catch (err) {
      console.error('Reset account lock error:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to reset account lock. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Reset Account Lock</h2>
        <p className="auth-subtitle">Enter your email to reset account lock</p>
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="Enter your email"
              autoComplete="email"
            />
          </div>
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Resetting...' : 'Reset Account Lock'}
          </button>
        </form>
        <div className="auth-footer">
          <p>
            Remembered your password? <Link to="/login" className="auth-link">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
