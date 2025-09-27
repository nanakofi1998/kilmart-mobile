import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import AwesomeAlert from 'react-native-awesome-alerts';
import apiClient from '../../utils/apiClient';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, title: '', message: '' });

  const showAlert = (title, message) => {
    setAlert({ show: true, title, message });
  };

  const handleSendResetLink = async () => {
    if (!email) {
      showAlert('Error', 'Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        email,
        purpose: 'password_reset'
      };

      const response = await apiClient.post('api/auth/request-password-reset/', payload);

      if (response.status === 200) {
        showAlert('Success', 'Password reset link has been sent to your email!');
        
        setTimeout(() => {
          router.back();
        }, 3000);
      } else {
        showAlert('Error', response.data.message || 'Failed to send reset link');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      
      let errorMessage = 'Failed to send reset link. Please try again.';
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

  const handleBackToLogin = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you a link to reset your password
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!isLoading}
        />

        <TouchableOpacity
          style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
          onPress={handleSendResetLink}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>Send Reset Link</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleBackToLogin} disabled={isLoading}>
          <Text style={styles.backText}>Back to Login</Text>
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
    lineHeight: 22,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#eee',
    textAlign: 'center',
    width: '80%',
  },
  sendButton: {
    backgroundColor: '#f5bb00ff',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
    marginBottom: 20,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    fontSize: 18,
    fontFamily: 'inter-bold',
    color: '#fff',
  },
  backText: {
    fontSize: 16,
    fontFamily: 'inter-regular',
    color: '#666',
  },
});