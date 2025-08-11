// API Configuration
export const API_BASE_URL = 'http://localhost:8000/api';

// API Endpoints
export const API_ENDPOINTS = {
  REGISTER: '/register/',
  LOGIN: '/login/',
  LOGOUT: '/logout/',
  FORGOT_PASSWORD: '/login/forgot-password/',
  RESET_PASSWORD: '/login/reset-password/',

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
};

// Local Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  USER_DATA: 'user_data',
};

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  RENTAL_SHOP: '/rental-shop',
  PRODUCT_DETAIL: '/product/:id',
  WISHLIST: '/wishlist',
  CART: '/cart',
  PROFILE: '/profile',
  CONTACT: '/contact',
  REPORTING: '/reporting',
  CREATE_PRODUCT: '/create-product',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
};

// Product Categories (placeholder)
export const PRODUCT_CATEGORIES = [
  'Electronics',
  'Furniture',
  'Tools',
  'Sports Equipment',
  'Party Supplies',
  'Books',
  'Clothing',
  'Kitchen Appliances'
];

// Price Durations
export const PRICE_DURATIONS = [
  'hour',
  'day', 
  'week',
  'month',
  'year'
];
