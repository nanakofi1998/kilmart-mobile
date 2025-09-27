import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Switch, ActivityIndicator, AppState, Alert, Modal, FlatList } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AwesomeAlert from 'react-native-awesome-alerts';
import { useLocalSearchParams, router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { useCart } from '../context/CartContext';
import apiClient from '../utils/apiClient';

// Handle web browser authentication sessions
WebBrowser.maybeCompleteAuthSession();

export function Payment() {
  const { cartItems: cartItemsString, totalPrice } = useLocalSearchParams();
  const cartItems = JSON.parse(cartItemsString || '[]');

  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [shippingAddresses, setShippingAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [useDefaultAddress, setUseDefaultAddress] = useState(false);
  const [isDeliveryDetailsComplete, setIsDeliveryDetailsComplete] = useState(false);
  const [alert, setAlert] = useState({ show: false, title: '', message: '' });
  const [paymentReference, setPaymentReference] = useState('');
  const [orderId, setOrderId] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [timeoutIds, setTimeoutIds] = useState([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  // New address form fields
  const [newAddress, setNewAddress] = useState({
    address_line_1: '',
    address_line_2: '',
    city: '',
    state_province_region: '',
    postal_code: '',
    country: 'Ghana',
    contact_phone: ''
  });

  const showAlert = (title, message) => {
    setAlert({ show: true, title, message });
  };

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const { removeItemsByIds } = useCart();

  // Fetch user's shipping addresses
  const fetchShippingAddresses = async () => {
    try {
      setIsLoadingAddresses(true);
      const response = await apiClient.get('api/auth/shipping-address/');
      setShippingAddresses(response.data || []);
      
      // Auto-select default address if available
      const defaultAddress = response.data.find(addr => addr.is_default);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
        setUseDefaultAddress(true);
      }
    } catch (error) {
      console.error('Error fetching shipping addresses:', error);
      showAlert('Error', 'Failed to load saved addresses');
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  // Save new shipping address
  const saveNewAddress = async (setAsDefault = false) => {
    try {
      if (!newAddress.address_line_1 || !newAddress.city || !newAddress.contact_phone) {
        showAlert('Error', 'Please fill in required fields (Address, City, Phone)');
        return;
      }

      const payload = {
        ...newAddress,
        is_default: setAsDefault
      };

      const response = await apiClient.post('api/auth/shipping-address/', payload);
      
      showAlert('Success', 'Address saved successfully!');
      await fetchShippingAddresses(); // Refresh addresses
      setSelectedAddressId(response.data.id);
      setIsAddingNewAddress(false);
      setNewAddress({
        address_line_1: '',
        address_line_2: '',
        city: '',
        state_province_region: '',
        postal_code: '',
        country: 'Ghana',
        contact_phone: ''
      });
    } catch (error) {
      console.error('Error saving address:', error);
      showAlert('Error', 'Failed to save address. Please try again.');
    }
  };

  const handleConfirmDetails = () => {
    if (!email) {
      showAlert('Error', 'Please enter your email address');
      return;
    }
    if (!validateEmail(email)) {
      showAlert('Error', 'Please enter a valid email address');
      return;
    }
    if (!useDefaultAddress && !selectedAddressId) {
      showAlert('Error', 'Please select a shipping address or use your default address');
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

  useEffect(() => {
    fetchShippingAddresses();
  }, []);

  const checkPaymentStatus = useCallback(async (orderId, currentRetryCount = 0) => {
    if (isCheckingPayment) return;

    try {
      setIsCheckingPayment(true);
      console.log(`Checking payment status for order: ${orderId}, attempt: ${currentRetryCount + 1}`);
      
      const response = await apiClient.get(`api/v1/${orderId}/`);
      console.log('Payment status:', response.data.payment_status);
      
      if (response.data.payment_status === 'Paid') {
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
  }, [removeItemsByIds, cartItems, isCheckingPayment]);

  // Handle app coming back to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && orderId && !isProcessingPayment && !isCheckingPayment) {
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
      
      const accessToken = await SecureStore.getItemAsync('access_token');
      if (!accessToken) {
        throw new Error('No access token found. Please log in again.');
      }

      // Build the payload based on address selection
      let payload = {
        payment_method: 'Mobile Money',
        items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
      };

      // Add address information based on user selection
      if (useDefaultAddress) {
        payload.use_default_address = true;
      } else if (selectedAddressId) {
        payload.shipping_address_id = selectedAddressId;
      } else {
        // Use the new address object if no saved address is selected
        payload.shipping_address_object = {
          address_line_1: newAddress.address_line_1,
          address_line_2: newAddress.address_line_2,
          city: newAddress.city,
          state_province_region: newAddress.state_province_region,
          postal_code: newAddress.postal_code,
          country: newAddress.country,
          contact_phone: newAddress.contact_phone || phoneNumber
        };
      }

      console.log('Order payload:', JSON.stringify(payload, null, 2));

      const response = await apiClient.post('api/v1/create/', payload);
      console.log('Order response:', JSON.stringify(response.data, null, 2));

      const { payment_info, order_id } = response.data;

      if (!payment_info?.authorization_url || !order_id) {
        throw new Error('No payment URL or order ID provided in response');
      }

      setPaymentReference(payment_info.reference);
      setOrderId(order_id);
      
      showAlert('Info', 'Complete the payment in the browser, then return to the app. We will automatically verify your payment.');
      
      const result = await WebBrowser.openBrowserAsync(payment_info.authorization_url, {
        toolbarColor: '#000000',
        showTitle: true,
        enableDefaultShareMenuItem: false,
        showInRecents: true,
      });
      
      if (result.type === 'dismiss' || result.type === 'cancel') {
        checkPaymentStatus(order_id);
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      
      let errorMessage = 'An error occurred while creating the order. Please try again.';
      if (error.message === 'No access token found. Please log in again.') {
        errorMessage = error.message;
        setTimeout(() => router.replace('/login'), 1000);
      } else if (error.response?.status === 401) {
        errorMessage = error.response.data?.detail || 'Session expired. Please log in again.';
        setTimeout(() => router.replace('/login'), 1000);
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

  const renderAddressItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.addressItem,
        selectedAddressId === item.id && styles.selectedAddressItem
      ]}
      onPress={() => {
        setSelectedAddressId(item.id);
        setUseDefaultAddress(false);
      }}
    >
      <View style={styles.addressHeader}>
        <Text style={styles.addressName}>
          {item.is_default ? 'Default Address' : 'Saved Address'}
        </Text>
        {item.is_default && (
          <MaterialIcons name="star" size={16} color="#FFD700" />
        )}
      </View>
      <Text style={styles.addressText}>{item.address_line_1}</Text>
      {item.address_line_2 && (
        <Text style={styles.addressText}>{item.address_line_2}</Text>
      )}
      <Text style={styles.addressText}>
        {item.city}, {item.state_province_region} {item.postal_code}
      </Text>
      <Text style={styles.addressText}>{item.country}</Text>
      <Text style={styles.addressPhone}>{item.contact_phone}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {isProcessingPayment || isCheckingPayment ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>
            {isCheckingPayment ? 'Verifying payment...' : 'Processing payment...'}
          </Text>
          {isCheckingPayment && (
            <Text style={styles.loadingSubtext}>This may take a few moments</Text>
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

          {/* Address Selection */}
          <View style={styles.addressSection}>
            <Text style={styles.subSectionTitle}>Shipping Address</Text>
            
            {/* Use Default Address Option */}
            <TouchableOpacity
              style={styles.defaultAddressOption}
              onPress={() => setUseDefaultAddress(!useDefaultAddress)}
            >
              <View style={styles.checkboxContainer}>
                <View style={[
                  styles.checkbox,
                  useDefaultAddress && styles.checkboxChecked
                ]}>
                  {useDefaultAddress && <MaterialIcons name="check" size={16} color="#fff" />}
                </View>
                <Text style={styles.checkboxLabel}>Use my default address</Text>
              </View>
            </TouchableOpacity>

            {/* Saved Addresses List */}
            {!useDefaultAddress && (
              <>
                {isLoadingAddresses ? (
                  <ActivityIndicator size="small" color="#000" style={styles.loadingAddresses} />
                ) : shippingAddresses.length > 0 ? (
                  <FlatList
                    data={shippingAddresses}
                    renderItem={renderAddressItem}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    style={styles.addressesList}
                  />
                ) : (
                  <Text style={styles.noAddressesText}>No saved addresses found</Text>
                )}

                {/* Add New Address Button */}
                <TouchableOpacity
                  style={styles.addAddressButton}
                  onPress={() => setShowAddressModal(true)}
                >
                  <MaterialIcons name="add" size={20} color="#fff" />
                  <Text style={styles.addAddressButtonText}>Add New Address</Text>
                </TouchableOpacity>
              </>
            )}
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

          {/* Address Modal */}
          <Modal
            visible={showAddressModal}
            animationType="slide"
            transparent
            onRequestClose={() => setShowAddressModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {isAddingNewAddress ? 'Add New Address' : 'Select Address'}
                </Text>

                {isAddingNewAddress ? (
                  <ScrollView style={styles.addressForm}>
                    <TextInput
                      style={styles.input}
                      placeholder="Address Line 1 *"
                      value={newAddress.address_line_1}
                      onChangeText={(text) => setNewAddress(prev => ({ ...prev, address_line_1: text }))}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Address Line 2 (Optional)"
                      value={newAddress.address_line_2}
                      onChangeText={(text) => setNewAddress(prev => ({ ...prev, address_line_2: text }))}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="City *"
                      value={newAddress.city}
                      onChangeText={(text) => setNewAddress(prev => ({ ...prev, city: text }))}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="State/Region *"
                      value={newAddress.state_province_region}
                      onChangeText={(text) => setNewAddress(prev => ({ ...prev, state_province_region: text }))}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Postal Code"
                      value={newAddress.postal_code}
                      onChangeText={(text) => setNewAddress(prev => ({ ...prev, postal_code: text }))}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Country"
                      value={newAddress.country}
                      onChangeText={(text) => setNewAddress(prev => ({ ...prev, country: text }))}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Contact Phone *"
                      value={newAddress.contact_phone}
                      onChangeText={(text) => setNewAddress(prev => ({ ...prev, contact_phone: text }))}
                      keyboardType="phone-pad"
                    />

                    <View style={styles.modalActions}>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.cancelButton]}
                        onPress={() => setIsAddingNewAddress(false)}
                      >
                        <Text style={styles.cancelButtonText}>Back</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.saveButton]}
                        onPress={() => saveNewAddress(false)}
                      >
                        <Text style={styles.saveButtonText}>Save Address</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.saveDefaultButton]}
                        onPress={() => saveNewAddress(true)}
                      >
                        <Text style={styles.saveDefaultButtonText}>Save as Default</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                ) : (
                  <>
                    <FlatList
                      data={shippingAddresses}
                      renderItem={renderAddressItem}
                      keyExtractor={(item) => item.id}
                      style={styles.modalAddressList}
                    />
                    <TouchableOpacity
                      style={styles.addNewAddressButton}
                      onPress={() => setIsAddingNewAddress(true)}
                    >
                      <MaterialIcons name="add" size={20} color="#fff" />
                      <Text style={styles.addNewAddressButtonText}>Add New Address</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.closeModalButton}
                      onPress={() => setShowAddressModal(false)}
                    >
                      <Text style={styles.closeModalButtonText}>Close</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </Modal>

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
  subSectionTitle: {
    fontSize: 18,
    fontFamily: 'inter-bold',
    marginBottom: 10,
    color: '#333'
  },
  input: { 
    backgroundColor: '#f9f9f9', 
    borderRadius: 10, 
    padding: 15, 
    marginBottom: 10, 
    fontSize: 16, 
    color: '#333',
    borderWidth: 1,
    borderColor: '#eee'
  },
  addressSection: {
    marginBottom: 20,
  },
  defaultAddressOption: {
    marginBottom: 15,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#f1b811',
    borderColor: '#f1b811',
  },
  checkboxLabel: {
    fontSize: 16,
    fontFamily: 'inter-medium',
    color: '#333',
  },
  addressesList: {
    maxHeight: 200,
  },
  addressItem: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedAddressItem: {
    borderColor: '#f1b811',
    backgroundColor: '#fffaf0',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  addressName: {
    fontSize: 14,
    fontFamily: 'inter-bold',
    color: '#333',
  },
  addressText: {
    fontSize: 12,
    fontFamily: 'inter-regular',
    color: '#666',
    marginBottom: 2,
  },
  addressPhone: {
    fontSize: 12,
    fontFamily: 'inter-medium',
    color: '#333',
    marginTop: 5,
  },
  noAddressesText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginVertical: 10,
  },
  addAddressButton: {
    flexDirection: 'row',
    backgroundColor: '#f1b811',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  addAddressButtonText: {
    color: '#fff',
    fontFamily: 'inter-bold',
    marginLeft: 5,
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'inter-bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  addressForm: {
    maxHeight: 400,
  },
  modalAddressList: {
    maxHeight: 300,
  },
  addNewAddressButton: {
    flexDirection: 'row',
    backgroundColor: '#f1b811',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  addNewAddressButtonText: {
    color: '#fff',
    fontFamily: 'inter-bold',
    marginLeft: 5,
  },
  closeModalButton: {
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  closeModalButtonText: {
    color: '#666',
    fontFamily: 'inter-medium',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 5,
    borderRadius: 50,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  saveButton: {
    backgroundColor: '#666',
    fontSize: 10,
  },
  saveDefaultButton: {
    backgroundColor: '#f1b811',
    borderColor: '#000000ff',
  },
  cancelButtonText: {
    color: '#333',
    fontFamily: 'inter-bold',
  },
  saveButtonText: {
    color: '#fff',
    fontFamily: 'inter-bold',
  },
  saveDefaultButtonText: {
    color: '#fff',
    fontFamily: 'inter-bold',
    fontSize: 10,
  },
  loadingAddresses: {
    marginVertical: 10,
  },
});

export default Payment;