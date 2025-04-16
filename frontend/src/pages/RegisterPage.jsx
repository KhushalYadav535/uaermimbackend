import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { FaGoogle, FaFacebook, FaXTwitter } from 'react-icons/fa6';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { signInWithGoogle, signInWithFacebook, signInWithTwitter } = useAuth();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field error when user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(prev => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password
      });
      navigate('/');
    } catch (err) {
      console.error('Registration error:', err);
      if (err.validationErrors) {
        setFieldErrors(err.validationErrors);
      } else if (err.response?.data?.errors) {
        // Handle express-validator errors
        const validationErrors = err.response.data.errors.reduce((acc, error) => {
          acc[error.param] = error.msg;
          return acc;
        }, {});
        setFieldErrors(validationErrors);
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (providerFn) => {
    try {
      await providerFn();
      navigate('/dashboard');
    } catch (err) {
      console.error('Social login error:', err);
      setError('Social login failed. Please try again.');
    }
  };
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-100">
      <div className="auth-card">
        <h2 className="auth-title">Register</h2>

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Enter your first name"
            />
            {fieldErrors.firstName && (
              <div className="error-message">{fieldErrors.firstName}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Enter your last name"
            />
            {fieldErrors.lastName && (
              <div className="error-message">{fieldErrors.lastName}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              autoComplete="username"
              placeholder="Enter your email"
            />
            {fieldErrors.email && (
              <div className="error-message">{fieldErrors.email}</div>
            )}
          </div>

          <div className="form-group password-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="new-password"
                placeholder="Create a strong password"
              />
              <button
                type="button"
                onClick={toggleShowPassword}
                className="show-password-btn"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {fieldErrors.password && (
              <div className="error-message">{fieldErrors.password}</div>
            )}
            <span className="password-hint">
              Password must contain at least 12 characters, including an uppercase letter, lowercase letter, number, and special character.
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
              autoComplete="new-password"
              placeholder="Re-enter your password"
            />
            {fieldErrors.confirmPassword && (
              <div className="error-message">{fieldErrors.confirmPassword}</div>
            )}
          </div>

          <div className="social-login mt-6">
            <p className="text-center text-sm text-gray-500 mb-3">or sign up with</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => handleSocialLogin(signInWithGoogle)}
                className="p-3 bg-white border rounded-full shadow hover:bg-gray-100 transition"
                aria-label="Register with Google"
                title="Register with Google"
              >
                <FaGoogle className="text-lg text-[#DB4437]" />
              </button>

              <button
                onClick={() => handleSocialLogin(signInWithFacebook)}
                className="p-3 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 transition"
                aria-label="Register with Facebook"
                title="Register with Facebook"
              >
                <FaFacebook className="text-lg" />
              </button>

              <button
                onClick={() => handleSocialLogin(signInWithTwitter)}
                className="p-3 bg-black text-white rounded-full shadow hover:bg-gray-900 transition"
                aria-label="Register with Twitter/X"
                title="Register with Twitter/X"
              >
                <FaXTwitter className="text-lg" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-button"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
