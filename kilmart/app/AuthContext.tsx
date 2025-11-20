import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Alert, AppState, AppStateStatus } from 'react-native';
import apiClient from '../utils/apiClient';

interface AuthContextType {
  user: any;
  isLoading: boolean;
  isRefreshing: boolean;
  isGuest: boolean;
  login: (accessToken: string, userData: any, mustChangePassword?: boolean, expiresIn?: number) => Promise<void>;
  logout: (silent?: boolean) => Promise<void>;
  loginAsGuest: () => Promise<void>;
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
  IS_GUEST: 'is_guest',
} as const;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
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
      checkTokenValidity();
    }
    appStateRef.current = nextAppState;
  };

  const checkAuthState = async () => {
    try {
      setIsLoading(true);
      const [accessToken, refreshToken, tokenExpiry, isGuestMode] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEYS.ACCESS_TOKEN),
        SecureStore.getItemAsync(TOKEN_KEYS.REFRESH_TOKEN),
        SecureStore.getItemAsync(TOKEN_KEYS.TOKEN_EXPIRY),
        SecureStore.getItemAsync(TOKEN_KEYS.IS_GUEST),
      ]);

      // Check if user is in guest mode
      if (isGuestMode === 'true') {
        setIsGuest(true);
        setUser({
          id: 'guest',
          email: '',
          full_name: 'Guest User',
          phone_number: '',
          is_verified: false,
          must_change_password: false,
          access_token: null,
          is_guest: true,
        });
        return;
      }

      if (accessToken) {
        const isTokenExpired = isTokenExpiring(tokenExpiry);

        if (isTokenExpired && refreshToken) {
          // Only try to refresh if we have a refresh token
          const refreshSuccess = await refreshAccessToken();
          if (!refreshSuccess) {
            await logout(true);
            return;
          }
        } else if (isTokenExpired && !refreshToken) {
          // Token expired but no refresh token available - logout
          console.log('Token expired but no refresh token available');
          await logout(true);
          return;
        } else {
          // Token is still valid, load user data
          await loadUserData();
          // Schedule token refresh before expiry
          scheduleTokenRefresh(tokenExpiry);
        }
      } else {
        // No tokens found, set to guest mode by default
        await loginAsGuest();
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      await loginAsGuest();
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
        isGuestMode,
      ] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEYS.USER_ID),
        SecureStore.getItemAsync(TOKEN_KEYS.USER_EMAIL),
        SecureStore.getItemAsync(TOKEN_KEYS.USER_NAME),
        SecureStore.getItemAsync(TOKEN_KEYS.USER_PHONE),
        SecureStore.getItemAsync(TOKEN_KEYS.IS_VERIFIED),
        SecureStore.getItemAsync(TOKEN_KEYS.MUST_CHANGE_PASSWORD),
        SecureStore.getItemAsync(TOKEN_KEYS.ACCESS_TOKEN),
        SecureStore.getItemAsync(TOKEN_KEYS.IS_GUEST),
      ]);

      setIsGuest(isGuestMode === 'true');

      if (userId && accessToken) {
        setUser({
          id: userId,
          email: userEmail || '',
          full_name: userName || '',
          phone_number: userPhone || '',
          is_verified: isVerified === 'true',
          must_change_password: mustChangePassword === 'true',
          access_token: accessToken,
          is_guest: isGuestMode === 'true',
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
    return Date.now() + (expiresIn * 1000);
  };

  const scheduleTokenRefresh = (tokenExpiry: string | null) => {
    if (!tokenExpiry || isGuest) return;

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

  // SINGLE refreshAccessToken function (remove the duplicate)
  const refreshAccessToken = async (): Promise<boolean> => {
    if (isGuest) return false;

    try {
      setIsRefreshing(true);
      
      // First check if we have a refresh token
      const existingRefreshToken = await SecureStore.getItemAsync(TOKEN_KEYS.REFRESH_TOKEN);
      const currentAccessToken = await SecureStore.getItemAsync(TOKEN_KEYS.ACCESS_TOKEN);
      
      if (!currentAccessToken) {
        console.log('No access token available for refresh');
        return false;
      }

      // TODO: Replace with your actual endpoints
      let refreshEndpoint = 'YOUR_EXTERNAL_REFRESH_ENDPOINT';
      let requestData = {};

      if (existingRefreshToken) {
        // If we have a refresh token, use it
        refreshEndpoint = 'YOUR_REFRESH_TOKEN_ENDPOINT';
        requestData = { refresh: existingRefreshToken };
      } else {
        // If no refresh token, use the access token to get a new one
        refreshEndpoint = 'YOUR_ACCESS_TOKEN_REFRESH_ENDPOINT';
        requestData = { access_token: currentAccessToken };
      }

      // Make API call to refresh endpoint
      const response = await apiClient.post(refreshEndpoint, requestData);

      const { access_token, refresh_token, expires_in } = response.data;

      if (!access_token) {
        console.log('No access token received from refresh endpoint');
        return false;
      }

      // Calculate new expiry time
      const newExpiry = calculateTokenExpiry(expires_in);

      // Store the new access token and update expiry
      const storagePromises = [
        SecureStore.setItemAsync(TOKEN_KEYS.ACCESS_TOKEN, access_token),
        SecureStore.setItemAsync(TOKEN_KEYS.TOKEN_EXPIRY, newExpiry.toString()),
      ];

      // Store refresh token if provided (this should happen on first refresh)
      if (refresh_token) {
        storagePromises.push(SecureStore.setItemAsync(TOKEN_KEYS.REFRESH_TOKEN, refresh_token));
      }

      await Promise.all(storagePromises);

      // Update user state with new access token
      setUser((prev: any) => ({
        ...prev,
        access_token: access_token,
      }));

      // Schedule next refresh
      scheduleTokenRefresh(newExpiry.toString());

      console.log('Token refreshed successfully');
      return true;
    } catch (error: any) {
      console.error('Token refresh failed:', error);

      // If refresh fails, logout user
      if (error.response?.status === 401) {
        console.log('Refresh failed, logging out');
        await logout(true);
      }

      return false;
    } finally {
      setIsRefreshing(false);
    }
  };

  const checkTokenValidity = async () => {
    if (isGuest) return;

    try {
      const tokenExpiry = await SecureStore.getItemAsync(TOKEN_KEYS.TOKEN_EXPIRY);
      if (tokenExpiry && isTokenExpiring(tokenExpiry)) {
        await refreshAccessToken();
      }
    } catch (error) {
      console.error('Error checking token validity:', error);
    }
  };

  // SINGLE login function (remove the duplicate)
  const login = async (
    accessToken: string,
    userData: any,
    mustChangePassword: boolean = false,
    expiresIn: number = 3600
  ) => {
    try {
      // Calculate expiry time
      const tokenExpiry = calculateTokenExpiry(expiresIn);
      console.log('Token expiry calculated:', new Date(tokenExpiry).toISOString());

      // Store only access token initially (no refresh token yet)
      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEYS.ACCESS_TOKEN, accessToken),
        SecureStore.setItemAsync(TOKEN_KEYS.TOKEN_EXPIRY, tokenExpiry.toString()),
        SecureStore.setItemAsync(TOKEN_KEYS.USER_ID, userData?.id?.toString() || ''),
        SecureStore.setItemAsync(TOKEN_KEYS.USER_EMAIL, userData?.email || ''),
        SecureStore.setItemAsync(TOKEN_KEYS.USER_NAME, userData?.full_name || ''),
        SecureStore.setItemAsync(TOKEN_KEYS.USER_PHONE, userData?.phone_number || ''),
        SecureStore.setItemAsync(TOKEN_KEYS.IS_VERIFIED, userData?.is_verified?.toString() || 'false'),
        SecureStore.setItemAsync(TOKEN_KEYS.MUST_CHANGE_PASSWORD, mustChangePassword.toString()),
        SecureStore.setItemAsync(TOKEN_KEYS.IS_GUEST, 'false'),
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
        is_guest: false,
      };

      setUser(userState);
      setIsGuest(false);

      // Schedule token refresh
      scheduleTokenRefresh(tokenExpiry.toString());

      console.log('Login successful, token expiry scheduled');

    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const loginAsGuest = async () => {
    try {
      await logout(true);
      await SecureStore.setItemAsync(TOKEN_KEYS.IS_GUEST, 'true');

      const guestUser = {
        id: 'guest',
        email: '',
        full_name: 'Guest User',
        phone_number: '',
        is_verified: false,
        must_change_password: false,
        access_token: null,
        is_guest: true,
      };

      setUser(guestUser);
      setIsGuest(true);
      console.log('User logged in as guest');
    } catch (error) {
      console.error('Error during guest login:', error);
      throw error;
    }
  };

  const logout = async (silent: boolean = false) => {
    try {
      const deletePromises = Object.values(TOKEN_KEYS).map(key =>
        SecureStore.deleteItemAsync(key)
      );

      await Promise.all(deletePromises);

      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      setUser(null);
      setIsGuest(false);

      if (!silent) {
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
        if (isGuest) return config;

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
        if (isGuest) return Promise.reject(error);

        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          const refreshSuccess = await refreshAccessToken();
          if (refreshSuccess) {
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
  }, [isGuest]);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isRefreshing,
      isGuest,
      login,
      logout,
      loginAsGuest,
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