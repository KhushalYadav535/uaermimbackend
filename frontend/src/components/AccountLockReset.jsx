import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const AccountLockReset = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      await api.resetAccountLock(email);
      setMessage('Account lock reset successfully');
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset account lock');
    }
  };

  if (!user?.isSuperAdmin) {
    return null;
  }

  return (
    <div className="admin-section">
      <h2>Reset Account Lock</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">User Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter user's email"
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Reset Lock
        </button>
      </form>
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default AccountLockReset; 