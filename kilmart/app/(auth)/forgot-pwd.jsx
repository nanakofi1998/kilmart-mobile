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
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiClient from '../../utils/apiClient';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
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

  const handleSendResetLink = async () => {
    if (!email) {
      displayAlert('Error', 'Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      displayAlert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        email: email.trim().toLowerCase(),
        purpose: 'password_reset'
      };

      console.log('Sending password reset request for:', payload.email);

      const response = await apiClient.post('api/auth/request-password-reset/', payload);

      if (response.status === 200) {
        displayAlert('Success', 'Password reset link has been sent to your email!', true);
        
        setTimeout(() => {
          setShowAlert(false);
          router.back();
        }, 3000);
      } else {
        displayAlert('Error', response.data.message || 'Failed to send reset link');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      
      let errorMessage = 'Failed to send reset link. Please try again.';
      
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

  const handleBackToLogin = () => {
    router.back();
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
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a link to reset your password
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            editable={!isLoading}
            selectionColor="#f1b811"
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

          <TouchableOpacity 
            onPress={handleBackToLogin} 
            disabled={isLoading}
            style={{ opacity: isLoading ? 0.5 : 1 }}
          >
            <Text style={styles.backText}>Back to Login</Text>
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
  sendButton: {
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
    textAlign: 'center',
  },
});