import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Switch, ActivityIndicator, AppState } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import AwesomeAlert from 'react-native-awesome-alerts';
import { useLocalSearchParams, router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import {useCart} from '../context/CartContext';
import apiClient from '../utils/apiClient';

// Handle web browser authentication sessions
WebBrowser.maybeCompleteAuthSession();

export function Payment() {
  const { cartItems: cartItemsString, totalPrice } = useLocalSearchParams();
  const cartItems = JSON.parse(cartItemsString || '[]');

  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [isDeliveryDetailsComplete, setIsDeliveryDetailsComplete] = useState(false);
  const [alert, setAlert] = useState({ show: false, title: '', message: '' });
  const [paymentReference, setPaymentReference] = useState('');
  const [orderId, setOrderId] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [timeoutIds, setTimeoutIds] = useState([]);

  const showAlert = (title, message) => {
    setAlert({ show: true, title, message });
  };

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const { removeItemsByIds } = useCart();

  const handleConfirmDetails = () => {
    if (!email || !phoneNumber || !shippingAddress) {
      showAlert('Error', 'Please fill in all delivery details');
      return;
    }
    if (!validateEmail(email)) {
      showAlert('Error', 'Please enter a valid email address');
      return;
    }
    if (!/^\d{10,}$/.test(phoneNumber.replace(/\D/g, ''))) {
      showAlert('Error', 'Please enter a valid phone number');
      return;
    }
    setIsDeliveryDetailsComplete(true);
    showAlert('Success', 'Delivery details confirmed!');
  };

  // Clear all timeouts on component unmount
  useEffect(() => {
    return () => {
      timeoutIds.forEach(id => clearTimeout(id));
    };
  }, []);

  const checkPaymentStatus = useCallback(async (orderId, currentRetryCount = 0) => {
    if (isCheckingPayment) return;

    try {
      setIsCheckingPayment(true);
      console.log(`Checking payment status for order: ${orderId}, attempt: ${currentRetryCount + 1}`);
      
      // FIXED: Added missing slash in endpoint
      const response = await apiClient.get(`api/v1/${orderId}/`);
      console.log('Payment status:', response.data.payment_status);
      
      if (response.data.payment_status === 'Paid') {
        // REMOVE ONLY THE ITEMS THAT WERE PAID FOR
        const paidItemIds = cartItems.map(item => item.id);
        await removeItemsByIds(paidItemIds);
        
        showAlert('Success', 'Payment completed successfully! Redirecting to orders...');
        const timeoutId = setTimeout(() => {
          router.replace({ pathname: '/orders', params: { newOrderId: orderId } });
        }, 1500);
        setTimeoutIds(prev => [...prev, timeoutId]);
        return true;
      } else if (currentRetryCount < 8) {
        showAlert('Pending', 'Payment is still pending. Checking again...');
        const timeoutId = setTimeout(() => checkPaymentStatus(orderId, currentRetryCount + 1), 3000);
        setTimeoutIds(prev => [...prev, timeoutId]);
      } else {
        showAlert('Timeout', 'Payment verification timed out. Please check your orders page for updates.');
        const timeoutId = setTimeout(() => {
          router.replace({ pathname: '/orders' });
        }, 1500);
        setTimeoutIds(prev => [...prev, timeoutId]);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      if (currentRetryCount < 5) {
        showAlert('Retrying', 'Having trouble verifying payment. Trying again...');
        const timeoutId = setTimeout(() => checkPaymentStatus(orderId, currentRetryCount + 1), 3000);
        setTimeoutIds(prev => [...prev, timeoutId]);
      } else {
        showAlert('Error', 'Failed to verify payment status. Please check your orders page later.');
        const timeoutId = setTimeout(() => {
          router.replace({ pathname: '/orders' });
        }, 1500);
        setTimeoutIds(prev => [...prev, timeoutId]);
      }
    } finally {
      setIsCheckingPayment(false);
    }
  }, [removeItemsByIds, cartItems, isCheckingPayment]); // Added isCheckingPayment to dependencies

  // Handle app coming back to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && orderId && !isProcessingPayment && !isCheckingPayment) {
        // App came back to foreground, check payment status
        console.log('App returned to foreground, checking payment status');
        checkPaymentStatus(orderId);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [orderId, isProcessingPayment, isCheckingPayment, checkPaymentStatus]);

  const payNow = async () => {
    console.log('Starting payNow function');
    try {
      setIsProcessingPayment(true);
      console.log('Cart items:', JSON.stringify(cartItems, null, 2));

      // Check access token - FIXED: changed token to accessToken
      const accessToken = await SecureStore.getItemAsync('access_token'); // Also fixed key name
      console.log('Access token:', accessToken ? accessToken.substring(0, 20) + '...' : 'Not found');
      
      // FIXED: Changed token to accessToken
      if (!accessToken) {
        throw new Error('No access token found. Please log in again.');
      }

      const payload = {
        shipping_address: shippingAddress,
        payment_method: 'Mobile Money',
        items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
      };

      console.log('Order payload:', JSON.stringify(payload, null, 2));
      console.log('Making API call to /api/v1/create/');

      const response = await apiClient.post('api/v1/create/', payload);
      console.log('Order response:', JSON.stringify(response.data, null, 2));

      const { payment_info, order_id } = response.data;

      if (!payment_info?.authorization_url || !order_id) {
        throw new Error('No payment URL or order ID provided in response');
      }

      console.log('Opening payment URL:', payment_info.authorization_url);
      setPaymentReference(payment_info.reference);
      setOrderId(order_id);
      
      showAlert('Info', 'Complete the payment in the browser, then return to the app. We will automatically verify your payment.');
      
      // Open browser for payment
      const result = await WebBrowser.openBrowserAsync(payment_info.authorization_url, {
        toolbarColor: '#000000',
        showTitle: true,
        enableDefaultShareMenuItem: false,
        showInRecents: true,
      });
      
      console.log('WebBrowser result type:', result.type);
      
      // When browser is closed, check payment status
      if (result.type === 'dismiss' || result.type === 'cancel') {
        // Start checking payment status immediately
        checkPaymentStatus(order_id);
      }
      
    } catch (error) {
      console.error('Payment error:', {
        message: error.message,
        name: error.name,
        code: error.code,
        url: error.config?.url,
        status: error.response?.status,
        responseData: error.response?.data ? JSON.stringify(error.response.data, null, 2) : 'No response data',
        axiosError: error.toJSON ? error.toJSON() : error,
      });
      
      let errorMessage = 'An error occurred while creating the order. Please try again.';
      if (error.message === 'No access token found. Please log in again.') {
        errorMessage = error.message;
        const timeoutId = setTimeout(() => router.replace('/login'), 1000);
        setTimeoutIds(prev => [...prev, timeoutId]);
      } else if (error.response?.status === 401) {
        errorMessage = error.response.data?.detail || 'Session expired. Please log in again.';
        const timeoutId = setTimeout(() => router.replace('/login'), 1000);
        setTimeoutIds(prev => [...prev, timeoutId]);
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      showAlert('Error', errorMessage);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <View style={styles.container}>
      {isProcessingPayment || isCheckingPayment ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>
            {isCheckingPayment ? 'Verifying payment...' : 'Processing payment...'}
          </Text>
          {isCheckingPayment && (
            <Text style={styles.loadingSubtext}>
              This may take a few moments
            </Text>
          )}
        </View>
      ) : (
        <ScrollView style={styles.scrollContainer}>
          <Text style={styles.sectionTitle}>
            Delivery Details <FontAwesome5 name="shipping-fast" size={22} />
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            editable={!isDeliveryDetailsComplete}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            editable={!isDeliveryDetailsComplete}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Delivery Address"
            value={shippingAddress}
            onChangeText={setShippingAddress}
            editable={!isDeliveryDetailsComplete}
            multiline
            numberOfLines={3}
          />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Save as default address</Text>
            <Switch
              value={saveAsDefault}
              onValueChange={setSaveAsDefault}
              disabled={isDeliveryDetailsComplete}
            />
          </View>

          {!isDeliveryDetailsComplete ? (
            <TouchableOpacity style={styles.paymentButton} onPress={handleConfirmDetails}>
              <Text style={styles.paymentButtonText}>Confirm Details</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.paymentButton, { opacity: isProcessingPayment ? 0.5 : 1 }]}
                onPress={payNow}
                disabled={isProcessingPayment}
              >
                <Text style={styles.paymentButtonText}>
                  Pay with Paystack (GH₵{parseFloat(totalPrice || '0').toFixed(2)})
                </Text>
              </TouchableOpacity>

              {orderId && (
                <TouchableOpacity 
                  style={[styles.secondaryButton, { marginTop: 10 }]} 
                  onPress={() => checkPaymentStatus(orderId)}
                  disabled={isCheckingPayment}
                >
                  <Text style={styles.secondaryButtonText}>
                    {isCheckingPayment ? 'Checking...' : 'Check Payment Status'}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}

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
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContainer: { flex: 1, padding: 20, paddingTop: 60 },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20 
  },
  loadingText: { 
    marginTop: 10, 
    fontSize: 16, 
    color: '#333',
    textAlign: 'center'
  },
  loadingSubtext: {
    marginTop: 5,
    fontSize: 14,
    color: '#666',
    textAlign: 'center'
  },
  sectionTitle: { 
    fontSize: 24, 
    fontFamily: 'inter-bold', 
    marginBottom: 15, 
    marginTop: 20, 
    color: '#333' 
  },
  input: { 
    backgroundColor: '#f9f9f9', 
    borderRadius: 10, 
    padding: 15, 
    marginBottom: 10, 
    fontSize: 16, 
    color: '#333',
    textAlignVertical: 'top'
  },
  paymentButton: {
    backgroundColor: 'black',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
  },
  secondaryButton: {
    backgroundColor: '#666',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  paymentButtonText: { 
    fontSize: 18, 
    fontFamily: 'inter-bold', 
    color: '#fff' 
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'inter-medium',
    color: '#fff'
  },
  switchRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginVertical: 10,
    justifyContent: 'space-between'
  },
  switchLabel: { 
    fontSize: 16, 
    flex: 1, 
    fontFamily: 'inter-medium', 
    color: '#333',
    marginRight: 10
  },
});

export default Payment;