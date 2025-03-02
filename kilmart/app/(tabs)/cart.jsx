{/*import { View, Text, ScrollView } from 'react-native'
import React from 'react'
import Header from '../../components/Cart/Header'
import EmptyCart from '../../components/Cart/EmptyCart'
import AddedCart from '../../components/Cart/AddedCart'

export default function Cart() {
  return (
    <View style={{flex:1}}>*/}
      {/**Header 
      <Header/>
      <ScrollView style={{flexGrow:1, paddingBottom:10}}>*/}
      {/**Empty Cart 
      <EmptyCart/>*/}

      {/**item Added To Cart Screen 
      <AddedCart/>
      </ScrollView>
    </View>
  )
}*/}

import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import Header from '../../components/Cart/Header'; // Assuming you have a Header component
import { router } from 'expo-router';

// Dummy cart data
const dummyCart = [
  {
    id: '1',
    name: 'Basmati Rice',
    image: require('../../assets/images/basmati.png'), // Update the path to your image
    price: 'GH₵ 500.00',
    quantity: 2,
  },
  {
    id: '2',
    name: 'Doughnut',
    image: require('../../assets/images/doughnut.png'), // Update the path to your image
    price: 'GH₵ 120.00',
    quantity: 1,
  },
  {
    id: '3',
    name: 'Chips Ahoy',
    image: require('../../assets/images/ahoy.png'), // Update the path to your image
    price: 'GH₵ 68.00',
    quantity: 3,
  },
];

export default function Cart() {
  // Calculate the total price
  const totalPrice = dummyCart.reduce(
    (sum, item) => sum + parseFloat(item.price.replace('GH₵ ', '')) * item.quantity,
    0
  );

  return (
    <View style={styles.container}>
      <Header />
      {/* Display Cart Items */}
      <FlatList
        style={{ marginTop: 20}}
        data={dummyCart}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <Image source={item.image} style={styles.cartItemImage} />
            <View style={styles.cartItemDetails}>
              <Text style={styles.cartItemName}>{item.name}</Text>
              <Text style={styles.cartItemPrice}>
                {item.price} x {item.quantity}
              </Text>
            </View>
          </View>
        )}
      />

      {/* Total Price */}
      <View style={styles.totalContainer}>
        <Text style={styles.totalText}>Total: GH₵{totalPrice.toFixed(2)}</Text>
      </View>

      {/* Checkout Button */}
      <TouchableOpacity style={styles.checkoutButton} onPress={()=>{router.push('/checkout')}}>
        <Text style={styles.checkoutButtonText}>Checkout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginRight: 10,
  },
  cartItemDetails: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 18,
    fontFamily: 'inter-bold',
    marginBottom: 3,
  },
  cartItemPrice: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'inter-bold',
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
  checkoutButton: {
    backgroundColor: 'black',
    paddingVertical: 15,
    paddingHorizontal: 80,
    borderRadius: 30,
    alignSelf: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  checkoutButtonText: {
    fontSize: 18,
    fontFamily: 'inter-bold',
    color: '#fff',
  },
});