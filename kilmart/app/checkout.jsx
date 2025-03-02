import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TextInput, TouchableOpacity, Modal } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';

// Dummy cart data
const dummyCart = [
  {
    id: '1',
    name: 'Basmati Rice',
    image: require('../assets/images/basmati.png'),
    price: 'GH₵ 500.00',
    quantity: 2,
  },
  {
    id: '2',
    name: 'Doughnut',
    image: require('../assets/images/doughnut.png'),
    price: 'GH₵ 120.00',
    quantity: 1,
  },
  {
    id: '3',
    name: 'Chips Ahoy',
    image: require('../assets/images/ahoy.png'),
    price: 'GH₵ 68.00',
    quantity: 3,
  },
];

export default function Checkout() {
  const [modalVisible, setModalVisible] = useState(false);

  // Calculate the total price
  const totalPrice = dummyCart.reduce(
    (sum, item) => sum + parseFloat(item.price.replace('GH₵ ', '')) * item.quantity,
    0
  );

  return (
    <View style={styles.container}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Order Summary Section */}
        <View style={styles.section}>
          {dummyCart.map((item) => (
            <View key={item.id} style={styles.cartItem}>
              <Image source={item.image} style={styles.cartItemImage} />
              <View style={styles.cartItemDetails}>
                <Text style={styles.cartItemName}>{item.name}</Text>
                <Text style={styles.cartItemPrice}>
                  {item.price} x {item.quantity}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Total Price Section */}
        <View style={styles.totalContainer}>
          <Text style={styles.totalText}>Total: GH₵{totalPrice.toFixed(2)}</Text>
        </View>

        {/* Payment Button */}
        <TouchableOpacity style={styles.paymentButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.paymentButtonText}>Proceed to Payment</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Delivery Details Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Delivery Details <MaterialIcons name="delivery-dining" size={30} color="black" /></Text>

            <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#999" />
            <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor="#999" keyboardType="phone-pad" />
            <TextInput style={styles.input} placeholder="Delivery Address" placeholderTextColor="#999" />
            <TextInput style={styles.input} placeholder="City" placeholderTextColor="#999" />

            {/* Close Modal & Proceed */}
            <TouchableOpacity style={styles.modalButton} onPress={() => { setModalVisible(false); router.push('/payment'); }}>
              <Text style={styles.modalButtonText}>Confirm & Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
    padding: 20
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dark overlay
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'inter-bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    fontSize: 16,
    color: '#333',
  },
  modalButton: {
    backgroundColor: 'black',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom:20,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 15,
  },
  modalButtonText: {
    fontSize: 18,
    fontFamily: 'inter-bold',
    color: '#fff',
  },
});
