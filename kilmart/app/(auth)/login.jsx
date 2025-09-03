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

  const displayAlert = (title, message, isSuccess = false) => {
    setShowAlert(false);
    setAlertConfig({ title, message, isSuccess });
    setShowAlert(true);

    if (isSuccess) {
      setTimeout(() => {
        setShowAlert(false);
        router.replace('/home');
      }, 1500);
    }
  };

  const handleLogin = async () => {
    setLoading(true);

    if (!email || !password) {
      displayAlert('Error', 'Please enter both email and password');
      setTimeout(() => setLoading(false), 100);
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      displayAlert('Error', 'Please enter a valid email address');
      setTimeout(() => setLoading(false), 100);
      return;
    }

    const credentials = { email, password };

    try {
      const response = await apiClient.post('api/auth/jwt/create/', credentials);
      console.log('Login response:', JSON.stringify(response.data, null, 2));

      const { access, refresh, user } = response.data;

      if (typeof access !== 'string') {
        throw new Error('Invalid response: access token must be a string');
      }

      if (typeof refresh !== 'string') {
        throw new Error('Invalid response: refresh token must be a string');
      }

      const full_name = user?.full_name;
      if (typeof full_name !== 'string' && full_name !== null && full_name !== undefined) {
        throw new Error('Invalid response: full_name must be a string or null/undefined');
      }

      console.log('Storing tokens and user data:', {
        access: access.substring(0, 20) + '...',
        refresh: refresh.substring(0, 20) + '...',
        full_name,
      });
      await Promise.all([
        SecureStore.setItemAsync('access', access),
        SecureStore.setItemAsync('refresh', refresh),
        SecureStore.setItemAsync('user-name', full_name || ''),
      ]);

      displayAlert('Success', 'Login successful!', true);
    } catch (error) {
      console.error('Login error:', {
        message: error.message,
        status: error.response?.status,
        data: JSON.stringify(error.response?.data, null, 2),
      });
      let errorMessage = 'Failed to login. Please try again later.';
      if (error.response?.status === 401) {
        errorMessage = error.response?.data?.detail || error.response?.data?.non_field_errors?.[0] || 'Invalid email or password.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check your connection.';
      }
      displayAlert('Error', errorMessage);
      setTimeout(() => setLoading(false), 100);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }}>
      <Image
        source={require('./../../assets/images/bnr.png')}
        style={{
          width: '100%',
          height: 200,
          borderBottomLeftRadius: 10,
          borderBottomRightRadius: 10,
        }}
      />

      <View style={{ padding: 20 }}>
        <Text
          style={{
            fontSize: 28,
            fontFamily: 'inter-bold',
            marginBottom: 20,
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
        />
        <AuthInput
          placeholder="Password"
          secure
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={{ alignSelf: 'flex-end', marginVertical: 5 }}
          onPress={() => router.push('/forgot-password')}
        >
          <Text style={{ color: '#f1b811' }}>Forgot password?</Text>
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
              }}
            >
              Login
            </Text>
          )}
        </TouchableOpacity>

        <Text
          style={{
            textAlign: 'center',
            marginVertical: 10,
            fontFamily: 'inter-medium',
            fontStyle: 'italic',
          }}
        >
          Don't have an account?
        </Text>

        <TouchableOpacity
          style={{
            backgroundColor: '#b0b8ba',
            padding: 16,
            borderRadius: 12,
            marginVertical: 20,
          }}
          onPress={() => router.push('/signup')}
        >
          <Text
            style={{
              textAlign: 'center',
              color: '#000',
              fontFamily: 'inter-bold',
            }}
          >
            Sign up
          </Text>
        </TouchableOpacity>

        <AwesomeAlert
          show={showAlert}
          showProgress={false}
          title={alertConfig.title}
          message={alertConfig.message}
          closeOnTouchOutside={true}
          closeOnHardwareBackPress={false}
          showConfirmButton={!alertConfig.isSuccess}
          confirmText="OK"
          confirmButtonColor={alertConfig.isSuccess ? '#4CAF50' : '#DD6B55'}
          onConfirmPressed={() => setShowAlert(false)}
          onDismiss={() => setShowAlert(false)}
        />

        <Text style={{ marginTop: 20, textAlign: 'center', fontSize: 12, fontFamily: 'inter-medium' }}>
          By clicking create account you agree to{' '}
          <Text style={{ color: '#f1b811' }}>Terms of use</Text> and{' '}
          <Text style={{ color: '#f1b811' }}>Privacy policy</Text>
        </Text>
      </View>
    </ScrollView>
  );
}