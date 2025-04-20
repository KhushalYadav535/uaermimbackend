import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { FaGoogle, FaFacebook, FaXTwitter, FaEyeSlash, FaRegEye } from 'react-icons/fa6';
import '../styles/Auth.css';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '', // Added username field
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [passwordMatchError, setPasswordMatchError] = useState('');
  const [passwordSuggestion, setPasswordSuggestion] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const errors = [];
    
    if (!formData.username) errors.push('Username is required');
    if (!formData.first_name) errors.push('First name is required');
    if (!formData.last_name) errors.push('Last name is required');
    if (!formData.email) errors.push('Email is required');
    if (!formData.password) errors.push('Password is required');
    if (!formData.confirm_password) errors.push('Please confirm your password');
    
    if (formData.password !== formData.confirm_password) {
      errors.push('Passwords do not match');
    }

    if (formData.password) {
      if (formData.password.length < 8) errors.push('Password must be at least 8 characters long');
      if (!/[A-Z]/.test(formData.password)) errors.push('Password must contain at least one uppercase letter');
      if (!/[a-z]/.test(formData.password)) errors.push('Password must contain at least one lowercase letter');
      if (!/[0-9]/.test(formData.password)) errors.push('Password must contain at least one number');
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) errors.push('Password must contain at least one special character');
    }

    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(''); // Clear errors when user types
    
    if (name === 'password') {
      checkPasswordStrength(value);
      if (formData.confirm_password && value !== formData.confirm_password) {
        setPasswordMatchError('Passwords do not match');
      } else {
        setPasswordMatchError('');
      }
    }

    if (name === 'confirm_password') {
      if (value !== formData.password) {
        setPasswordMatchError('Passwords do not match');
      } else {
        setPasswordMatchError('');
      }
    }
  };

  const checkPasswordStrength = (password) => {
    let strength = '';
    let suggestions = [];

    if (password.length < 8) {
      suggestions.push('Use at least 8 characters');
      strength = 'weak';
    }
    if (!/[A-Z]/.test(password)) {
      suggestions.push('Add an uppercase letter');
      strength = 'weak';
    }
    if (!/[a-z]/.test(password)) {
      suggestions.push('Add a lowercase letter');
      strength = 'weak';
    }
    if (!/[0-9]/.test(password)) {
      suggestions.push('Add a number');
      strength = 'weak';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      suggestions.push('Add a special character');
      strength = 'weak';
    }

    if (!strength && password.length >= 12) {
      strength = 'strong';
    } else if (!strength && password.length >= 8) {
      strength = 'medium';
    }

    setPasswordStrength(strength);
    setPasswordSuggestion(suggestions.join(', '));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate form
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('\n'));
      return;
    }

    setLoading(true);

    try {
      await register(formData);
      navigate('/login', { 
        state: { message: 'Registration successful! Please log in.' }
      });
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Account</h2>
        {error && (
          <div className="error-message">
            {error.split('\n').map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="first_name">First Name</label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="last_name">Last Name</label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaRegEye />}
              </button>
            </div>
            {passwordStrength && (
              <div className={`password-strength ${passwordStrength}`}>
                Password Strength: {passwordStrength}
              </div>
            )}
            {passwordSuggestion && (
              <div className="password-suggestion">
                {passwordSuggestion}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirm_password">Confirm Password</label>
            <div className="password-input">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirm_password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaRegEye />}
              </button>
            </div>
            {passwordMatchError && (
              <div className="error-message">
                {passwordMatchError}
              </div>
            )}
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-links">
          Already have an account? <Link to="/login">Log In</Link>
        </div>
      </div>
    </div>
  );
}
