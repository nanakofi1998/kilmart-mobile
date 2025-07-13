import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Image, 
  TouchableOpacity, ScrollView 
} from 'react-native';
import Octicons from '@expo/vector-icons/Octicons';
import { useRouter } from 'expo-router';
import { useCart } from '../../context/CartContext';
import EmptyCart from '../../components/Cart/EmptyCart';
import Header from '../../components/Cart/Header';
import AwesomeAlert from 'react-native-awesome-alerts';

export default function Cart() {
  const {
    cartItems,
    removeFromCart,
    updateItemQuantity,
    totalItems,
    totalPrice
  } = useCart();
  const router = useRouter();

  const [alertVisible, setAlertVisible] = useState(false);
  const [stockLimitMessage, setStockLimitMessage] = useState('');

  const handleQuantityChange = (item, newQuantity) => {
    if (newQuantity < 1) return;

    if (newQuantity > item.stock) {
      setStockLimitMessage(`Only ${item.stock} items available for "${item.name}".`);
      setAlertVisible(true);
      return;
    }

    updateItemQuantity(item.id, newQuantity);
  };

  const handleCheckout = () => {
    router.push('/checkout');
  };

  return (
    <View style={styles.container}>
      {cartItems.length === 0 ? (
        <View style={styles.emptyCart}>
          <EmptyCart />
          <TouchableOpacity
            style={styles.continueShopping}
            onPress={() => router.back()}
          >
            <Text style={styles.continueShoppingText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Header />

          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <Image source={{ uri: item.product_image }} style={styles.itemImage} />
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>GH₵{item.price.toFixed(2)}</Text>

                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleQuantityChange(item, item.quantity - 1)}
                    >
                      <Text style={styles.quantityButtonText}>-</Text>
                    </TouchableOpacity>

                    <Text style={styles.quantityText}>{item.quantity}</Text>

                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleQuantityChange(item, item.quantity + 1)}
                    >
                      <Text style={styles.quantityButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeFromCart(item.id)}
                >
                  <Octicons name="trash" size={20} color="#ff4444" />
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={styles.listContent}
          />

          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalText}>Total: GH₵{totalPrice.toFixed(2)}</Text>
            </View>

            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={handleCheckout}
            >
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Awesome Alert */}
      <AwesomeAlert
        show={alertVisible}
        showProgress={false}
        title="Stock Limit"
        message={stockLimitMessage}
        closeOnTouchOutside={true}
        closeOnHardwareBackPress={false}
        showConfirmButton={true}
        confirmText="Okay"
        confirmButtonColor="#000"
        onConfirmPressed={() => setAlertVisible(false)}
        contentContainerStyle={{ borderRadius: 15 }}
        titleStyle={{ fontFamily: 'inter-bold', fontSize: 20, color: '#333' }}
        messageStyle={{ fontSize: 16, color: '#555' }}
        confirmButtonStyle={{ borderRadius: 10 }}
        confirmButtonTextStyle={{ fontFamily: 'inter-bold', fontSize: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  emptyCart: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  continueShopping: { backgroundColor: '#000', padding: 15, borderRadius: 50, marginTop: 15 },
  continueShoppingText: { color: '#fff', fontWeight: 'bold' },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    marginTop: 20,
  },
  itemImage: {
    width: 80, height: 80, borderRadius: 8, marginRight: 15, resizeMode: 'contain'
  },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '600', marginBottom: 5 },
  itemPrice: { fontSize: 14, color: '#666', marginBottom: 10 },
  quantityContainer: { flexDirection: 'row', alignItems: 'center' },
  quantityButton: {
    backgroundColor: '#e0e0e0',
    width: 30, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center',
  },
  quantityButtonText: { fontSize: 18 },
  quantityText: { marginHorizontal: 15, fontSize: 16 },
  removeButton: { padding: 5 },
  listContent: { paddingBottom: 100 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', padding: 15,
    borderTopWidth: 1, borderTopColor: '#eee',
    borderTopLeftRadius: 5, borderTopRightRadius: 5, elevation: 50,
  },
  totalContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  totalText: { fontSize: 18, fontWeight: 'bold' },
  checkoutButton: { backgroundColor: '#000', padding: 15, borderRadius: 50, alignItems: 'center' },
  checkoutButtonText: { color: '#fff', fontWeight: '500', fontSize: 16 },
});
