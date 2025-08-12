import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authAPI } from './api.js';
import { ROUTES } from './constants.js';

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


// Import pages
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import RentalShop from './pages/RentalShop.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Wishlist from './pages/Wishlist.jsx';
import Cart from './pages/Cart.jsx';
import Profile from './pages/Profile.jsx';
import Contact from './pages/Contact.jsx';
import NotFound from './pages/NotFound.jsx';
import Reporting from './pages/Reporting.jsx';
import CreateProduct from './pages/CreateProduct.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';


// Import components
import Header from './components/Header.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import VendorOrders from './pages/VendorOrders.jsx';

// Create Auth Context
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    if (currentUser && authAPI.isAuthenticated()) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const response = await authAPI.login(credentials);
    if (response.isSuccess) {
      setUser(response.data);
    }
    return response;
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
  };

  const register = async (userData) => {
    return await authAPI.register(userData);
  };

  const value = {
    user,
    login,
    logout,
    register,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path={ROUTES.HOME} element={<Home />} />
              <Route path={ROUTES.LOGIN} element={<Login />} />
              <Route path={ROUTES.REGISTER} element={<Register />} />
              <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
              <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
              <Route path={ROUTES.RENTAL_SHOP} element={<RentalShop />} />
              <Route path={ROUTES.PRODUCT_DETAIL} element={<ProductDetail />} />
              <Route path={ROUTES.CONTACT} element={<Contact />} />

              
              {/* Protected Routes */}
              <Route
                path={ROUTES.VENDOR_ORDERS}
                element={
                  <ProtectedRoute>
                    <VendorOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.RENTAL_SHOP}
                element={
                  <ProtectedRoute>
                    <RentalShop />
                  </ProtectedRoute>
                }
              />

              <Route path={ROUTES.CREATE_PRODUCT} element={
                  <ProtectedRoute>
                    <CreateProduct />
                  </ProtectedRoute>
                } />

                <Route path={ROUTES.REPORTING} element={
                    <ProtectedRoute>
                      <Reporting />
                    </ProtectedRoute>
                  } />

              <Route path={ROUTES.WISHLIST} element={
                <ProtectedRoute>
                  <Wishlist />
                </ProtectedRoute>
              } />
              <Route path={ROUTES.CART} element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              } />
              <Route path={ROUTES.PROFILE} element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
                  {/* global toast container */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
