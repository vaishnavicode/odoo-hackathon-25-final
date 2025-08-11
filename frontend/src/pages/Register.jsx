import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App.jsx';
import { ROUTES } from '../constants.js';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    user_email: 'admin',
    user_name: '',
    user_contact: '',
    user_password: '',
    confirm_password: '',
    user_role_id: 1 // Default role
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { register } = useAuth();
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
    
    if (!formData.user_name) {
      newErrors.user_name = 'Name is required';
    }
    
    if (!formData.user_contact) {
      newErrors.user_contact = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.user_contact.replace(/\D/g, ''))) {
      newErrors.user_contact = 'Please enter a valid 10-digit phone number';
    }
    
    if (!formData.user_password) {
      newErrors.user_password = 'Password is required';
    } else if (formData.user_password.length < 6) {
      newErrors.user_password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirm_password) {
      newErrors.confirm_password = 'Please confirm your password';
    } else if (formData.user_password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
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
      const { confirm_password, ...registerData } = formData;
      const response = await register(registerData);
      if (response.isSuccess) {
        navigate(ROUTES.LOGIN);
      } else {
        setErrors({ general: response.error || 'Registration failed' });
      }
    } catch (error) {
      setErrors({ general: 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h1>Rental Management</h1>
          <Link to={ROUTES.HOME} className="home-link">Home</Link>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="user_email">Your Email</label>
            <input
              type="email"
              id="user_email"
              name="user_email"
              value={formData.user_email}
              onChange={handleChange}
              className={errors.user_email ? 'error' : ''}
            />
            {errors.user_email && <span className="error-message">{errors.user_email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="user_name">Your Name</label>
            <input
              type="text"
              id="user_name"
              name="user_name"
              value={formData.user_name}
              onChange={handleChange}
              placeholder="e.g. John Doe"
              className={errors.user_name ? 'error' : ''}
            />
            {errors.user_name && <span className="error-message">{errors.user_name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="user_contact">Your Phone</label>
            <input
              type="tel"
              id="user_contact"
              name="user_contact"
              value={formData.user_contact}
              onChange={handleChange}
              placeholder="e.g. 9098980900"
              className={errors.user_contact ? 'error' : ''}
            />
            {errors.user_contact && <span className="error-message">{errors.user_contact}</span>}
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

          <div className="form-group">
            <label htmlFor="confirm_password">Confirm Password</label>
            <div className="password-input">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirm_password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                className={errors.confirm_password ? 'error' : ''}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <i className={`fas fa-${showConfirmPassword ? 'eye-slash' : 'eye'}`}></i>
              </button>
            </div>
            {errors.confirm_password && <span className="error-message">{errors.confirm_password}</span>}
          </div>

          {errors.general && (
            <div className="error-message general-error">{errors.general}</div>
          )}

          <button type="submit" className="signin-btn" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'SIGN IN'}
          </button>

          <div className="register-links">
            <p>
              Already have an account?{' '}
              <Link to={ROUTES.LOGIN} className="login-link">
                Login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
