import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App.jsx';
import { ROUTES } from '../constants.js';
import '../styles/Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    user_email: '',
    user_password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

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
    
    if (!formData.user_email) {
      newErrors.user_email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.user_email)) {
      newErrors.user_email = 'Please enter a valid email';
    }
    
    if (!formData.user_password) {
      newErrors.user_password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await login(formData);
      if (response.isSuccess) {
        navigate(ROUTES.HOME);
      } else {
        setErrors({ general: response.error || 'Login failed' });
      }
    } catch (error) {
      setErrors({ general: 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Rental Management</h1>
          <Link to={ROUTES.HOME} className="home-link">Home</Link>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="user_email">Email</label>
            <input
              type="email"
              id="user_email"
              name="user_email"
              value={formData.user_email}
              onChange={handleChange}
              placeholder="Enter your email"
              className={errors.user_email ? 'error' : ''}
            />
            {errors.user_email && <span className="error-message">{errors.user_email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="user_password">Password</label>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                id="user_password"
                name="user_password"
                value={formData.user_password}
                onChange={handleChange}
                placeholder="Enter your password"
                className={errors.user_password ? 'error' : ''}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`fas fa-${showPassword ? 'eye-slash' : 'eye'}`}></i>
              </button>
            </div>
            {errors.user_password && <span className="error-message">{errors.user_password}</span>}
          </div>

          {errors.general && (
            <div className="error-message general-error">{errors.general}</div>
          )}

          <button type="submit" className="signin-btn" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'SIGN IN'}
          </button>

          <div className="login-links">
            <p>
              Don't have an account?{' '}
              <Link to={ROUTES.REGISTER} className="register-link">
                Register here
              </Link>
            </p>
            <Link to={ROUTES.FORGOT_PASSWORD} className="forgot-password">
              Forgot username / password
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
