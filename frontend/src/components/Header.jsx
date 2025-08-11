import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App.jsx';
import { ROUTES } from '../constants.js';
import './Header.css';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.HOME);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo/Brand */}
        <Link to={ROUTES.HOME} className="brand">
          <i className="fas fa-home"></i>
          <span>Rental Management</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="nav-desktop">
          <Link to={ROUTES.HOME} className="nav-link">Home</Link>
          <Link to={ROUTES.RENTAL_SHOP} className="nav-link">Rental Shop</Link>
          {isAuthenticated && (
            <Link to={ROUTES.WISHLIST} className="nav-link">Wishlist</Link>
          )}
        </nav>

        {/* Right side - Cart, User, Contact */}
        <div className="header-right">
          {isAuthenticated && (
            <Link to={ROUTES.CART} className="cart-icon">
              <i className="fas fa-shopping-cart"></i>
            </Link>
          )}
          
          {isAuthenticated ? (
            <div className="user-section">
              <div className="user-info">
                <i className="fas fa-user"></i>
                <span className="username">{user?.user_name || 'User'}</span>
                <div className="status-indicator"></div>
              </div>
              <div className="user-dropdown">
                <Link to={ROUTES.PROFILE}>Profile</Link>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
              </div>
            </div>
          ) : (
            <Link to={ROUTES.LOGIN} className="login-btn">Login</Link>
          )}
          
          <Link to={ROUTES.CONTACT} className="contact-btn">Contact us</Link>
        </div>

        {/* Mobile Menu Button */}
        <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
          <i className="fas fa-bars"></i>
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <nav className="nav-mobile">
          <Link to={ROUTES.HOME} onClick={toggleMobileMenu}>Home</Link>
          <Link to={ROUTES.RENTAL_SHOP} onClick={toggleMobileMenu}>Rental Shop</Link>
          {isAuthenticated && (
            <>
              <Link to={ROUTES.WISHLIST} onClick={toggleMobileMenu}>Wishlist</Link>
              <Link to={ROUTES.CART} onClick={toggleMobileMenu}>Cart</Link>
              <Link to={ROUTES.PROFILE} onClick={toggleMobileMenu}>Profile</Link>
              <button onClick={() => { handleLogout(); toggleMobileMenu(); }}>Logout</button>
            </>
          )}
          <Link to={ROUTES.CONTACT} onClick={toggleMobileMenu}>Contact us</Link>
        </nav>
      )}
    </header>
  );
};

export default Header;
