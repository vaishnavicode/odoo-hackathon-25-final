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

  USER_PROFILE: '/user/profile/',

  VENDOR_REPORT: '/vendor/report/',

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
    // Try to create order using POST first, then fall back to GET if that fails
    console.log("Attempting to create order with cart data:", cartData);
    
    // Validate cart data
    if (!cartData || !Array.isArray(cartData) || cartData.length === 0) {
      throw new Error("Invalid cart data provided for checkout");
    }
    
    // Check if we have the required authorization token
    const token = localStorage.getItem('access_token');
    console.log("Authorization token available:", !!token);
    
    // Log the first cart item to see its structure
    if (cartData.length > 0) {
      console.log("First cart item structure:", cartData[0]);
      console.log("All available fields in first item:", Object.keys(cartData[0]));
    }
    
    // Try different possible ID field combinations
    const possibleIdFields = ['product_id', 'id', 'cart_item_id', 'productId', 'productId'];
    let productIds = [];
    
    for (const field of possibleIdFields) {
      const ids = cartData.map(item => item[field]).filter(Boolean);
      if (ids.length > 0) {
        console.log(`Found IDs using field '${field}':`, ids);
        productIds = ids;
        break;
      }
    }
    
    // If no IDs found with standard fields, try to extract from any field that looks like an ID
    if (productIds.length === 0) {
      for (const item of cartData) {
        for (const [key, value] of Object.entries(item)) {
          if (typeof value === 'number' && value > 0 && key.toLowerCase().includes('id')) {
            console.log(`Found potential ID field '${key}' with value:`, value);
            productIds.push(value);
          }
        }
      }
    }
    
    console.log("Final product IDs to send:", productIds);
    
    if (productIds.length === 0) {
      throw new Error("No valid product IDs found in cart data");
    }
    
    try {
      // First try POST to create endpoint with cart data
      console.log("Trying POST to create order endpoint:", API_ENDPOINTS.ORDERS_CREATE);
      
      // Try different data formats that the backend might expect
      const postDataFormats = [
        { cart_items: cartData },
        { product_ids: productIds },
        { products: productIds },
        { items: cartData },
        { cart: cartData },
        // Try sending just the IDs in different formats
        { product_ids: productIds.join(',') },
        { products: productIds.join(',') },
        { cart_items: productIds.join(',') },
        // Try sending the data as the backend might expect it
        { ...cartData[0] }, // Send first item's data
        { items: productIds }, // Send just the IDs array
        { cart: productIds } // Send IDs as cart
      ];
      
      for (const postData of postDataFormats) {
        try {
          console.log("Trying POST with data format:", postData);
          const response = await api.post(API_ENDPOINTS.ORDERS_CREATE, postData);
          console.log("Orders API POST response:", response);
          return response.data;
        } catch (error) {
          console.log(`POST with format ${JSON.stringify(postData)} failed:`, error.response?.status, error.response?.data);
          if (error.response?.status !== 400 && error.response?.status !== 422) {
            // If it's not a validation error, break and try GET
            break;
          }
        }
      }
      
      // If all POST attempts failed, try GET
      console.log("All POST attempts failed, trying GET to orders endpoint:", API_ENDPOINTS.ORDERS);
      const queryParams = `?cart_items=${productIds.join(',')}`;
      console.log("GET request URL:", `${API_ENDPOINTS.ORDERS}${queryParams}`);
      const response = await api.get(`${API_ENDPOINTS.ORDERS}${queryParams}`);
      console.log("Orders API GET response:", response);
      return response.data;
      
    } catch (error) {
      console.log("All checkout attempts failed:", error);
      throw error;
    }
  },
};

export default api;
