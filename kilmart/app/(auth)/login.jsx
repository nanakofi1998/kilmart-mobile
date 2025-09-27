import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import apiClient from '../../utils/apiClient';
import * as SecureStore from 'expo-secure-store';
import AwesomeAlert from 'react-native-awesome-alerts';
import AuthInput from '../../components/AuthInput';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    isSuccess: false,
  });

  const router = useRouter();

  const displayAlert = (title, message, isSuccess = false, redirectPath = null) => {
    setShowAlert(false);
    setAlertConfig({ title, message, isSuccess });
    setShowAlert(true);

    if (isSuccess && redirectPath) {
      setTimeout(() => {
        setShowAlert(false);
        router.replace(redirectPath);
      }, 1500);
    }
  };

  const handleLogin = async () => {
    // Reset loading state properly
    setLoading(true);

    // Validation
    if (!email.trim() || !password.trim()) {
      displayAlert('Error', 'Please enter both email and password');
      setLoading(false);
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      displayAlert('Error', 'Please enter a valid email address');
      setLoading(false);
      return;
    }

    const credentials = { 
      email: email.trim().toLowerCase(), 
      password 
    };

    try {
      const response = await apiClient.post('api/auth/jwt/create/', credentials);
      console.log('Login response:', JSON.stringify(response.data, null, 2));

      const { access, refresh, user, must_change_password } = response.data;

      // Validate response structure
      if (typeof access !== 'string' || !access) {
        throw new Error('Invalid access token received');
      }

      if (typeof refresh !== 'string' || !refresh) {
        throw new Error('Invalid refresh token received');
      }

      if (!user || typeof user !== 'object') {
        throw new Error('Invalid user data received');
      }

      console.log('Storing tokens and user data:', {
        access: access.substring(0, 20) + '...',
        refresh: refresh.substring(0, 20) + '...',
        userId: user.id,
        fullName: user.full_name,
        isVerified: user.is_verified,
        mustChangePassword: must_change_password
      });

      // Store all necessary user data
      await Promise.all([
        SecureStore.setItemAsync('access_token', access),
        SecureStore.setItemAsync('refresh_token', refresh),
        SecureStore.setItemAsync('user_id', user.id.toString()),
        SecureStore.setItemAsync('user_email', user.email),
        SecureStore.setItemAsync('user_name', user.full_name || ''),
        SecureStore.setItemAsync('user_phone', user.phone_number || ''),
        SecureStore.setItemAsync('is_verified', user.is_verified.toString()),
        SecureStore.setItemAsync('must_change_password', must_change_password.toString()),
      ]);

      // Determine redirect path based on conditions
      let redirectPath = '/home';
      
      if (must_change_password) {
        redirectPath = '/change-password';
        displayAlert('Success', 'Login successful! Please change your password.', true, redirectPath);
      } else if (!user.is_verified) {
        redirectPath = '/verifyotp';
        displayAlert('Success', 'Login successful! Please verify your email.', true, redirectPath);
      } else {
        displayAlert('Success', 'Login successful!', true, redirectPath);
      }

    } catch (error) {
      console.error('Login error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      let errorMessage = 'Failed to login. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = error.response?.data?.detail || 
                      error.response?.data?.non_field_errors?.[0] || 
                      'Invalid email or password.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.email?.[0] || 
                      error.response?.data?.password?.[0] || 
                      'Invalid input data.';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many login attempts. Please try again later.';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message.includes('Invalid')) {
        errorMessage = error.message;
      }

      displayAlert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/forgot-pwd');
  };

  const handleSignUp = () => {
    router.push('/signup');
  };

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: '#fff' }}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <Image
        source={require('./../../assets/images/bnr.png')}
        style={{
          width: '100%',
          height: 200,
          borderBottomLeftRadius: 10,
          borderBottomRightRadius: 10,
        }}
        resizeMode="cover"
      />

      <View style={{ padding: 20, flex: 1 }}>
        <Text
          style={{
            fontSize: 28,
            fontFamily: 'inter-bold',
            marginBottom: 20,
            color: '#333',
          }}
        >
          Login
        </Text>

        <AuthInput
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!loading}
        />
        
        <AuthInput
          placeholder="Password"
          secure
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
          autoComplete="password"
          editable={!loading}
        />

        <TouchableOpacity
          style={{ alignSelf: 'flex-end', marginVertical: 10 }}
          onPress={handleForgotPassword}
          disabled={loading}
        >
          <Text style={{ 
            color: '#f1b811', 
            fontFamily: 'inter-medium',
            opacity: loading ? 0.5 : 1 
          }}>
            Forgot password?
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: '#f1b811',
            padding: 16,
            borderRadius: 12,
            marginVertical: 20,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: loading ? 0.7 : 1,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 3,
          }}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text
              style={{
                textAlign: 'center',
                color: '#fff',
                fontFamily: 'inter-bold',
                fontSize: 16,
              }}
            >
              Login
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ alignItems: 'center', marginVertical: 10 }}>
          <Text
            style={{
              textAlign: 'center',
              fontFamily: 'inter-medium',
              fontStyle: 'italic',
              color: '#666',
            }}
          >
            Don't have an account?
          </Text>
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: '#b0b8ba',
            padding: 16,
            borderRadius: 12,
            marginVertical: 10,
            opacity: loading ? 0.7 : 1,
          }}
          onPress={handleSignUp}
          disabled={loading}
        >
          <Text
            style={{
              textAlign: 'center',
              color: '#000',
              fontFamily: 'inter-bold',
              fontSize: 16,
            }}
          >
            Sign up
          </Text>
        </TouchableOpacity>

        <AwesomeAlert
          show={showAlert}
          showProgress={false}
          title={alertConfig.title}
          titleStyle={{
            fontFamily: 'inter-bold',
            fontSize: 18,
            color: alertConfig.isSuccess ? '#4CAF50' : '#D32F2F',
          }}
          message={alertConfig.message}
          messageStyle={{
            fontFamily: 'inter-regular',
            fontSize: 14,
            textAlign: 'center',
          }}
          closeOnTouchOutside={!alertConfig.isSuccess}
          closeOnHardwareBackPress={false}
          showConfirmButton={!alertConfig.isSuccess}
          confirmText="OK"
          confirmButtonColor={alertConfig.isSuccess ? '#4CAF50' : '#D32F2F'}
          confirmButtonStyle={{ paddingHorizontal: 20 }}
          confirmButtonTextStyle={{ fontFamily: 'inter-medium' }}
          onConfirmPressed={() => setShowAlert(false)}
          onDismiss={() => setShowAlert(false)}
        />

        <View style={{ marginTop: 'auto', paddingTop: 20 }}>
          <Text style={{ 
            textAlign: 'center', 
            fontSize: 12, 
            fontFamily: 'inter-regular',
            color: '#666',
            lineHeight: 16,
          }}>
            By clicking login you agree to our{' '}
            <Text style={{ color: '#f1b811' }}>Terms of use</Text> and{' '}
            <Text style={{ color: '#f1b811' }}>Privacy policy</Text>
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}