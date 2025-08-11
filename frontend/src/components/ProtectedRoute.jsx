import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../App.jsx';
import { ROUTES } from '../constants.js';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return children;
};

export default ProtectedRoute;
