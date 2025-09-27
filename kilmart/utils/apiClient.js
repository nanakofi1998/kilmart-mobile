import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

const apiClient = axios.create({
  baseURL: 'https://kwirkmart.expertech.dev/',
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    // Skip Authorization header for auth endpoints
    const authEndpoints = ['auth/jwt/create/', 'auth/jwt/refresh/'];
    if (authEndpoints.some(endpoint => config.url?.includes(endpoint))) {
      return config;
    }

    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error accessing SecureStore for token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if it's a 401 error and not a refresh request or login request
    if (error.response?.status !== 401 || 
        originalRequest.url?.includes('auth/jwt/refresh/') ||
        originalRequest.url?.includes('auth/jwt/create/')) {
      return Promise.reject(error);
    }

    // Check if this request has already been retried
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // If already refreshing, add to queue
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ 
          resolve: (token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          }, 
          reject 
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      console.log('Refreshing access token...');
      
      // Request new access token using refresh token
      const response = await axios.post(
        'https://kwirkmart.expertech.dev/auth/jwt/refresh/',
        { refresh: refreshToken }
      );

      const newAccessToken = response.data.access;
      
      if (!newAccessToken) {
        throw new Error('No access token received from refresh');
      }

      // Store the new access token
      await SecureStore.setItemAsync('access_token', newAccessToken);
      console.log('Access token refreshed successfully');

      // Update the Authorization header for the original request
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      // Process any queued requests with the new token
      processQueue(null, newAccessToken);

      // Retry the original request with the new token
      return apiClient(originalRequest);
      
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError);
      
      // Clear all stored data
      await clearUserData();
      
      // Process queued requests with error
      processQueue(new Error('Session expired. Please log in again.'));

      // Redirect to login page
      if (!originalRequest.url?.includes('/login')) {
        router.replace('/login');
      }
      
      return Promise.reject(new Error('Session expired. Please log in again.'));
    } finally {
      isRefreshing = false;
    }
  }
);

// Helper function to clear all user data
const clearUserData = async () => {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync('access_token'),
      SecureStore.deleteItemAsync('refresh_token'),
      SecureStore.deleteItemAsync('user_id'),
      SecureStore.deleteItemAsync('user_email'),
      SecureStore.deleteItemAsync('user_name'),
      SecureStore.deleteItemAsync('user_phone'),
      SecureStore.deleteItemAsync('is_verified'),
      SecureStore.deleteItemAsync('must_change_password'),
    ]);
    console.log('All user data cleared');
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
};

// Export the clearUserData function for use in logout
export { clearUserData };

export default apiClient;