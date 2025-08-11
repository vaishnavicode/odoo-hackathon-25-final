import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants.js';
import './NotFound.css';

const NotFound = () => {
  return (
    <div className="not-found-container">
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>The page you're looking for doesn't exist.</p>
      <Link to={ROUTES.HOME} className="home-link">Go Home</Link>
    </div>
  );
};

export default NotFound;
