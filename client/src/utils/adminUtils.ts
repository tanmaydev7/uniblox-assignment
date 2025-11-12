import axios from "axios";
import { useAdminAuthStore } from '../store/adminAuthStore';

export const adminAxiosInstance = axios.create({
  baseURL: process.env.BACKEND_BASE_URL
});

// Add token to requests if available
adminAxiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors (unauthorized)
adminAxiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth on unauthorized
      localStorage.removeItem('adminToken');
      useAdminAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

