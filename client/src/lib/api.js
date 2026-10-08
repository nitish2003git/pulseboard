import axios from 'axios';

// In dev, Vite proxies /api to the backend. In production set VITE_API_URL
// to the deployed API origin (e.g. https://pulseboard-api.onrender.com).
const baseURL = (import.meta.env.VITE_API_URL || '') + '/api';

const api = axios.create({ baseURL });

// Attach the JWT to every request if we have one.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pb-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalize error messages and auto-logout on 401.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    if (error.response?.status === 401 && !location.pathname.startsWith('/login')) {
      localStorage.removeItem('pb-token');
      localStorage.removeItem('pb-user');
      // Soft redirect; AuthContext will pick up the cleared state.
      if (!location.pathname.startsWith('/register')) location.href = '/login';
    }
    return Promise.reject(new Error(message));
  }
);

export default api;
