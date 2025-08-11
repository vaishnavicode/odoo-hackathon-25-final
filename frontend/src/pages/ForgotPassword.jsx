import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../api.js';
import { ROUTES } from '../constants.js';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authAPI.forgotPassword(email);
      
      if (response.isSuccess) {
        setIsSubmitted(true);
        toast.success('Password reset instructions sent to your email!');
      } else {
        setError(response.error || 'Failed to send reset instructions');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="forgot-password-container">
        <div className="forgot-password-card">
          <div className="forgot-password-header">
            <h1>Check Your Email</h1>
            <p>We've sent password reset instructions to:</p>
            <p className="email-display">{email}</p>
          </div>

          <div className="instructions">
            <p>Please check your email and follow the instructions to reset your password.</p>
            <p>If you don't see the email, check your spam folder.</p>
            <p>You can also manually enter the reset token from your email below:</p>
          </div>

          <div className="token-input-section">
            <div className="form-group">
              <label htmlFor="token">Reset Token</label>
              <input
                type="text"
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter the token from your email"
                className="token-input"
              />
            </div>
          </div>

          <div className="action-buttons">
            <button 
              className="resend-btn"
              onClick={() => setIsSubmitted(false)}
            >
              Resend Email
            </button>
            <Link 
              to={token ? `${ROUTES.RESET_PASSWORD}?token=${token}` : ROUTES.RESET_PASSWORD} 
              className={`reset-password-link ${!token ? 'disabled' : ''}`}
              onClick={(e) => !token && e.preventDefault()}
            >
              Reset Password
            </Link>
            <Link to={ROUTES.LOGIN} className="back-to-login">
              Back to Login
            </Link>
          </div>
        </div>
        <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
      </div>
    );
  }

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="forgot-password-header">
          <h1>Forgot Password?</h1>
          <p>Enter your email address and we'll send you instructions to reset your password.</p>
        </div>

        <form onSubmit={handleSubmit} className="forgot-password-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className={error ? 'error' : ''}
              disabled={isLoading}
            />
            {error && <span className="error-message">{error}</span>}
          </div>

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Reset Instructions'}
          </button>
        </form>

        <div className="forgot-password-links">
          <Link to={ROUTES.LOGIN} className="back-to-login">
            ← Back to Login
          </Link>
          <p className="remember-password">
            Remember your password?{' '}
            <Link to={ROUTES.LOGIN} className="login-link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
    </div>
  );
};

export default ForgotPassword;
