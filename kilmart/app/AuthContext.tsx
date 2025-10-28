import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

interface AuthContextType {
  user: any;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, userData: any, mustChangePassword?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const accessToken = await SecureStore.getItemAsync('access_token');
      const userId = await SecureStore.getItemAsync('user_id');
      
      if (accessToken && userId) {
        const userEmail = await SecureStore.getItemAsync('user_email');
        const userName = await SecureStore.getItemAsync('user_name');
        const userPhone = await SecureStore.getItemAsync('user_phone');
        const isVerified = await SecureStore.getItemAsync('is_verified');
        const mustChangePassword = await SecureStore.getItemAsync('must_change_password');

        setUser({
          id: userId,
          email: userEmail || '',
          full_name: userName || '',
          phone_number: userPhone || '',
          is_verified: isVerified === 'true',
          must_change_password: mustChangePassword === 'true',
          access_token: accessToken
        });
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (accessToken: string, refreshToken: string, userData: any, mustChangePassword: boolean = false) => {
    try {
      console.log('Storing user data:', {
        id: userData?.id,
        email: userData?.email,
        full_name: userData?.full_name,
        phone_number: userData?.phone_number,
        is_verified: userData?.is_verified,
        must_change_password: mustChangePassword
      });

      // Store tokens and user data
      await Promise.all([
        SecureStore.setItemAsync('access_token', accessToken),
        SecureStore.setItemAsync('refresh_token', refreshToken),
        SecureStore.setItemAsync('user_id', userData?.id?.toString() || ''),
        SecureStore.setItemAsync('user_email', userData?.email || ''),
        SecureStore.setItemAsync('user_name', userData?.full_name || ''),
        SecureStore.setItemAsync('user_phone', userData?.phone_number || ''),
        SecureStore.setItemAsync('is_verified', userData?.is_verified?.toString() || 'false'),
        SecureStore.setItemAsync('must_change_password', mustChangePassword.toString()),
      ]);

      // Update user state
      const userState = {
        id: userData?.id || '',
        email: userData?.email || '',
        full_name: userData?.full_name || '',
        phone_number: userData?.phone_number || '',
        is_verified: Boolean(userData?.is_verified),
        must_change_password: mustChangePassword,
        access_token: accessToken
      };

      console.log('User state set to:', userState);
      setUser(userState);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = async () => {
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
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const updateUser = (userData: any) => {
    setUser((prev: any) => ({ ...prev, ...userData }));
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
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