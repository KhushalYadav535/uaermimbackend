import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function PasswordResetPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // TODO: Add password reset API call
      setMessage('Password reset link sent to your email');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed');
      setMessage('');
    }
  };

  return (
    <div className="auth-container">
      <h2>Reset Password</h2>
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
          />
        </div>
        <button type="submit">Send Reset Link</button>
      </form>
      
      <div className="auth-footer">
        <p>Remember your password? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
}
