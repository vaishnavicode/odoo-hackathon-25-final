import axios from 'axios';
import { API_ENDPOINTS as CONSTANTS_API_ENDPOINTS } from './constants.js';

// Define your API base URL and endpoints
export const API_BASE_URL = 'http://localhost:8000/api';

export const API_ENDPOINTS = {
  CATEGORIES: '/categories/',
  REGISTER: '/register/',
  LOGIN: '/login/',
  LOGOUT: '/logout/',
  FORGOT_PASSWORD: CONSTANTS_API_ENDPOINTS.FORGOT_PASSWORD,
  RESET_PASSWORD: CONSTANTS_API_ENDPOINTS.RESET_PASSWORD,
  USER_PRODUCTS: '/user/products/',

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

  USER_PROFILE: '/user/profile/',

  VENDOR_REPORT: '/vendor/report/',
  VENDOR_ORDERS: '/vendor/orders/',

  CART_ADD: '/cart/add/',
  CART_GET: '/cart/',
  CART_REMOVE: (id) => `/cart/remove/${id}/`,
  CART_CLEAR: '/cart/clear/',
  ORDERS: '/orders/',
  ORDERS_CREATE: '/orders/create/',
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
      console.log('Token found and added to headers');
    } else {
      console.log('No token found in localStorage');
    }
    
    // Enhanced logging for checkout requests
    if (config.url && (config.url.includes('orders') || config.url.includes('checkout'))) {
      console.log('🔍 CHECKOUT REQUEST DETAILS:');
      console.log('Method:', config.method?.toUpperCase());
      console.log('URL:', config.url);
      console.log('Headers:', config.headers);
      console.log('Data:', config.data);
      console.log('Query Params:', config.params);
    }
    
    console.log('API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      headers: config.headers,
      data: config.data
    });
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle unauthorized errors globally
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.log('API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message
    });
    
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
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.data.user));
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
      if (!userData || userData === 'undefined') {
        return null;
      }
      try {
        return JSON.parse(userData);
      } catch {
        return null;
      }
    },

  isAuthenticated: () => !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),

  fetchProfile: async () => {
    // Fetch profile data (user and wishlist)
    const response = await api.get(API_ENDPOINTS.USER_PROFILE);
    return response.data;
  },
  fetchUserProducts: async () => {
    // Fetch profile data (user and wishlist)
    const response = await api.get(API_ENDPOINTS.USER_PRODUCTS);
    return response.data;
  }
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
  getVendorOrders: async () => {
    const response = await api.get(API_ENDPOINTS.VENDOR_ORDERS);
    return response.data;
  }
};

export const cartAPI = {
  add: async (cartItem) => {
    const response = await api.post(API_ENDPOINTS.CART_ADD, cartItem);
    return response.data;
  },
  get: async () => {
    const response = await api.get(API_ENDPOINTS.CART_GET);
    return response.data;
  },
  remove: async (id) => {
    console.log("Removing cart item with ID:", id);
    console.log("Endpoint:", API_ENDPOINTS.CART_REMOVE(id));
    console.log("Full URL:", `${API_BASE_URL}${API_ENDPOINTS.CART_REMOVE(id)}`);
    console.log("Type of ID:", typeof id);
    console.log("ID value:", id);
    
    // Check if the ID is valid
    if (!id || id === undefined || id === null) {
      throw new Error("Invalid ID provided for cart item removal");
    }
    
    // Convert ID to string if it's a number, as some backends expect string IDs
    const idToSend = String(id);
    console.log("Sending ID as:", idToSend);
    
    const response = await api.delete(API_ENDPOINTS.CART_REMOVE(idToSend));
    console.log("Remove API response:", response);
    return response.data;
  },
  clear: async () => {
    const response = await api.delete(API_ENDPOINTS.CART_CLEAR);
    return response.data;
  },
};

export const ordersAPI = {
  create: async (cartData) => {
    if (!cartData || !Array.isArray(cartData) || cartData.length === 0) {
      throw new Error("Invalid cart data provided for checkout");
    }
    console.log("Sending cart data to create orders:", cartData);
    const response = await api.post(API_ENDPOINTS.ORDERS_CREATE, cartData);
    return response.data;
  },
};


export const fetchCategories = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.CATEGORIES);
    if (response.status === 200 && response.data.isSuccess) {
      return response.data.data; 
    }
    return [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};


export default api;
