import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  StatusBar
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import apiClient from '../../utils/apiClient';

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    other_name: '',
    last_name: '',
    phone_number: '',
    password: '',
    confirm_password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    isSuccess: false,
  });

  const insets = useSafeAreaInsets();

  const displayAlert = (title, message, isSuccess = false) => {
    setShowAlert(false);
    setAlertConfig({ title, message, isSuccess });
    setShowAlert(true);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    const { email, first_name, last_name, phone_number, password, confirm_password } = formData;

    if (!email || !first_name || !last_name || !phone_number || !password || !confirm_password) {
      displayAlert('Error', 'Please fill in all required fields');
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      displayAlert('Error', 'Please enter a valid email address');
      return false;
    }

    if (!/^\d{10,}$/.test(phone_number.replace(/\D/g, ''))) {
      displayAlert('Error', 'Please enter a valid phone number (at least 10 digits)');
      return false;
    }

    if (password.length < 6) {
      displayAlert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirm_password) {
      displayAlert('Error', 'Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        phone_number: formData.phone_number.replace(/\D/g, ''),
      };

      console.log('Signup payload:', payload);

      const response = await apiClient.post('api/auth/users/', payload);

      console.log('Signup response:', response.data);

      // Handle different response structures
      if (response.status === 201) {
        // Success - check if response has success property or just assume success on 201
        if (response.data.success) {
          displayAlert('Success', 'Account created successfully! Please check your email for verification code.', true);
        } else {
          // If no success property but status is 201, still treat as success
          displayAlert('Success', 'Account created successfully! Please check your email for verification code.', true);
        }

        // Route to OTP verification screen after a short delay
        setTimeout(() => {
          setShowAlert(false);
          router.replace({
            pathname: '/verifyotp',
            params: {
              email: formData.email,
              purpose: 'signup'
            }
          });
        }, 2000);
      } else {
        // Handle other status codes
        displayAlert('Error', response.data.message || 'Signup failed. Please try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);

      let errorMessage = 'An error occurred during signup. Please try again.';

      if (error.response?.data) {
        const errorData = error.response.data;

        // Handle different error response structures
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (Array.isArray(errorData)) {
          errorMessage = errorData[0] || errorMessage;
        } else if (typeof errorData === 'object') {
          // Check for common error field names
          if (errorData.email) {
            errorMessage = Array.isArray(errorData.email) ? errorData.email[0] : errorData.email;
          } else if (errorData.phone_number) {
            errorMessage = Array.isArray(errorData.phone_number) ? errorData.phone_number[0] : errorData.phone_number;
          } else if (errorData.non_field_errors) {
            errorMessage = Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors[0] : errorData.non_field_errors;
          } else if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else {
            // Try to get first error message from object
            const firstErrorKey = Object.keys(errorData)[0];
            if (firstErrorKey) {
              const firstError = errorData[firstErrorKey];
              errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
            }
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      displayAlert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: '#fff',
      paddingTop: Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight 
    }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContainer,
            { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 20 : 20 }
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>
          </View>

          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email Address *"
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
              placeholderTextColor="#999"
            />

            <View style={styles.nameRow}>
              <TextInput
                style={[styles.input, styles.nameInput]}
                placeholder="First Name *"
                value={formData.first_name}
                onChangeText={(text) => handleInputChange('first_name', text)}
                editable={!isLoading}
                placeholderTextColor="#999"
              />
              <TextInput
                style={[styles.input, styles.nameInput]}
                placeholder="Last Name *"
                value={formData.last_name}
                onChangeText={(text) => handleInputChange('last_name', text)}
                editable={!isLoading}
                placeholderTextColor="#999"
              />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Other Names (Optional)"
              value={formData.other_name}
              onChangeText={(text) => handleInputChange('other_name', text)}
              editable={!isLoading}
              placeholderTextColor="#999"
            />

            <TextInput
              style={styles.input}
              placeholder="Phone Number *"
              value={formData.phone_number}
              onChangeText={(text) => handleInputChange('phone_number', text)}
              keyboardType="phone-pad"
              editable={!isLoading}
              placeholderTextColor="#999"
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Password *"
                value={formData.password}
                onChangeText={(text) => handleInputChange('password', text)}
                secureTextEntry={!showPassword}
                editable={!isLoading}
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <FontAwesome5
                  name={showPassword ? 'eye' : 'eye-slash'}
                  size={18}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Confirm Password *"
                value={formData.confirm_password}
                onChangeText={(text) => handleInputChange('confirm_password', text)}
                secureTextEntry={!showConfirmPassword}
                editable={!isLoading}
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <FontAwesome5
                  name={showConfirmPassword ? 'eye' : 'eye-slash'}
                  size={18}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.signupButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/login')} disabled={isLoading}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Custom Alert Modal */}
          <Modal
            visible={showAlert}
            transparent
            animationType="fade"
            onRequestClose={() => !alertConfig.isSuccess && setShowAlert(false)}
          >
            <View style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.5)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 20,
            }}>
              <View style={{
                backgroundColor: 'white',
                padding: 20,
                borderRadius: 12,
                minWidth: 280,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              }}>
                <Text style={{
                  fontFamily: 'inter-bold',
                  fontSize: 18,
                  color: alertConfig.isSuccess ? '#4CAF50' : '#D32F2F',
                  marginBottom: 10,
                  textAlign: 'center',
                }}>
                  {alertConfig.title}
                </Text>
                <Text style={{
                  fontFamily: 'inter-regular',
                  fontSize: 14,
                  textAlign: 'center',
                  marginBottom: 20,
                  color: '#333',
                  lineHeight: 20,
                }}>
                  {alertConfig.message}
                </Text>
                {!alertConfig.isSuccess && (
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#D32F2F',
                      padding: 12,
                      borderRadius: 8,
                      alignItems: 'center',
                    }}
                    onPress={() => setShowAlert(false)}
                  >
                    <Text style={{
                      color: 'white',
                      fontFamily: 'inter-medium',
                      fontSize: 16,
                    }}>
                      OK
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Modal>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontFamily: 'inter-bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'inter-regular',
    color: '#666',
  },
  formContainer: {
    width: '100%',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#eee',
    fontFamily: 'inter-regular',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  nameInput: {
    flex: 1,
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 15,
    padding: 5,
  },
  signupButton: {
    backgroundColor: '#f1b811',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  signupButtonDisabled: {
    opacity: 0.7,
  },
  signupButtonText: {
    fontSize: 18,
    fontFamily: 'inter-bold',
    color: '#fff',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 16,
    fontFamily: 'inter-regular',
    color: '#666',
  },
  loginLink: {
    fontSize: 16,
    fontFamily: 'inter-bold',
    color: '#000',
  },
});