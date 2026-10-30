import axios from 'axios';

// Base URL comes from the environment, falling back to the local backend.
const DEFAULT_PROD_API = 'https://doctor-appointment-booking-qup8.onrender.com/api';
const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? DEFAULT_PROD_API : 'http://localhost:5000/api');

// Shared axios instance used by every service module.
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach the JWT when present.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: unwrap { success, data } and normalise errors.
api.interceptors.response.use(
  (response) => {
    const body = response.data;
    // If the backend follows the { success, data } contract, return data only.
    if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
      return body.data;
    }
    return body;
  },
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.';

    // Handle expired / invalid sessions globally.
    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
