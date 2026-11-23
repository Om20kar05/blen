import axios from 'axios';

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  // If envUrl is the inactive onrender URL or not provided, route to same-origin /api
  if (!envUrl || envUrl.includes('blen-hr-portal.onrender.com')) {
    return '/api';
  }
  return envUrl;
};

const api = axios.create({
  baseURL: getBaseUrl(),
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
