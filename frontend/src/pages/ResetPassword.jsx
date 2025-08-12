import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../api.js';
import { ROUTES } from '../constants.js';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/ResetPassword.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Get token from URL query parameters
  const token = searchParams.get('token');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters long';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!token) {
      setErrors({ general: 'Invalid reset link. Please request a new password reset.' });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await authAPI.resetPassword(token, formData.newPassword);
      
      if (response.isSuccess) {
        setIsSuccess(true);
        toast.success('Password reset successfully!');
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate(ROUTES.LOGIN);
        }, 3000);
      } else {
        setErrors({ general: response.error || 'Failed to reset password' });
      }
    } catch (error) {
      setErrors({ general: 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-card">
          <div className="reset-password-header">
            <h1>Invalid Reset Link</h1>
            <p>The password reset link is invalid or has expired.</p>
          </div>
          
          <div className="action-buttons">
            <Link to={ROUTES.FORGOT_PASSWORD} className="request-reset-btn">
              Request New Reset
            </Link>
            <Link to={ROUTES.LOGIN} className="back-to-login">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-card">
          <div className="reset-password-header">
            <h1>Password Reset Successfully!</h1>
            <p>Your password has been updated successfully.</p>
          </div>
          
          <div className="success-message">
            <p>You will be redirected to the login page shortly.</p>
            <p>Please use your new password to sign in.</p>
          </div>
          
          <div className="action-buttons">
            <Link to={ROUTES.LOGIN} className="login-btn">
              Go to Login
            </Link>
          </div>
        </div>
        <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <div className="reset-password-header">
          <h1>Reset Your Password</h1>
          <p>Enter your new password below.</p>
        </div>

        <form onSubmit={handleSubmit} className="reset-password-form">
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Enter new password"
              className={errors.newPassword ? 'error' : ''}
              disabled={isLoading}
            />
            {errors.newPassword && <span className="error-message">{errors.newPassword}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
              className={errors.confirmPassword ? 'error' : ''}
              disabled={isLoading}
            />
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>

          {errors.general && (
            <div className="error-message general-error">{errors.general}</div>
          )}

          <button type="submit" className="reset-btn" disabled={isLoading}>
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="reset-password-links">
          <Link to={ROUTES.LOGIN} className="back-to-login">
            ← Back to Login
          </Link>
          <p className="need-help">
            Need help?{' '}
            <Link to={ROUTES.FORGOT_PASSWORD} className="forgot-password-link">
              Request new reset
            </Link>
          </p>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
    </div>
  );
};

export default ResetPassword;
