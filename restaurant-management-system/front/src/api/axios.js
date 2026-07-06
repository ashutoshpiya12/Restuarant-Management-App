import axios from 'axios';

// Point this at your Django backend. Override with a .env file:
// REACT_APP_API_URL=http://127.0.0.1:8000/api
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach the access token to every request, if we have one.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If a request fails with 401, try once to refresh the access token.
let isRefreshing = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !isRefreshing) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        return Promise.reject(error);
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });
        localStorage.setItem('access_token', data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/admin/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
