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
  failedQueue.forEach(({ resolve, reject }) => 
    error ? reject(error) : resolve(token)
  );
  failedQueue = [];
};

// Endpoint configuration
const endpointConfig = {
  auth: ['auth/jwt/create/', 'api/auth/refresh/'],
  public: [
    'api/v1/products/', 'api/v1/categories/', 'api/v1/brands/', 'api/v1/search/',
    'api/v1/homepage/', 'api/v1/featured/', 'api/v1/promotions/',
    'api/v1/shipping-info/', 'api/v1/return-policy/', 'api/v1/contact-info/','api/categories/'
  ],
  protected: [
    'api/v1/create/', 'api/v1/orders/', 'api/v1/profile/', 'api/v1/wishlist/',
    'api/v1/cart/', 'api/auth/shipping-address/', 'api/v1/payment/'
  ]
};

// Helper functions
const matchesEndpoint = (url, endpoints) => 
  endpoints.some(endpoint => url?.includes(endpoint));

const getSecureItem = async (key) => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error(`Error accessing SecureStore for ${key}:`, error);
    return null;
  }
};

const setSecureItem = async (key, value) => {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error(`Error setting SecureStore for ${key}:`, error);
    throw error;
  }
};

const deleteSecureItems = async (keys) => {
  try {
    await Promise.all(keys.map(key => SecureStore.deleteItemAsync(key)));
  } catch (error) {
    console.error('Error clearing SecureStore items:', error);
  }
};

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    const { url } = config;
    
    // Skip auth header for auth endpoints
    if (matchesEndpoint(url, endpointConfig.auth)) {
      return config;
    }

    const isGuest = await getSecureItem('is_guest');
    
    // Handle guest users
    if (isGuest === 'true') {
      if (matchesEndpoint(url, endpointConfig.protected)) {
        throw new Error('Please sign in to access this feature');
      }
      return config;
    }

    // Add auth token for authenticated users
    const token = await getSecureItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  response => response,
  async (error) => {
    const { config: originalRequest, response } = error;
    
    // Skip token refresh for guests or non-401 errors
    const isGuest = await getSecureItem('is_guest');
    if (isGuest === 'true' || 
        response?.status !== 401 || 
        matchesEndpoint(originalRequest.url, [...endpointConfig.auth, 'api/auth/refresh/']) ||
        originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // Handle concurrent refresh requests
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
      const refreshToken = await getSecureItem('refresh_token');
      if (!refreshToken) throw new Error('No refresh token available');

      console.log('Refreshing access token...');
      
      const { data } = await axios.post(
        'https://kwirkmart.expertech.dev/api/auth/refresh/',
        { refresh: refreshToken }
      );

      if (!data.access) throw new Error('No access token received');

      // Store new tokens
      await Promise.all([
        setSecureItem('access_token', data.access),
        data.refresh && setSecureItem('refresh_token', data.refresh)
      ]);

      console.log('Access token refreshed successfully');

      // Update request and process queue
      originalRequest.headers.Authorization = `Bearer ${data.access}`;
      processQueue(null, data.access);

      return apiClient(originalRequest);
      
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError);
      
      await clearUserData();
      processQueue(new Error('Session expired. Please log in again.'));

      // Redirect to login if not on auth pages
      if (!matchesEndpoint(originalRequest.url, ['/login', '/auth/'])) {
        setTimeout(() => router.replace('/login'), 1000);
      }
      
      throw new Error('Session expired. Please log in again.');
    } finally {
      isRefreshing = false;
    }
  }
);

// Helper function to clear user data
const clearUserData = async () => {
  const isGuest = await getSecureItem('is_guest');
  const keysToDelete = [
    'access_token', 'refresh_token', 'user_id', 'user_email', 
    'user_name', 'user_phone', 'is_verified', 'must_change_password', 'token_expiry'
  ];

  await deleteSecureItems(keysToDelete);
  
  // Restore guest mode
  if (isGuest === 'true') {
    await setSecureItem('is_guest', 'true');
  }
  
  console.log('User data cleared (guest mode preserved)');
};

// Export helper functions
export const isGuestUser = () => getSecureItem('is_guest').then(val => val === 'true');
export const setGuestMode = (isGuest) => 
  isGuest ? setSecureItem('is_guest', 'true') : SecureStore.deleteItemAsync('is_guest');

export const isPublicEndpoint = (url) => matchesEndpoint(url, endpointConfig.public);
export const isProtectedEndpoint = (url) => matchesEndpoint(url, endpointConfig.protected);

export { clearUserData };
export default apiClient;