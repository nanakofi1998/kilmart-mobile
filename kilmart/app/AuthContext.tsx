import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Alert, AppState, AppStateStatus } from 'react-native';
import apiClient from '../utils/apiClient';

interface AuthContextType {
  user: any;
  isLoading: boolean;
  isRefreshing: boolean;
  login: (accessToken: string, refreshToken: string, userData: any, mustChangePassword?: boolean) => Promise<void>;
  logout: (silent?: boolean) => Promise<void>;
  updateUser: (userData: any) => void;
  refreshAccessToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token storage keys
const TOKEN_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_ID: 'user_id',
  USER_EMAIL: 'user_email',
  USER_NAME: 'user_name',
  USER_PHONE: 'user_phone',
  IS_VERIFIED: 'is_verified',
  MUST_CHANGE_PASSWORD: 'must_change_password',
  TOKEN_EXPIRY: 'token_expiry',
} as const;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimeoutRef = useRef<number | undefined>(undefined);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    checkAuthState();
    setupAppStateListener();
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  const setupAppStateListener = () => {
    AppState.addEventListener('change', handleAppStateChange);
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (
      appStateRef.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      // App came to foreground, check if token needs refresh
      checkTokenValidity();
    }
    appStateRef.current = nextAppState;
  };

  const checkAuthState = async () => {
    try {
      const [accessToken, refreshToken, tokenExpiry] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEYS.ACCESS_TOKEN),
        SecureStore.getItemAsync(TOKEN_KEYS.REFRESH_TOKEN),
        SecureStore.getItemAsync(TOKEN_KEYS.TOKEN_EXPIRY),
      ]);

      if (accessToken && refreshToken) {
        const isTokenExpired = isTokenExpiring(tokenExpiry);
        
        if (isTokenExpired) {
          // Token is expired or expiring soon, try to refresh
          const refreshSuccess = await refreshAccessToken();
          if (!refreshSuccess) {
            await logout(true); // Silent logout
            return;
          }
        } else {
          // Token is still valid, load user data
          await loadUserData();
          // Schedule token refresh before expiry
          scheduleTokenRefresh(tokenExpiry);
        }
      } else {
        // No tokens found, ensure clean state
        await logout(true);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      await logout(true);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      const [
        userId,
        userEmail,
        userName,
        userPhone,
        isVerified,
        mustChangePassword,
        accessToken,
      ] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEYS.USER_ID),
        SecureStore.getItemAsync(TOKEN_KEYS.USER_EMAIL),
        SecureStore.getItemAsync(TOKEN_KEYS.USER_NAME),
        SecureStore.getItemAsync(TOKEN_KEYS.USER_PHONE),
        SecureStore.getItemAsync(TOKEN_KEYS.IS_VERIFIED),
        SecureStore.getItemAsync(TOKEN_KEYS.MUST_CHANGE_PASSWORD),
        SecureStore.getItemAsync(TOKEN_KEYS.ACCESS_TOKEN),
      ]);

      if (userId && accessToken) {
        setUser({
          id: userId,
          email: userEmail || '',
          full_name: userName || '',
          phone_number: userPhone || '',
          is_verified: isVerified === 'true',
          must_change_password: mustChangePassword === 'true',
          access_token: accessToken,
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      throw error;
    }
  };

  const isTokenExpiring = (tokenExpiry: string | null): boolean => {
    if (!tokenExpiry) return true;
    
    const expiryTime = parseInt(tokenExpiry, 10);
    const currentTime = Date.now();
    const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
    
    return currentTime >= (expiryTime - bufferTime);
  };

  const calculateTokenExpiry = (expiresIn: number = 3600): number => {
    // Default to 1 hour if not provided
    return Date.now() + (expiresIn * 1000);
  };

  const scheduleTokenRefresh = (tokenExpiry: string | null) => {
    if (!tokenExpiry) return;

    const expiryTime = parseInt(tokenExpiry, 10);
    const currentTime = Date.now();
    const refreshTime = expiryTime - currentTime - (5 * 60 * 1000); // Refresh 5 minutes before expiry

    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    if (refreshTime > 0) {
      refreshTimeoutRef.current = setTimeout(async () => {
        const success = await refreshAccessToken();
        if (!success) {
          await logout(true);
        }
      }, refreshTime);
    } else {
      // Token is already expired or expiring soon
      refreshAccessToken().then(success => {
        if (!success) {
          logout(true);
        }
      });
    }
  };

  const refreshAccessToken = async (): Promise<boolean> => {
    try {
      setIsRefreshing(true);
      const refreshToken = await SecureStore.getItemAsync(TOKEN_KEYS.REFRESH_TOKEN);
      
      if (!refreshToken) {
        console.log('No refresh token available');
        return false;
      }

      // Make API call to refresh token
      const response = await apiClient.post('/auth/refresh/', {
        refresh: refreshToken,
      });

      const { access, refresh: newRefreshToken, expires_in } = response.data;

      // Calculate new expiry time
      const newExpiry = calculateTokenExpiry(expires_in);

      // Store new tokens
      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEYS.ACCESS_TOKEN, access),
        SecureStore.setItemAsync(TOKEN_KEYS.TOKEN_EXPIRY, newExpiry.toString()),
        ...(newRefreshToken ? [SecureStore.setItemAsync(TOKEN_KEYS.REFRESH_TOKEN, newRefreshToken)] : []),
      ]);

      // Update user state with new access token
      setUser((prev: any) => ({
        ...prev,
        access_token: access,
      }));

      // Schedule next refresh
      scheduleTokenRefresh(newExpiry.toString());

      console.log('Token refreshed successfully');
      return true;
    } catch (error: any) {
      console.error('Token refresh failed:', error);
      
      // If refresh token is invalid, logout user
      if (error.response?.status === 401) {
        console.log('Refresh token invalid, logging out');
        await logout(true);
      }
      
      return false;
    } finally {
      setIsRefreshing(false);
    }
  };

  const checkTokenValidity = async () => {
    try {
      const tokenExpiry = await SecureStore.getItemAsync(TOKEN_KEYS.TOKEN_EXPIRY);
      if (tokenExpiry && isTokenExpiring(tokenExpiry)) {
        await refreshAccessToken();
      }
    } catch (error) {
      console.error('Error checking token validity:', error);
    }
  };

  const login = async (
    accessToken: string, 
    refreshToken: string, 
    userData: any, 
    mustChangePassword: boolean = false,
    expiresIn: number = 3600
  ) => {
    try {
      const tokenExpiry = calculateTokenExpiry(expiresIn);

      // Store tokens and user data
      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEYS.ACCESS_TOKEN, accessToken),
        SecureStore.setItemAsync(TOKEN_KEYS.REFRESH_TOKEN, refreshToken),
        SecureStore.setItemAsync(TOKEN_KEYS.TOKEN_EXPIRY, tokenExpiry.toString()),
        SecureStore.setItemAsync(TOKEN_KEYS.USER_ID, userData?.id?.toString() || ''),
        SecureStore.setItemAsync(TOKEN_KEYS.USER_EMAIL, userData?.email || ''),
        SecureStore.setItemAsync(TOKEN_KEYS.USER_NAME, userData?.full_name || ''),
        SecureStore.setItemAsync(TOKEN_KEYS.USER_PHONE, userData?.phone_number || ''),
        SecureStore.setItemAsync(TOKEN_KEYS.IS_VERIFIED, userData?.is_verified?.toString() || 'false'),
        SecureStore.setItemAsync(TOKEN_KEYS.MUST_CHANGE_PASSWORD, mustChangePassword.toString()),
      ]);

      // Update user state
      const userState = {
        id: userData?.id || '',
        email: userData?.email || '',
        full_name: userData?.full_name || '',
        phone_number: userData?.phone_number || '',
        is_verified: Boolean(userData?.is_verified),
        must_change_password: mustChangePassword,
        access_token: accessToken,
      };

      setUser(userState);

      // Schedule token refresh
      scheduleTokenRefresh(tokenExpiry.toString());

    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = async (silent: boolean = false) => {
    try {
      // Clear all stored data
      const deletePromises = Object.values(TOKEN_KEYS).map(key => 
        SecureStore.deleteItemAsync(key)
      );
      
      await Promise.all(deletePromises);

      // Clear any scheduled refresh
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      setUser(null);

      if (!silent) {
        // Show logout message (optional)
        console.log('User logged out successfully');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      if (!silent) {
        Alert.alert('Error', 'Failed to logout properly');
      }
    }
  };

  const updateUser = (userData: any) => {
    setUser((prev: any) => {
      const updatedUser = { ...prev, ...userData };
      
      // Update stored user data as well
      if (userData.email) {
        SecureStore.setItemAsync(TOKEN_KEYS.USER_EMAIL, userData.email);
      }
      if (userData.full_name) {
        SecureStore.setItemAsync(TOKEN_KEYS.USER_NAME, userData.full_name);
      }
      if (userData.phone_number) {
        SecureStore.setItemAsync(TOKEN_KEYS.USER_PHONE, userData.phone_number);
      }
      if (userData.is_verified !== undefined) {
        SecureStore.setItemAsync(TOKEN_KEYS.IS_VERIFIED, userData.is_verified.toString());
      }
      
      return updatedUser;
    });
  };

  // Add axios interceptor for automatic token refresh on API calls
  useEffect(() => {
    const requestInterceptor = apiClient.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync(TOKEN_KEYS.ACCESS_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    const responseInterceptor = apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          const refreshSuccess = await refreshAccessToken();
          if (refreshSuccess) {
            // Retry the original request with new token
            const newToken = await SecureStore.getItemAsync(TOKEN_KEYS.ACCESS_TOKEN);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          } else {
            await logout();
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      apiClient.interceptors.request.eject(requestInterceptor);
      apiClient.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isRefreshing,
      login, 
      logout, 
      updateUser,
      refreshAccessToken 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;