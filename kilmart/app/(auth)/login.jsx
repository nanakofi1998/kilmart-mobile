import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../../utils/apiClient';
import { useAuth } from '../AuthContext';
import AuthInput from '../../components/AuthInput';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [gradientColors, setGradientColors] = useState(['#ffffff', '#f8f8f8', '#e8e8e8']);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    isSuccess: false,
  });

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, loginAsGuest } = useAuth();

  useEffect(() => {
    let animationFrame;
    let startTime = Date.now();

    const animateGradient = () => {
      const elapsed = Date.now() - startTime;
      const progress = (elapsed % 10000) / 10000;

      if (progress < 0.25) {
        const phase = progress / 0.25;
        setGradientColors([
          `hsl(55, ${95 + phase * 5}%, ${65 + phase * 10}%)`,
        ]);
      } else {
        const phase = (progress - 0.75) / 0.25;
        setGradientColors([
          `hsl(45, ${95 - phase * 15}%, ${60 - phase * 10}%)`,
          `hsl(50, ${95 - phase * 10}%, ${65 - phase * 5}%)`,
          `hsl(55, ${100 - phase * 5}%, ${70 - phase * 5}%)`
        ]);
      }

      animationFrame = requestAnimationFrame(animateGradient);
    };

    animateGradient();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

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
    setLoading(true);

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

      const { access, user, must_change_password } = response.data;

      if (typeof access !== 'string' || !access) {
        throw new Error('Invalid access token received');
      }

      if (!user || typeof user !== 'object') {
        throw new Error('Invalid user data received');
      }

      // Updated: Login with only access token (no refresh token)
      await login(access, user, must_change_password);

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

  const handleBrowseAsGuest = async () => {
    try {
      await loginAsGuest();
      router.replace('/home');
    } catch (error) {
      console.error('Error logging in as guest:', error);
      displayAlert('Error', 'Failed to browse as guest. Please try again.');
    }
  };

  const handleForgotPassword = () => {
    router.push('/forgot-pwd');
  };

  const handleSignUp = () => {
    router.push('/signup');
  };

  return (
    <LinearGradient
      colors={['#fff', '#fff', '#fff']}
      locations={[0, 0.5, 1]}
      style={{
        flex: 1,
        paddingTop: Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight
      }}
    >
      {/* Browse as Guest Button */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          top: Platform.OS === 'ios' ? insets.top + 10 : StatusBar.currentHeight + 10,
          right: 20,
          zIndex: 1000,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: '#f1b811'
        }}
        onPress={handleBrowseAsGuest}
        disabled={loading}
      >
        <Text style={{
          color: '#ffffff',
          fontFamily: 'inter-medium',
          fontSize: 14,
        }}>
          Browse as Guest
        </Text>
      </TouchableOpacity>

      <ScrollView
        style={{ flex: 1 }}
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

        <View style={{
          padding: 20,
          flex: 1,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom + 20 : 20
        }}>
          {/* Header Section */}
          <View style={{ marginBottom: 30 }}>
            <Text style={{
              fontSize: 32,
              fontFamily: 'inter-bold',
              marginBottom: 10,
              color: '#1a1a1a',
              textAlign: 'left',
            }}>
              Welcome Back
            </Text>
            <Text style={{
              fontSize: 16,
              fontFamily: 'inter-regular',
              color: '#666',
              textAlign: 'left',
            }}>
              Sign in to your account to continue
            </Text>
          </View>

          {/* Form Section */}
          <View style={{ marginBottom: 20 }}>
            <AuthInput
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!loading}
              iconName="mail-outline"
            />

            <AuthInput
              placeholder="Password"
              secure
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoComplete="password"
              editable={!loading}
              iconName="lock-closed-outline"
            />

            <TouchableOpacity
              style={{ alignSelf: 'flex-end', marginTop: 10 }}
              onPress={handleForgotPassword}
              disabled={loading}
            >
              <Text style={{
                color: '#1a1a1a',
                fontFamily: 'inter-bold',
                fontSize: 14,
                opacity: loading ? 0.5 : 1
              }}>
                Forgot password?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={{
              backgroundColor: '#1a1a1a',
              padding: 18,
              borderRadius: 12,
              marginBottom: 20,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              opacity: loading ? 0.7 : 1,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
              borderWidth: 2,
              borderColor: '#f1b811',
            }}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#f1b811" />
            ) : (
              <Text style={{
                textAlign: 'center',
                color: '#f1b811',
                fontFamily: 'inter-bold',
                fontSize: 18,
                letterSpacing: 0.5,
              }}>
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider Section */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 20,
          }}>
            <View style={{ flex: 1, height: 1, backgroundColor: '#ddd' }} />
            <Text style={{
              paddingHorizontal: 15,
              fontFamily: 'inter-medium',
              color: '#666',
              fontSize: 14
            }}>
              Don't have an account?
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: '#ddd' }} />
          </View>

          {/* Create Account Button */}
          <TouchableOpacity
            style={{
              backgroundColor: 'transparent',
              padding: 16,
              borderRadius: 12,
              marginBottom: 10,
              opacity: loading ? 0.7 : 1,
              borderWidth: 2,
              borderColor: '#1a1a1a',
            }}
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text style={{
              textAlign: 'center',
              color: '#1a1a1a',
              fontFamily: 'inter-bold',
              fontSize: 16,
            }}>
              Create New Account
            </Text>
          </TouchableOpacity>

          {/* Footer Section */}
          <View style={{ marginTop: 'auto', paddingTop: 30 }}>
            <Text style={{
              textAlign: 'center',
              fontSize: 12,
              fontFamily: 'inter-regular',
              color: '#666',
              lineHeight: 16,
            }}>
              By continuing, you agree to our{' '}
              <TouchableOpacity onPress={ () => Linking.openURL('https://kwirkmart.expertech.dev/privacy-policy/')}>
                <Text style={{ color: '#1a1a1a', fontFamily: 'inter-bold' }}>Terms of Service</Text> and{' '}
                <Text style={{ color: '#1a1a1a', fontFamily: 'inter-bold' }}>Privacy Policy</Text>
              </TouchableOpacity>
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Custom Alert Modal */}
      {showAlert && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <View style={{
            backgroundColor: 'white',
            padding: 24,
            borderRadius: 16,
            minWidth: 280,
            maxWidth: '80%',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
            borderWidth: 2,
            borderColor: alertConfig.isSuccess ? '#4CAF50' : '#D32F2F',
          }}>
            <Text style={{
              fontFamily: 'inter-bold',
              fontSize: 20,
              color: alertConfig.isSuccess ? '#4CAF50' : '#D32F2F',
              marginBottom: 12,
              textAlign: 'center',
            }}>
              {alertConfig.title}
            </Text>
            <Text style={{
              fontFamily: 'inter-regular',
              fontSize: 16,
              textAlign: 'center',
              marginBottom: 24,
              color: '#333',
              lineHeight: 22,
            }}>
              {alertConfig.message}
            </Text>
            {!alertConfig.isSuccess && (
              <TouchableOpacity
                style={{
                  backgroundColor: '#1a1a1a',
                  padding: 14,
                  borderRadius: 10,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#f1b811',
                }}
                onPress={() => setShowAlert(false)}
              >
                <Text style={{
                  color: '#f1b811',
                  fontFamily: 'inter-bold',
                  fontSize: 16,
                }}>
                  OK
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </LinearGradient>
  );
}