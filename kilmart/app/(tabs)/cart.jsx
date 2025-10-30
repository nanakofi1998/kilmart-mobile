import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Image, 
  TouchableOpacity, ScrollView, Modal, Animated 
} from 'react-native';
import Octicons from '@expo/vector-icons/Octicons';
import { useRouter } from 'expo-router';
import { useCart } from '../../context/CartContext';
import EmptyCart from '../../components/Cart/EmptyCart';
import Header from '../../components/Cart/Header';

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
  const [fadeAnim] = useState(new Animated.Value(0));

  const showAlert = (message) => {
    setStockLimitMessage(message);
    setAlertVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideAlert = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setAlertVisible(false);
    });
  };

  const handleQuantityChange = (item, newQuantity) => {
    if (newQuantity < 1) return;

    if (newQuantity > item.stock) {
      showAlert(`Only ${item.stock} items available for "${item.name}".`);
      return;
    }

    updateItemQuantity(item.id, newQuantity);
  };

  const handleCheckout = () => {
    router.push('/checkout');
  };

  const CustomAlert = () => (
    <Modal
      visible={alertVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={hideAlert}
    >
      <View style={styles.alertOverlay}>
        <Animated.View 
          style={[
            styles.alertContainer,
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.alertHeader}>
            <Octicons name="info" size={24} color="#f1b811" />
            <Text style={styles.alertTitle}>Stock Limit</Text>
          </View>
          
          <Text style={styles.alertMessage}>{stockLimitMessage}</Text>
          
          <TouchableOpacity 
            style={styles.alertButton}
            onPress={hideAlert}
          >
            <Text style={styles.alertButtonText}>Okay</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Header />
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
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <Image 
                  source={{ uri: item.image || item.product_image }} 
                  style={styles.itemImage} 
                  defaultSource={require('../../assets/images/kwikmart_logo.png')}
                />
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>
                    GH₵{(item.price || 0).toFixed(2)}
                  </Text>

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
              <Text style={styles.totalItems}>
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </Text>
              <Text style={styles.totalText}>
                Total: GH₵{totalPrice.toFixed(2)}
              </Text>
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

      <CustomAlert />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc' 
  },
  emptyCart: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingHorizontal: 20 
  },
  continueShopping: { 
    backgroundColor: '#f1b811', 
    paddingHorizontal: 30,
    paddingVertical: 15, 
    borderRadius: 25, 
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  continueShoppingText: { 
    color: '#fff', 
    fontWeight: '600',
    fontSize: 16 
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  itemImage: {
    width: 80, 
    height: 80, 
    borderRadius: 8, 
    marginRight: 16, 
    backgroundColor: '#f1f5f9'
  },
  itemDetails: { 
    flex: 1 
  },
  itemName: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#1e293b',
    marginBottom: 4 
  },
  itemPrice: { 
    fontSize: 16, 
    color: '#f1b811', 
    fontWeight: '700',
    marginBottom: 12 
  },
  quantityContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  quantityButton: {
    backgroundColor: '#f1f5f9',
    width: 32, 
    height: 32, 
    borderRadius: 16,
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  quantityButtonText: { 
    fontSize: 16, 
    fontWeight: '600',
    color: '#64748b' 
  },
  quantityText: { 
    marginHorizontal: 16, 
    fontSize: 16, 
    fontWeight: '600',
    color: '#1e293b',
    minWidth: 20,
    textAlign: 'center'
  },
  removeButton: { 
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fef2f2'
  },
  listContent: { 
    paddingBottom: 120,
    paddingTop: 8 
  },
  footer: {
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0,
    backgroundColor: '#fff', 
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1, 
    borderTopColor: '#e2e8f0',
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  totalContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 16 
  },
  totalItems: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500'
  },
  totalText: { 
    fontSize: 20, 
    fontWeight: '700',
    color: '#1e293b'
  },
  checkoutButton: { 
    backgroundColor: '#f1b811', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center',
    shadowColor: '#f1b811',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutButtonText: { 
    color: '#fff', 
    fontWeight: '600', 
    fontSize: 16 
  },
  // Custom Alert Styles
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginLeft: 12,
  },
  alertMessage: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 22,
    marginBottom: 24,
  },
  alertButton: {
    backgroundColor: '#000000ff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  alertButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});