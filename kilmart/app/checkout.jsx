import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TextInput, TouchableOpacity, Modal } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useCart } from '../context/CartContext';

export default function Checkout() {
  const { cartItems, totalPrice, totalItems } = useCart();

  const handleCheckout = () => {
    router.push({
      pathname: '/payment',
      params: {
        cartItems: JSON.stringify(cartItems),
        totalPrice: totalPrice,
      }
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Order Summary ({totalItems} items)</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
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
            <Text style={{ textAlign: 'center', color: '#666', marginTop: 20 }}>
              Your cart is empty.
            </Text>
          )}
        </View>

        {/* Total Price Section */}
        <View style={styles.totalContainer}>
          <Text style={styles.totalText}>Total: GH₵{totalPrice.toFixed(2)}</Text>
        </View>

        {/* Payment Button */}
        {cartItems.length > 0 && (
          <TouchableOpacity style={styles.paymentButton} onPress={handleCheckout}>
            <Text style={styles.paymentButtonText}>Checkout</Text>
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
    paddingTop: 60,
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'inter-bold',
    marginBottom: 10,
    color: '#333',
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 10,
  },
  cartItemImage: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
    marginRight: 10,
    borderRadius: 8,
  },
  cartItemDetails: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontFamily: 'inter-bold',
    marginBottom: 3,
  },
  cartItemPrice: {
    fontSize: 14,
    color: '#666',
  },
  totalContainer: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 10,
    marginTop: 15,
  },
  totalText: {
    fontSize: 18,
    fontFamily: 'inter-bold',
    textAlign: 'right',
    marginRight: 10,
  },
  paymentButton: {
    backgroundColor: 'black',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  paymentButtonText: {
    fontSize: 18,
    fontFamily: 'inter-bold',
    color: '#fff',
  },
});
