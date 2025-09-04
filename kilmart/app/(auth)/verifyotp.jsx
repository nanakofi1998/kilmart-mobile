import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import AwesomeAlert from 'react-native-awesome-alerts';
import apiClient from '../../utils/apiClient';

export default function VerifyOTP() {
  const { email, purpose } = useLocalSearchParams();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, title: '', message: '' });

  const showAlert = (title, message) => {
    setAlert({ show: true, title, message });
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) {
      showAlert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        email,
        otp,
      };

      const response = await apiClient.post('api/auth/verify-otp/', payload);
      
      if (response.data.success) {
        showAlert('Success', 'Email verified successfully!');
        
        setTimeout(() => {
          router.replace('/login');
        }, 2000);
      } else {
        showAlert('Error', response.data.message || 'OTP verification failed');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      
      let errorMessage = 'Failed to verify OTP. Please try again.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      showAlert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('api/auth/resend-new-otp/', { email, purpose: purpose || 'signup' });
      
      if (response.data.success) {
        showAlert('Success', 'New OTP sent to your email');
      } else {
        showAlert('Error', response.data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      showAlert('Error', 'Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Verify Email</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{'\n'}
          <Text style={styles.emailText}>{email}</Text>
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter OTP"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
          editable={!isLoading}
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

        <TouchableOpacity onPress={handleResendOTP} disabled={isLoading}>
          <Text style={styles.resendText}>Didn't receive code? Resend OTP</Text>
        </TouchableOpacity>
      </View>

      <AwesomeAlert
        show={alert.show}
        title={alert.title}
        message={alert.message}
        closeOnTouchOutside={true}
        showConfirmButton={true}
        confirmText="Okay"
        confirmButtonColor="#333"
        onConfirmPressed={() => setAlert({ ...alert, show: false })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'inter-regular',
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
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
  },
  verifyButton: {
    backgroundColor: '#f5bb00ff',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
    marginBottom: 20,
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
  },
});