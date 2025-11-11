import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  ActivityIndicator, 
  AppState, 
  Alert, 
  Modal, 
  FlatList,
  Platform,
  StatusBar,
  KeyboardAvoidingView
} from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { useCart } from '../context/CartContext';
import { useAuth } from './AuthContext';
import apiClient from '../utils/apiClient';

// Handle web browser authentication sessions
WebBrowser.maybeCompleteAuthSession();

export function Payment() {
  const { cartItems: cartItemsString, totalPrice } = useLocalSearchParams();
  const cartItems = JSON.parse(cartItemsString || '[]');
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [email, setEmail] = useState(user?.email || '');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [shippingAddresses, setShippingAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [useDefaultAddress, setUseDefaultAddress] = useState(false);
  const [isDeliveryDetailsComplete, setIsDeliveryDetailsComplete] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const [orderId, setOrderId] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [timeoutIds, setTimeoutIds] = useState([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    isSuccess: false,
  });
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  const [newAddress, setNewAddress] = useState({
    address_line_1: '',
    address_line_2: '',
    city: '',
    state_province_region: '',
    postal_code: '',
    country: 'Ghana',
    contact_phone: ''
  });

  const [addressErrors, setAddressErrors] = useState({});

  const displayAlert = (title, message, isSuccess = false) => {
    setShowAlert(false);
    setAlertConfig({ title, message, isSuccess });
    setShowAlert(true);
  };

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const { removeItemsByIds } = useCart();

  // Set user's email on component mount
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

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
      displayAlert('Error', 'Failed to load saved addresses');
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const validateAddressForm = () => {
    const errors = {};
    
    if (!newAddress.address_line_1.trim()) {
      errors.address_line_1 = 'Address is required';
    }
    
    if (!newAddress.city.trim()) {
      errors.city = 'City is required';
    }
    
    if (!newAddress.state_province_region.trim()) {
      errors.state_province_region = 'State/Region is required';
    }
    
    if (!newAddress.contact_phone.trim()) {
      errors.contact_phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-()]+$/.test(newAddress.contact_phone)) {
      errors.contact_phone = 'Invalid phone number format';
    }
    
    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save new shipping address
  const saveNewAddress = async (setAsDefault = false) => {
    if (!validateAddressForm()) {
      return;
    }

    try {
      setIsSavingAddress(true);

      const payload = {
        ...newAddress,
        is_default: setAsDefault
      };

      const response = await apiClient.post('api/auth/shipping-address/', payload);
      
      // Update local state immediately without refetching
      setShippingAddresses(prev => [...prev, response.data]);
      setSelectedAddressId(response.data.id);
      setUseDefaultAddress(false);
      
      // Reset form and close modal
      setNewAddress({
        address_line_1: '',
        address_line_2: '',
        city: '',
        state_province_region: '',
        postal_code: '',
        country: 'Ghana',
        contact_phone: ''
      });
      setAddressErrors({});
      setIsAddingNewAddress(false);
      setShowAddressModal(false);
      
      displayAlert('Success', 'Address saved successfully!', true);
    } catch (error) {
      console.error('Error saving address:', error);
      displayAlert('Error', 'Failed to save address. Please try again.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleConfirmDetails = () => {
    if (!email) {
      displayAlert('Error', 'Please enter your email address');
      return;
    }
    if (!validateEmail(email)) {
      displayAlert('Error', 'Please enter a valid email address');
      return;
    }
    if (!useDefaultAddress && !selectedAddressId) {
      displayAlert('Error', 'Please select a shipping address or use your default address');
      return;
    }

    setIsDeliveryDetailsComplete(true);
    displayAlert('Success', 'Delivery details confirmed!', true);
  };

  const handleEmailEdit = () => {
    if (isDeliveryDetailsComplete) {
      setIsDeliveryDetailsComplete(false);
    }
    setIsEditingEmail(true);
  };

  const handleEmailSave = () => {
    if (!email) {
      displayAlert('Error', 'Please enter your email address');
      return;
    }
    if (!validateEmail(email)) {
      displayAlert('Error', 'Please enter a valid email address');
      return;
    }
    setIsEditingEmail(false);
    displayAlert('Success', 'Email updated successfully!', true);
  };

  const handleEmailCancel = () => {
    setEmail(user?.email || '');
    setIsEditingEmail(false);
  };

  const resetAddressForm = () => {
    setNewAddress({
      address_line_1: '',
      address_line_2: '',
      city: '',
      state_province_region: '',
      postal_code: '',
      country: 'Ghana',
      contact_phone: ''
    });
    setAddressErrors({});
    setIsAddingNewAddress(false);
  };

  const handleCloseAddressModal = () => {
    resetAddressForm();
    setShowAddressModal(false);
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
        
        displayAlert('Success', 'Payment completed successfully! Redirecting to orders...', true);
        const timeoutId = setTimeout(() => {
          setShowAlert(false);
          router.replace({ pathname: '/orders', params: { newOrderId: orderId } });
        }, 1500);
        setTimeoutIds(prev => [...prev, timeoutId]);
        return true;
      } else if (currentRetryCount < 8) {
        displayAlert('Pending', 'Payment is still pending. Checking again...');
        const timeoutId = setTimeout(() => checkPaymentStatus(orderId, currentRetryCount + 1), 3000);
        setTimeoutIds(prev => [...prev, timeoutId]);
      } else {
        displayAlert('Timeout', 'Payment verification timed out. Please check your orders page for updates.');
        const timeoutId = setTimeout(() => {
          setShowAlert(false);
          router.replace({ pathname: '/orders' });
        }, 1500);
        setTimeoutIds(prev => [...prev, timeoutId]);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      if (currentRetryCount < 5) {
        displayAlert('Retrying', 'Having trouble verifying payment. Trying again...');
        const timeoutId = setTimeout(() => checkPaymentStatus(orderId, currentRetryCount + 1), 3000);
        setTimeoutIds(prev => [...prev, timeoutId]);
      } else {
        displayAlert('Error', 'Failed to verify payment status. Please check your orders page later.');
        const timeoutId = setTimeout(() => {
          setShowAlert(false);
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

      let payload = {
        payment_method: 'Mobile Money',
        items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
      };

      if (useDefaultAddress) {
        payload.use_default_address = true;
      } else if (selectedAddressId) {
        payload.shipping_address_id = selectedAddressId;
      } else {
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
      
      displayAlert('Info', 'Complete the payment in the browser, then return to the app. We will automatically verify your payment.');
      
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
      
      displayAlert('Error', errorMessage);
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
        setShowAddressModal(false);
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
    <View style={[
      styles.container,
      { paddingTop: Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight }
    ]}>
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
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 20 : 20 }
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>
            Delivery Details <FontAwesome5 name="shipping-fast" size={22} />
          </Text>

          {/* Email Input with Edit Icon */}
          <View style={styles.emailContainer}>
            <View style={styles.emailInputContainer}>
              <TextInput
                style={[
                  styles.input,
                  isEditingEmail ? styles.editingInput : styles.readOnlyInput
                ]}
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                editable={isEditingEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
              {!isEditingEmail ? (
                <TouchableOpacity 
                  style={styles.editIconButton}
                  onPress={handleEmailEdit}
                >
                  <Feather name="edit-2" size={18} color="#666" />
                </TouchableOpacity>
              ) : (
                <View style={styles.emailActions}>
                  <TouchableOpacity 
                    style={styles.emailActionButton}
                    onPress={handleEmailSave}
                  >
                    <Feather name="check" size={18} color="#4CAF50" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.emailActionButton}
                    onPress={handleEmailCancel}
                  >
                    <Feather name="x" size={18} color="#D32F2F" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            {!isEditingEmail && user?.email === email && (
              <Text style={styles.registeredEmailText}>
                Your registered email address
              </Text>
            )}
          </View>

          {/* Address Selection */}
          <View style={styles.addressSection}>
            <Text style={styles.subSectionTitle}>Shipping Address</Text>
            
            {/* Use Default Address Option */}
            <TouchableOpacity
              style={styles.defaultAddressOption}
              onPress={() => {
                setUseDefaultAddress(!useDefaultAddress);
                if (!useDefaultAddress) {
                  setSelectedAddressId(null);
                }
              }}
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
                  <View style={styles.addressesList}>
                    {shippingAddresses.map((item) => (
                      <View key={item.id}>
                        {renderAddressItem({ item })}
                      </View>
                    ))}
                  </View>
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
            onRequestClose={handleCloseAddressModal}
          >
            <View style={styles.modalOverlay}>
              <View style={[
                styles.modalContent,
                { 
                  height: Platform.OS === 'ios' ? '85%' : '80%',
                  marginTop: Platform.OS === 'ios' ? '15%' : '20%'
                }
              ]}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {isAddingNewAddress ? 'Add New Address' : 'Select Address'}
                  </Text>
                  <TouchableOpacity 
                    onPress={handleCloseAddressModal}
                    style={styles.modalCloseButton}
                  >
                    <Feather name="x" size={24} color="#333" />
                  </TouchableOpacity>
                </View>

                {isAddingNewAddress ? (
                  <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalBody}
                  >
                    <ScrollView 
                      style={styles.addressFormScroll}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={styles.addressFormContent}
                    >
                      <View style={styles.formField}>
                        <Text style={styles.fieldLabel}>Address Line 1 *</Text>
                        <TextInput
                          style={[
                            styles.formInput,
                            addressErrors.address_line_1 && styles.inputError
                          ]}
                          placeholder="Enter street address"
                          value={newAddress.address_line_1}
                          onChangeText={(text) => {
                            setNewAddress(prev => ({ ...prev, address_line_1: text }));
                            if (addressErrors.address_line_1) {
                              setAddressErrors(prev => ({ ...prev, address_line_1: null }));
                            }
                          }}
                          placeholderTextColor="#999"
                        />
                        {addressErrors.address_line_1 && (
                          <Text style={styles.errorText}>{addressErrors.address_line_1}</Text>
                        )}
                      </View>

                      <View style={styles.formField}>
                        <Text style={styles.fieldLabel}>Address Line 2</Text>
                        <TextInput
                          style={styles.formInput}
                          placeholder="Apartment, suite, etc. (optional)"
                          value={newAddress.address_line_2}
                          onChangeText={(text) => setNewAddress(prev => ({ ...prev, address_line_2: text }))}
                          placeholderTextColor="#999"
                        />
                      </View>

                      <View style={styles.formRow}>
                        <View style={[styles.formField, styles.formFieldHalf]}>
                          <Text style={styles.fieldLabel}>City *</Text>
                          <TextInput
                            style={[
                              styles.formInput,
                              addressErrors.city && styles.inputError
                            ]}
                            placeholder="City"
                            value={newAddress.city}
                            onChangeText={(text) => {
                              setNewAddress(prev => ({ ...prev, city: text }));
                              if (addressErrors.city) {
                                setAddressErrors(prev => ({ ...prev, city: null }));
                              }
                            }}
                            placeholderTextColor="#999"
                          />
                          {addressErrors.city && (
                            <Text style={styles.errorText}>{addressErrors.city}</Text>
                          )}
                        </View>

                        <View style={[styles.formField, styles.formFieldHalf]}>
                          <Text style={styles.fieldLabel}>State/Region *</Text>
                          <TextInput
                            style={[
                              styles.formInput,
                              addressErrors.state_province_region && styles.inputError
                            ]}
                            placeholder="State"
                            value={newAddress.state_province_region}
                            onChangeText={(text) => {
                              setNewAddress(prev => ({ ...prev, state_province_region: text }));
                              if (addressErrors.state_province_region) {
                                setAddressErrors(prev => ({ ...prev, state_province_region: null }));
                              }
                            }}
                            placeholderTextColor="#999"
                          />
                          {addressErrors.state_province_region && (
                            <Text style={styles.errorText}>{addressErrors.state_province_region}</Text>
                          )}
                        </View>
                      </View>

                      <View style={styles.formRow}>
                        <View style={[styles.formField, styles.formFieldHalf]}>
                          <Text style={styles.fieldLabel}>Postal Code</Text>
                          <TextInput
                            style={styles.formInput}
                            placeholder="Postal Code"
                            value={newAddress.postal_code}
                            onChangeText={(text) => setNewAddress(prev => ({ ...prev, postal_code: text }))}
                            placeholderTextColor="#999"
                          />
                        </View>

                        <View style={[styles.formField, styles.formFieldHalf]}>
                          <Text style={styles.fieldLabel}>Country</Text>
                          <TextInput
                            style={styles.formInput}
                            placeholder="Country"
                            value={newAddress.country}
                            onChangeText={(text) => setNewAddress(prev => ({ ...prev, country: text }))}
                            placeholderTextColor="#999"
                          />
                        </View>
                      </View>

                      <View style={styles.formField}>
                        <Text style={styles.fieldLabel}>Contact Phone *</Text>
                        <TextInput
                          style={[
                            styles.formInput,
                            addressErrors.contact_phone && styles.inputError
                          ]}
                          placeholder="Enter phone number"
                          value={newAddress.contact_phone}
                          onChangeText={(text) => {
                            setNewAddress(prev => ({ ...prev, contact_phone: text }));
                            if (addressErrors.contact_phone) {
                              setAddressErrors(prev => ({ ...prev, contact_phone: null }));
                            }
                          }}
                          keyboardType="phone-pad"
                          placeholderTextColor="#999"
                        />
                        {addressErrors.contact_phone && (
                          <Text style={styles.errorText}>{addressErrors.contact_phone}</Text>
                        )}
                      </View>

                      <View style={styles.modalActions}>
                        <TouchableOpacity
                          style={[styles.modalButton, styles.cancelButton]}
                          onPress={() => setIsAddingNewAddress(false)}
                          disabled={isSavingAddress}
                        >
                          <Text style={styles.cancelButtonText}>Back</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.modalButton, styles.saveButton]}
                          onPress={() => saveNewAddress(false)}
                          disabled={isSavingAddress}
                        >
                          {isSavingAddress ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.saveButtonText}>Save</Text>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.modalButton, styles.saveDefaultButton]}
                          onPress={() => saveNewAddress(true)}
                          disabled={isSavingAddress}
                        >
                          {isSavingAddress ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.saveDefaultButtonText}>Save as Default</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </ScrollView>
                  </KeyboardAvoidingView>
                ) : (
                  <View style={styles.selectAddressContainer}>
                    <ScrollView 
                      style={styles.addressListScroll}
                      contentContainerStyle={styles.addressListContent}
                      showsVerticalScrollIndicator={false}
                    >
                      {shippingAddresses.length > 0 ? (
                        shippingAddresses.map((item) => (
                          <View key={item.id} style={styles.addressItemWrapper}>
                            {renderAddressItem({ item })}
                          </View>
                        ))
                      ) : (
                        <View style={styles.emptyAddressContainer}>
                          <MaterialIcons name="location-off" size={48} color="#ccc" />
                          <Text style={styles.emptyAddressText}>No addresses saved</Text>
                          <Text style={styles.emptyAddressSubtext}>
                            Add your first address to get started
                          </Text>
                        </View>
                      )}
                    </ScrollView>
                    
                    <View style={styles.addButtonContainer}>
                      <TouchableOpacity
                        style={styles.addNewAddressButton}
                        onPress={() => setIsAddingNewAddress(true)}
                      >
                        <MaterialIcons name="add" size={20} color="#fff" />
                        <Text style={styles.addNewAddressButtonText}>Add New Address</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </Modal>

          {/* Custom Alert Modal */}
          <Modal
            visible={showAlert}
            transparent
            animationType="fade"
            onRequestClose={() => setShowAlert(false)}
          >
            <View style={styles.alertOverlay}>
              <View style={styles.alertContent}>
                <Text style={[
                  styles.alertTitle,
                  { color: alertConfig.isSuccess ? '#4CAF50' : '#D32F2F' }
                ]}>
                  {alertConfig.title}
                </Text>
                <Text style={styles.alertMessage}>
                  {alertConfig.message}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.alertButton,
                    { backgroundColor: alertConfig.isSuccess ? '#4CAF50' : '#D32F2F' }
                  ]}
                  onPress={() => setShowAlert(false)}
                >
                  <Text style={styles.alertButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  scrollContainer: { 
    flex: 1 
  },
  scrollContent: { 
    padding: 20 
  },
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
    textAlign: 'center',
    fontFamily: 'inter-medium'
  },
  loadingSubtext: {
    marginTop: 5,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'inter-regular'
  },
  sectionTitle: { 
    fontSize: 24, 
    fontFamily: 'inter-bold', 
    marginBottom: 15, 
    marginTop: 10, 
    color: '#333' 
  },
  subSectionTitle: {
    fontSize: 18,
    fontFamily: 'inter-bold',
    marginBottom: 10,
    color: '#333'
  },
  // Email Section Styles
  emailContainer: {
    marginBottom: 15,
  },
  emailInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: { 
    flex: 1,
    backgroundColor: '#f9f9f9', 
    borderRadius: 10, 
    padding: 15, 
    fontSize: 16, 
    color: '#333',
    borderWidth: 1,
    borderColor: '#eee',
    fontFamily: 'inter-regular'
  },
  readOnlyInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  editingInput: {
    backgroundColor: '#fff',
    borderColor: '#f1b811',
  },
  editIconButton: {
    position: 'absolute',
    right: 15,
    padding: 5,
  },
  emailActions: {
    flexDirection: 'row',
    position: 'absolute',
    right: 10,
  },
  emailActionButton: {
    padding: 5,
    marginLeft: 10,
  },
  registeredEmailText: {
    fontSize: 12,
    color: '#4CAF50',
    fontFamily: 'inter-regular',
    marginTop: 5,
    marginLeft: 15,
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
    marginBottom: 10,
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
    fontFamily: 'inter-regular'
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
  // Modal Styles - FIXED FOR iOS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'inter-bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 5,
  },
  modalBody: {
    flex: 1,
  },
  selectAddressContainer: {
    flex: 1,
  },
  addressFormScroll: {
    flex: 1,
  },
  addressFormContent: {
    padding: 20,
    paddingBottom: 30,
  },
  addressListScroll: {
    flex: 1,
  },
  addressListContent: {
    padding: 20,
    paddingBottom: 80, // Space for the button
  },
  addressItemWrapper: {
    marginBottom: 10,
  },
  formField: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 15,
  },
  formFieldHalf: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: 'inter-medium',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#eee',
    fontFamily: 'inter-regular',
  },
  inputError: {
    borderColor: '#D32F2F',
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    fontSize: 12,
    color: '#D32F2F',
    fontFamily: 'inter-regular',
    marginTop: 5,
  },
  emptyAddressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyAddressText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontFamily: 'inter-regular',
    textAlign: 'center',
  },
  emptyAddressSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    fontFamily: 'inter-regular',
    textAlign: 'center',
  },
  addButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  addNewAddressButton: {
    flexDirection: 'row',
    backgroundColor: '#f1b811',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addNewAddressButtonText: {
    color: '#fff',
    fontFamily: 'inter-bold',
    marginLeft: 8,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#666',
  },
  saveDefaultButton: {
    backgroundColor: '#f1b811',
  },
  cancelButtonText: {
    color: '#333',
    fontFamily: 'inter-bold',
    fontSize: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontFamily: 'inter-bold',
    fontSize: 16,
  },
  saveDefaultButtonText: {
    color: '#fff',
    fontFamily: 'inter-bold',
    fontSize: 16,
  },
  loadingAddresses: {
    marginVertical: 10,
  },
  // Alert Styles
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  alertTitle: {
    fontFamily: 'inter-bold',
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  alertMessage: {
    fontFamily: 'inter-regular',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
    lineHeight: 20,
  },
  alertButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  alertButtonText: {
    color: 'white',
    fontFamily: 'inter-medium',
    fontSize: 16,
  },
});

export default Payment;