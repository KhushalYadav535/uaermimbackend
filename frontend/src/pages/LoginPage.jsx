import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FaGoogle, FaFacebook, FaX } from "react-icons/fa6";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const emailRef = useRef(null);

  const { login, signInWithGoogle, signInWithFacebook, signInWithTwitter } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      const serverError =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Login failed. Please try again.';
      setError(serverError);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (providerFunc) => {
    setError('');
    setLoading(true);
    try {
      await providerFunc();
      navigate('/dashboard');
    } catch (err) {
      console.error('Social login error:', err);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-100">
      <div className="auth-card">
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Please log in to your account</p>

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              ref={emailRef}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="username"
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
                placeholder="Enter your password"
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
          </div>

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* // Social media  links */}
        <div className="social-login mt-6">
          <p className="text-center text-sm text-gray-500 mb-3">or continue with</p>
          <div className="flex item-center gap-4">
            <button
              onClick={() => handleSocialLogin(signInWithGoogle)}
              className="p-3 bg-white border rounded-full shadow hover:bg-gray-100 transition"
              aria-label="Login with Google"
              title="Login with Google"
            >
              <FaGoogle className="text-lg text-[#DB4437]" />
            </button>

            <button
              onClick={() => handleSocialLogin(signInWithFacebook)}
              className="p-3 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 transition"
              aria-label="Login with Facebook"
              title="Login with Facebook"
            >
              <FaFacebook className="text-lg" />
            </button>

            <button
              onClick={() => handleSocialLogin(signInWithTwitter)}
              className="p-3 bg-black text-white rounded-full shadow hover:bg-gray-900 transition"
              aria-label="Login with Twitter/X"
              title="Login with Twitter/X"
            >
              <FaX className="text-lg" />
            </button>
          </div>
        </div>


        <div className="auth-footer mt-4">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">Register</Link>
          </p>
          <p>
            Forgot your password?{' '}
            <Link to="/password-reset" className="auth-link">Reset Password</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
