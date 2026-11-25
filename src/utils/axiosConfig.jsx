import axios from 'axios';
import { API_BASE_URL } from './apiConfig';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    if (error.response?.status === 403) {
      const msg = String(error.response?.data?.message || "").toLowerCase();
      if (msg.includes("deactivated")) {
        window.dispatchEvent(new CustomEvent("orgAccessBlocked", { detail: { reason: "deactivated" } }));
      } else if (msg.includes("validity expired") || msg.includes("subscription has expired")) {
        window.dispatchEvent(new CustomEvent("orgAccessBlocked", { detail: { reason: "expired" } }));
      }
    }

    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 (Unauthorized) and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          // No refresh token, logout user
          localStorage.removeItem('token');
          localStorage.removeItem('authToken');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
          if (error.response?.status === 403) {
      const msg = String(error.response?.data?.message || "").toLowerCase();
      if (msg.includes("deactivated")) {
        window.dispatchEvent(new CustomEvent("orgAccessBlocked", { detail: { reason: "deactivated" } }));
      } else if (msg.includes("validity expired") || msg.includes("subscription has expired")) {
        window.dispatchEvent(new CustomEvent("orgAccessBlocked", { detail: { reason: "expired" } }));
      }
    }

    return Promise.reject(error);
        }
        
        const response = await axiosInstance.post('/auth/refresh', {
          refreshToken
        });
        
        const { token: newToken } = response.data;
        
        // Update stored token
        localStorage.setItem('token', newToken);
        
        // Update authorization header
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
        // Retry the original request
        return axiosInstance(originalRequest);
        
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    if (error.response?.status === 403) {
      const msg = String(error.response?.data?.message || "").toLowerCase();
      if (msg.includes("deactivated")) {
        window.dispatchEvent(new CustomEvent("orgAccessBlocked", { detail: { reason: "deactivated" } }));
      } else if (msg.includes("validity expired") || msg.includes("subscription has expired")) {
        window.dispatchEvent(new CustomEvent("orgAccessBlocked", { detail: { reason: "expired" } }));
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
