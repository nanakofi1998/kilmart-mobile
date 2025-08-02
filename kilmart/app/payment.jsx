import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Switch, ActivityIndicator } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import AwesomeAlert from 'react-native-awesome-alerts';
import { useLocalSearchParams, router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import apiClient from '../utils/apiClient';

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

  const showAlert = (title, message) => {
    setAlert({ show: true, title, message });
  };

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

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

  const payNow = async () => {
    try {
      setIsProcessingPayment(true);
      console.log('Cart items:', JSON.stringify(cartItems, null, 2));
      const payload = {
        shipping_address: shippingAddress,
        billing_address: shippingAddress,
        payment_method: 'Mobile Money',
        items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
      };

      console.log('Order payload:', JSON.stringify(payload, null, 2));

      const response = await apiClient.post('/v1/create/', payload);
      console.log('Order response:', JSON.stringify(response.data, null, 2));

      const { payment_info, order_id } = response.data;

      if (!payment_info?.authorization_url || !order_id) {
        throw new Error('No payment URL or order ID provided in response');
      }

      console.log('Opening payment URL:', payment_info.authorization_url);
      setPaymentReference(payment_info.reference);
      setOrderId(order_id);
      await WebBrowser.openBrowserAsync(payment_info.authorization_url, {
        toolbarColor: '#000000',
        showTitle: true,
        enableDefaultShareMenuItem: false,
        showInRecents: true,
      });
    } catch (error) {
      console.error('Payment error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        url: error.config?.url,
        status: error.response?.status,
        responseData: JSON.stringify(error.response?.data, null, 2),
      });
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        'An error occurred while creating the order. Please try again.';
      showAlert('Error', errorMessage);
      setIsProcessingPayment(false);
    }
  };

  useEffect(() => {
    const handleDeepLink = ({ url }) => {
      console.log('Deep link received:', url);
      if (url.includes('payment-callback') && orderId && paymentReference) {
        setIsProcessingPayment(false);
        showAlert('Success', 'Payment completed! Redirecting to orders...');
        setTimeout(() => {
          router.replace('/orders');
          WebBrowser.dismissBrowser();
        }, 1000);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, [orderId, paymentReference]);

  return (
    <View style={styles.container}>
      {isProcessingPayment ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Processing payment...</Text>
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
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            editable={!isDeliveryDetailsComplete}
          />
          <TextInput
            style={styles.input}
            placeholder="Delivery Address"
            value={shippingAddress}
            onChangeText={setShippingAddress}
            editable={!isDeliveryDetailsComplete}
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
            <TouchableOpacity
              style={[styles.paymentButton, { opacity: isProcessingPayment ? 0.5 : 1 }]}
              onPress={payNow}
              disabled={isProcessingPayment}
            >
              <Text style={styles.paymentButtonText}>
                Pay with Paystack (GH₵{parseFloat(totalPrice || '0').toFixed(2)})
              </Text>
            </TouchableOpacity>
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#333' },
  sectionTitle: { fontSize: 24, fontFamily: 'inter-bold', marginBottom: 15, marginTop: 20, color: '#333' },
  input: { backgroundColor: '#f9f9f9', borderRadius: 10, padding: 15, marginBottom: 10, fontSize: 16, color: '#333' },
  paymentButton: {
    backgroundColor: 'black',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
  },
  paymentButtonText: { fontSize: 18, fontFamily: 'inter-bold', color: '#fff' },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  switchLabel: { fontSize: 16, flex: 1, fontFamily: 'inter-medium', color: '#333' },
});

export default Payment;