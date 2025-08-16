import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

// attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// normalize errors
api.interceptors.response.use(
  (r) => r,
  (err) => {
    const message = err?.response?.data?.message || err.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

export default api;
