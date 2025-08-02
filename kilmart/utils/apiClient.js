import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const apiClient = axios.create({
  baseURL: 'http://168.231.114.1/api/',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach access token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('access');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('Error getting token from SecureStore:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Refresh token on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isTokenExpired =
      error.response?.status === 401 &&
      error.response?.data?.code === 'token_not_valid' &&
      !originalRequest._retry;

    if (isTokenExpired) {
      originalRequest._retry = true;

      try {
        const refresh = await SecureStore.getItemAsync('refresh');
        if (!refresh) throw new Error('No refresh token found');

        // Request new access token
        const response = await axios.post(
          'http://168.231.114.1/api/auth/jwt/refresh/',
          { refresh },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const newAccess = response.data.access;

        // Save new access token
        await SecureStore.setItemAsync('access', newAccess);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.log('Token refresh failed:', refreshError);
        // Optional: Clear tokens, redirect to login, etc.
        await SecureStore.deleteItemAsync('access');
        await SecureStore.deleteItemAsync('refresh');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
