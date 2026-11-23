import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Request interceptor: attach JWT bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('blen_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401s and standardize error messages
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    
    // Auto-logout on token expiration if not on login page
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('blen_token');
      localStorage.removeItem('blen_user');
      window.location.href = '/login?expired=true';
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
