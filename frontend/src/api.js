import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS, STORAGE_KEYS } from './constants.js';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  // Register new user
  register: async (userData) => {
    const response = await api.post(API_ENDPOINTS.REGISTER, userData);
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post(API_ENDPOINTS.LOGIN, credentials);
    if (response.data.isSuccess) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.data.data.access_token);
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.data));
    }
    return response.data;
  },

  // Logout user
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

  // Get current user data
  getCurrentUser: () => {
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },
};

// Products API functions
export const productsAPI = {
  // Get all products
  getAll: async (page = 1, pageSize = 10) => {
    const response = await api.get(`${API_ENDPOINTS.PRODUCTS}?page=${page}&page_size=${pageSize}`);
    return response.data;
  },

  // Get single product
  getById: async (id) => {
    const response = await api.get(API_ENDPOINTS.PRODUCT_DETAIL(id));
    return response.data;
  },

  // Create new product
  create: async (productData) => {
    const response = await api.post(API_ENDPOINTS.PRODUCTS, productData);
    return response.data;
  },

  // Update product
  update: async (id, productData) => {
    const response = await api.put(API_ENDPOINTS.PRODUCT_UPDATE(id), productData);
    return response.data;
  },

  // Delete product
  delete: async (id) => {
    const response = await api.delete(API_ENDPOINTS.PRODUCT_DELETE(id));
    return response.data;
  },

  // Get product prices
  getPrices: async (id) => {
    const response = await api.get(API_ENDPOINTS.PRODUCT_PRICES(id));
    return response.data;
  },

  // Create product price
  createPrice: async (id, priceData) => {
    const response = await api.post(API_ENDPOINTS.PRODUCT_PRICES(id), priceData);
    return response.data;
  },

  // Update product price
  updatePrice: async (id, priceId, priceData) => {
    const response = await api.put(API_ENDPOINTS.PRODUCT_PRICE_UPDATE(id, priceId), priceData);
    return response.data;
  },

  // Delete product price
  deletePrice: async (id, priceId) => {
    const response = await api.delete(API_ENDPOINTS.PRODUCT_PRICE_DELETE(id, priceId));
    return response.data;
  },
};

export const wishlistAPI = {
  toggle: async (productId) => {
    const response = await api.post(`/wishlist/toggle/${productId}/`);
    return response.data;
  },
};

export default api;