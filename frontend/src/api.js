import axios from 'axios';
import { API_ENDPOINTS as CONSTANTS_API_ENDPOINTS } from './constants.js';

// Define your API base URL and endpoints
export const API_BASE_URL = 'http://localhost:8000/api';

export const API_ENDPOINTS = {
  REGISTER: '/register/',
  LOGIN: '/login/',
  LOGOUT: '/logout/',
  FORGOT_PASSWORD: CONSTANTS_API_ENDPOINTS.FORGOT_PASSWORD,
  RESET_PASSWORD: CONSTANTS_API_ENDPOINTS.RESET_PASSWORD,

  PRODUCTS: '/products/',
  PRODUCT_CREATE: '/products/create/',
  PRODUCT_DETAIL: (id) => `/products/${id}/`,
  PRODUCT_UPDATE: (id) => `/products/${id}/update/`,
  PRODUCT_DELETE: (id) => `/products/${id}/delete/`,

  PRODUCT_PRICES: (id) => `/products/${id}/prices/`,
  PRODUCT_PRICE_CREATE: (id) => `/products/${id}/prices/create/`,
  PRODUCT_PRICE_DETAIL: (id, priceId) => `/products/${id}/prices/${priceId}/`,
  PRODUCT_PRICE_UPDATE: (id, priceId) => `/products/${id}/prices/${priceId}/update/`,
  PRODUCT_PRICE_DELETE: (id, priceId) => `/products/${id}/prices/${priceId}/delete/`,

  WISHLIST_TOGGLE: (productId) => `/user/wishlist/toggle/${productId}/`,

  VENDOR_REPORT: '/vendor/report/',

  CART_ADD: '/cart/add/',
  CART_GET: '/cart/',
  CART_REMOVE: (id) => `/cart/remove/${id}/`,

};

// Storage keys for tokens and user data
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  USER_DATA: 'user_data',
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Authorization header with token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle unauthorized errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (userData) => {
    const response = await api.post(API_ENDPOINTS.REGISTER, userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post(API_ENDPOINTS.LOGIN, credentials);
    if (response.data.isSuccess) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.data.data.access_token);
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.data));
    }
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post(API_ENDPOINTS.FORGOT_PASSWORD, { email });
    return response.data;
  },

  resetPassword: async (token, newPassword) => {
    const response = await api.post(API_ENDPOINTS.RESET_PASSWORD, { 
      token, 
      new_password: newPassword 
    });
    return response.data;
  },

  logout: async () => {
    try {
      await api.post(API_ENDPOINTS.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    }
  },

  getCurrentUser: () => {
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  },

  isAuthenticated: () => !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
};

// Products API
export const productsAPI = {
  getAll: async (page = 1, pageSize = 10) => {
    const response = await api.get(`${API_ENDPOINTS.PRODUCTS}?page=${page}&page_size=${pageSize}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(API_ENDPOINTS.PRODUCT_DETAIL(id));
    return response.data;
  },

  create: async (productData) => {
    const response = await api.post(API_ENDPOINTS.PRODUCT_CREATE, productData);
    return response.data;
  },

  update: async (id, productData) => {
    const response = await api.put(API_ENDPOINTS.PRODUCT_UPDATE(id), productData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(API_ENDPOINTS.PRODUCT_DELETE(id));
    return response.data;
  },

  getPrices: async (id) => {
    const response = await api.get(API_ENDPOINTS.PRODUCT_PRICES(id));
    return response.data;
  },

  createPrice: async (id, priceData) => {
    const response = await api.post(API_ENDPOINTS.PRODUCT_PRICE_CREATE(id), priceData);
    return response.data;
  },

  updatePrice: async (id, priceId, priceData) => {
    const response = await api.put(API_ENDPOINTS.PRODUCT_PRICE_UPDATE(id, priceId), priceData);
    return response.data;
  },

  deletePrice: async (id, priceId) => {
    const response = await api.delete(API_ENDPOINTS.PRODUCT_PRICE_DELETE(id, priceId));
    return response.data;
  },
};

// Wishlist API
export const wishlistAPI = {
  toggle: async (productId) => {
    const response = await api.post(API_ENDPOINTS.WISHLIST_TOGGLE(productId));
    return response.data;
  },
};

// Vendor API
export const vendorAPI = {
  getReport: async () => {
    const response = await api.get(API_ENDPOINTS.VENDOR_REPORT);
    return response.data;
  },
};

export const cartAPI = {
  add: async (cartItem) => {
    const { data } = await api.post(API_ENDPOINTS.CART_ADD, cartItem);
    return data;
  },
  get: async () => {
    const { data } = await api.get(API_ENDPOINTS.CART_GET);
    return data;
  },
  remove: async (id) => {
    const { data } = await api.delete(API_ENDPOINTS.CART_REMOVE(id));
    return data;
  },
};

export default api;
