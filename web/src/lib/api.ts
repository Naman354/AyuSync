import axios from 'axios';

/**
 * Retrieves the backend base URL strictly from environment variables (VITE_API_URL).
 * If undefined, falls back to the current origin / relative endpoint so no external URL is hardcoded.
 */
const rawUrl = (import.meta.env.VITE_API_URL || '').trim();

// Root server host
export const getBaseServerUrl = (): string => {
  if (!rawUrl) {
    return typeof window !== 'undefined' ? window.location.origin : '';
  }
  return rawUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
};

// REST API base URL
export const getApiBaseUrl = (): string => {
  const base = getBaseServerUrl();
  return base ? `${base}/api` : '/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ayusync_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token on unauthorized
      localStorage.removeItem('ayusync_token');
      localStorage.removeItem('ayusync_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
export { api };
