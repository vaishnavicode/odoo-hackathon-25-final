import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants.js';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Welcome to Rental Management</h1>
          <p>Discover a wide range of products available for rent. From electronics to furniture, we have everything you need.</p>
          <div className="hero-buttons">
            <Link to={ROUTES.RENTAL_SHOP} className="cta-button primary">
              Browse Products
            </Link>
            <Link to={ROUTES.REGISTER} className="cta-button secondary">
              Get Started
            </Link>
          </div>
        </div>
      </div>

      <div className="features-section">
        <div className="container">
          <h2>Why Choose Us?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <i className="fas fa-shipping-fast"></i>
              <h3>Fast Delivery</h3>
              <p>Quick and reliable delivery to your doorstep</p>
            </div>
            <div className="feature-card">
              <i className="fas fa-shield-alt"></i>
              <h3>Secure Payments</h3>
              <p>Safe and secure payment processing</p>
            </div>
            <div className="feature-card">
              <i className="fas fa-headset"></i>
              <h3>24/7 Support</h3>
              <p>Round the clock customer support</p>
            </div>
            <div className="feature-card">
              <i className="fas fa-undo"></i>
              <h3>Easy Returns</h3>
              <p>Hassle-free return and refund process</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
