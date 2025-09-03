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

// Request interceptor: Attach access token except for login endpoint
apiClient.interceptors.request.use(
  async (config) => {
    // Skip Authorization header for login endpoint
    if (config.url === 'auth/jwt/create/') {
      console.log(`Request to ${config.url}: No Authorization header added`);
      return config;
    }

    try {
      const token = await SecureStore.getItemAsync('access');
      console.log(`Request to ${config.url}:`, {
        hasToken: !!token,
        token: token ? token.substring(0, 20) + '...' : 'None',
      });
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.log('No access token found in SecureStore for request:', config.url);
      }
    } catch (error) {
      console.error('Error accessing SecureStore for token:', error);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', {
      message: error.message,
      axiosError: error.toJSON ? error.toJSON() : null,
    });
    return Promise.reject(error);
  }
);

// Response interceptor: Handle 401 errors
apiClient.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, {
      status: response.status,
      data: JSON.stringify(response.data, null, 2),
    });
    return response;
  },
  async (error) => {
    console.error('API error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: JSON.stringify(error.response?.data, null, 2),
      message: error.message,
      code: error.code,
      axiosError: error.toJSON ? error.toJSON() : null,
    });

    if (error.response?.status === 401 && error.config?.url !== 'auth/jwt/create/') {
      console.log('401 Unauthorized, clearing tokens and redirecting to login');
      await Promise.all([
        SecureStore.deleteItemAsync('access'),
        SecureStore.deleteItemAsync('refresh'),
        SecureStore.deleteItemAsync('user-name'),
      ]);
      router.replace('/login');
      return Promise.reject(new Error('Session expired. Please log in again.'));
    } else if (error.code === 'ERR_NETWORK') {
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }

    return Promise.reject(error);
  }
);

export default apiClient;