import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Modal,
  ScrollView,
  Platform,
  StatusBar
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import apiClient from '../../utils/apiClient';

export default function VerifyOTP() {
  const { email, purpose } = useLocalSearchParams();
  const [otp, setOtp] = useState('');
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

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) {
      displayAlert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        email,
        otp,
      };

      console.log('Verifying OTP for:', email);

      const response = await apiClient.post('api/auth/verify-otp/', payload);

      console.log('OTP verification response:', response.data);

      // Handle successful OTP verification
      if (response.status === 200) {
        const { access } = response.data;

        if (access) {
          // Store the access token
          await SecureStore.setItemAsync('access_token', access);
          
          // If this is for email verification after signup, we might need to get user info
          if (purpose === 'signup') {
            console.log('Email verified successfully for signup');
            displayAlert('Success', 'Email verified successfully! You can now login.', true);
            
            setTimeout(() => {
              setShowAlert(false);
              router.replace('/login');
            }, 2000);
          } else {
            // For other purposes (like password reset verification)
            displayAlert('Success', 'Verification successful!', true);
            
            setTimeout(() => {
              setShowAlert(false);
              // Navigate to appropriate screen based on purpose
              if (purpose === 'password_reset') {
                router.replace({
                  pathname: '/change-password',
                  params: { email }
                });
              } else {
                router.replace('/login');
              }
            }, 2000);
          }
        } else {
          throw new Error('No access token received');
        }
      } else {
        displayAlert('Error', 'OTP verification failed');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      
      let errorMessage = 'Failed to verify OTP. Please try again.';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.otp) {
          errorMessage = Array.isArray(errorData.otp) ? errorData.otp[0] : errorData.otp;
        } else if (errorData.non_field_errors) {
          errorMessage = Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors[0] : errorData.non_field_errors;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      displayAlert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('api/auth/request-new-otp/', { 
        email, 
        purpose: purpose || 'signup' 
      });
      
      console.log('Resend OTP response:', response.data);
      
      // Handle success based on the actual response structure
      if (response.status === 200 || response.status === 201) {
        // Check for the success message in the response
        if (response.data.detail === "New OTP code sent successfully") {
          displayAlert('Success', 'New OTP sent to your email');
        } else if (response.data.message) {
          displayAlert('Success', response.data.message);
        } else {
          displayAlert('Success', 'New OTP sent successfully');
        }
      } else {
        displayAlert('Error', 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      
      let errorMessage = 'Failed to resend OTP. Please try again.';
      if (error.response?.data) {
        const errorData = error.response.data;
        
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.email) {
          errorMessage = Array.isArray(errorData.email) ? errorData.email[0] : errorData.email;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.non_field_errors) {
          errorMessage = Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors[0] : errorData.non_field_errors;
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
      <ScrollView 
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 20 : 20 }
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.title}>Verify Email</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={styles.emailText}>{email}</Text>
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter OTP"
            placeholderTextColor="#999"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            editable={!isLoading}
            selectionColor="#f1b811"
          />

          <TouchableOpacity
            style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]}
            onPress={handleVerifyOTP}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify OTP</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleResendOTP} 
            disabled={isLoading}
            style={{ opacity: isLoading ? 0.5 : 1, marginTop: 10 }}
          >
            <Text style={styles.resendText}>Didn't receive code? Resend OTP</Text>
          </TouchableOpacity>
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
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'inter-bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'inter-regular',
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  emailText: {
    fontFamily: 'inter-bold',
    color: '#000',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    fontSize: 18,
    color: '#333',
    borderWidth: 1,
    borderColor: '#eee',
    textAlign: 'center',
    width: '80%',
    fontFamily: 'inter-regular',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  verifyButton: {
    backgroundColor: '#f1b811',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  verifyButtonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    fontSize: 18,
    fontFamily: 'inter-bold',
    color: '#fff',
  },
  resendText: {
    fontSize: 16,
    fontFamily: 'inter-regular',
    color: '#666',
    textAlign: 'center',
  },
});