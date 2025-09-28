import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TextInput, 
  TouchableOpacity, 
  Modal,
  Platform,
  StatusBar 
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useCart } from '../context/CartContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Checkout() {
  const { cartItems, totalPrice, totalItems } = useCart();
  const insets = useSafeAreaInsets();

  const handleCheckout = () => {
    router.push({
      pathname: '/payment',
      params: {
        cartItems: JSON.stringify(cartItems),
        totalPrice: totalPrice,
      }
    });
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={[
      styles.container,
      { paddingTop: Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight }
    ]}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 20 : 20 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Order Summary ({totalItems} items)</Text>
        
        {/* Order Summary Section */}
        <View style={styles.section}>
          {cartItems.map((item) => (
            <View key={item.id} style={styles.cartItem}>
              <Image source={{ uri: item.product_image }} style={styles.cartItemImage} />
              <View style={styles.cartItemDetails}>
                <Text style={styles.cartItemName}>{item.name}</Text>
                <Text style={styles.cartItemPrice}>
                  GH₵{item.price.toFixed(2)} x {item.quantity}
                </Text>
              </View>
            </View>
          ))}
          {cartItems.length === 0 && (
            <Text style={styles.emptyCartText}>
              Your cart is empty.
            </Text>
          )}
        </View>

        {/* Total Price Section */}
        {cartItems.length > 0 && (
          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>Total: GH₵{totalPrice.toFixed(2)}</Text>
          </View>
        )}

        {/* Payment Button */}
        {cartItems.length > 0 && (
          <TouchableOpacity style={styles.paymentButton} onPress={handleCheckout}>
            <Text style={styles.paymentButtonText}>Proceed to Payment</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'inter-bold',
    color: '#333',
  },
  headerPlaceholder: {
    width: 34, // Same as back button for balance
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'inter-bold',
    marginBottom: 20,
    color: '#333',
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cartItemImage: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
    marginRight: 15,
    borderRadius: 8,
  },
  cartItemDetails: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontFamily: 'inter-bold',
    marginBottom: 5,
    color: '#333',
  },
  cartItemPrice: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'inter-regular',
  },
  totalContainer: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 15,
    marginTop: 10,
  },
  totalText: {
    fontSize: 20,
    fontFamily: 'inter-bold',
    textAlign: 'right',
    color: '#333',
  },
  paymentButton: {
    backgroundColor: '#f1b811',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentButtonText: {
    fontSize: 18,
    fontFamily: 'inter-bold',
    color: '#fff',
  },
  emptyCartText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 40,
    fontSize: 16,
    fontFamily: 'inter-regular',
  },
});