import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Platform,
  StatusBar
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/core';
import apiClient from '../utils/apiClient';

function Header() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[
      styles.headerContainer,
      { paddingTop: Platform.OS === 'ios' ? insets.top : 20 }
    ]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="chevron-back-sharp" size={24} color="black" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>My Orders</Text>
      <View style={styles.headerPlaceholder} />
    </View>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('api/v1/list/');
        console.log('Orders response:', JSON.stringify(response.data, null, 2));
        setOrders(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders. Please try again.');
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const fetchOrderDetails = async (orderId) => {
    try {
      setModalLoading(true);
      setModalError(null);
      const response = await apiClient.get(`api/v1/${orderId}/`);
      //console.log('Order details response:', JSON.stringify(response.data, null, 2));
      setSelectedOrder(response.data);
      setModalLoading(false);
      setIsModalVisible(true);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setModalError('Failed to load order details. Please try again.');
      setModalLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  const calculateTotal = (orderItems) => {
    return orderItems.reduce((sum, item) => sum + parseFloat(item.subtotal), 0).toFixed(2);
  };

  // Helper function to get status styles based on actual status
  const getStatusStyles = (paymentStatus, orderStatus) => {
    // Payment status styles
    if (paymentStatus === 'Paid') {
      return {
        backgroundColor: '#e6f3e6',
        color: '#2e7d32',
        text: 'Paid'
      };
    } else if (paymentStatus === 'Unpaid') {
      return {
        backgroundColor: '#ffebee',
        color: '#d32f2f',
        text: 'Unpaid'
      };
    } else {
      return {
        backgroundColor: '#fff3e0',
        color: '#f57c00',
        text: paymentStatus || 'Pending'
      };
    }
  };

  // Helper function to get order status styles
  const getOrderStatusStyles = (orderStatus) => {
    switch (orderStatus) {
      case 'Approved':
        return {
          backgroundColor: '#e8f5e8',
          color: '#2e7d32',
          text: 'Approved'
        };
      case 'Pending':
        return {
          backgroundColor: '#fff3e0',
          color: '#f57c00',
          text: 'Processing'
        };
      case 'Shipped':
        return {
          backgroundColor: '#e3f2fd',
          color: '#1976d2',
          text: 'Shipped'
        };
      case 'Delivered':
        return {
          backgroundColor: '#e6f3e6',
          color: '#2e7d32',
          text: 'Delivered'
        };
      case 'Cancelled':
        return {
          backgroundColor: '#ffebee',
          color: '#d32f2f',
          text: 'Cancelled'
        };
      default:
        return {
          backgroundColor: '#f5f5f5',
          color: '#666',
          text: orderStatus || 'Pending'
        };
    }
  };

  const renderOrderItem = ({ item }) => {
    const firstItem = item.order_items && item.order_items.length > 0 ? item.order_items[0] : null;
    const paymentStatus = getStatusStyles(item.payment_status, item.status);
    const orderStatus = getOrderStatusStyles(item.status);

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => fetchOrderDetails(item.order_id)}
      >
        <Text style={styles.orderDate}>Ordered on {formatDate(item.order_date)}</Text>
        {firstItem ? (
          <View style={styles.orderItem}>
            <Image
              source={{
                uri: firstItem.product_details.product_image || 'https://via.placeholder.com/80',
              }}
              style={styles.itemImage}
              resizeMode="cover"
              onError={() =>
                console.log('Image failed to load:', firstItem.product_details.product_image)
              }
            />
            <View style={styles.orderDetails}>
              <Text style={styles.itemName}>{firstItem.product_details.name}</Text>
              <Text style={styles.quantity}>Quantity: {firstItem.quantity}</Text>
              <Text style={styles.viewDetailsText}>Tap to view order details</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.noItemsText}>No items in this order</Text>
        )}
        
        <View style={styles.statusContainer}>
          <Text style={[
            styles.status,
            { backgroundColor: paymentStatus.backgroundColor, color: paymentStatus.color }
          ]}>
            {paymentStatus.text}
          </Text>
          <Text style={[
            styles.status,
            { backgroundColor: orderStatus.backgroundColor, color: orderStatus.color }
          ]}>
            {orderStatus.text}
          </Text>
        </View>
        
        <Text style={styles.totalAmount}>Total: GH₵{item.total_amount}</Text>
      </TouchableOpacity>
    );
  };

  const renderModalContent = () => {
    if (!selectedOrder) return null;

    const paymentStatus = getStatusStyles(selectedOrder.payment_status, selectedOrder.status);
    const orderStatus = getOrderStatusStyles(selectedOrder.status);

    return (
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setIsModalVisible(false)}
      >
        <View style={[
          styles.modalContent,
          { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 20 : 20 }
        ]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Order Details</Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
          </View>
          {modalLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#000" />
              <Text style={styles.loadingText}>Loading order details...</Text>
            </View>
          ) : modalError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{modalError}</Text>
            </View>
          ) : (
            <View style={styles.modalOrderCard}>
              <Text style={styles.orderDate}>Ordered on {formatDate(selectedOrder.order_date)}</Text>
              
              {/* Order Items */}
              {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                selectedOrder.order_items.map((orderItem, index) => (
                  <View key={index} style={styles.orderItem}>
                    <Image
                      source={{
                        uri: orderItem.product_details.product_image || 'https://via.placeholder.com/80',
                      }}
                      style={styles.itemImage}
                      resizeMode="cover"
                      onError={() =>
                        console.log('Image failed to load:', orderItem.product_details.product_image)
                      }
                    />
                    <View style={styles.orderDetails}>
                      <Text style={styles.itemName}>{orderItem.product_details.name}</Text>
                      <Text style={styles.quantity}>Quantity: {orderItem.quantity}</Text>
                      <Text style={styles.itemPrice}>
                        Price: GH₵{orderItem.price_at_purchase} each
                      </Text>
                      <Text style={styles.itemSubtotal}>
                        Subtotal: GH₵{orderItem.subtotal}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noItemsText}>No items in this order</Text>
              )}
              
              {/* Order Summary */}
              <View style={styles.orderSummary}>
                <Text style={styles.orderId}>Order ID: {selectedOrder.order_id}</Text>
                
                {selectedOrder.shipping_address && (
                  <Text style={styles.address}>Delivery Address: {selectedOrder.shipping_address}</Text>
                )}
                
                <View style={styles.amountContainer}>
                  <Text style={styles.amountLabel}>Total Amount:</Text>
                  <Text style={styles.amount}>GH₵{selectedOrder.total_amount}</Text>
                </View>
                
                {selectedOrder.discount_amount !== "0.00" && (
                  <Text style={styles.discount}>
                    Discount: -GH₵{selectedOrder.discount_amount}
                  </Text>
                )}
                
                {selectedOrder.coupon_code && (
                  <Text style={styles.coupon}>Coupon: {selectedOrder.coupon_code}</Text>
                )}
                
                <Text style={styles.paymentMethod}>
                  Payment Method: {selectedOrder.payment_method}
                </Text>
                
                {selectedOrder.payment_reference && (
                  <Text style={styles.reference}>
                    Reference: {selectedOrder.payment_reference}
                  </Text>
                )}
                
                {/* Status Section */}
                <View style={styles.statusSection}>
                  <Text style={styles.statusSectionTitle}>Order Status</Text>
                  <View style={styles.statusContainer}>
                    <Text style={[
                      styles.status,
                      { backgroundColor: paymentStatus.backgroundColor, color: paymentStatus.color }
                    ]}>
                      Payment: {paymentStatus.text}
                    </Text>
                    <Text style={[
                      styles.status,
                      { backgroundColor: orderStatus.backgroundColor, color: orderStatus.color }
                    ]}>
                      Order: {orderStatus.text}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No orders found.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.order_id}
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 20 : 20 }
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        {renderModalContent()}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#f1b811',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowColor: '#000',
    shadowRadius: 5,
    elevation: 5,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontFamily: 'inter-bold',
    fontSize: 18,
    color: 'black',
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 34,
  },
  listContainer: {
    padding: 20,
    paddingTop: 10,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowColor: '#000',
    shadowRadius: 3,
    elevation: 3,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  orderDetails: {
    flex: 1,
  },
  itemName: {
    fontFamily: 'inter-bold',
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  quantity: {
    fontFamily: 'inter-medium',
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  itemPrice: {
    fontFamily: 'inter-regular',
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  itemSubtotal: {
    fontFamily: 'inter-bold',
    fontSize: 12,
    color: '#333',
  },
  orderSummary: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  orderDate: {
    fontFamily: 'inter-medium',
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  totalAmount: {
    fontFamily: 'inter-bold',
    fontSize: 16,
    color: '#333',
    marginTop: 10,
    textAlign: 'right',
  },
  address: {
    fontFamily: 'inter-medium',
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  amountLabel: {
    fontFamily: 'inter-medium',
    fontSize: 14,
    color: '#666',
  },
  amount: {
    fontFamily: 'inter-bold',
    fontSize: 16,
    color: '#333',
  },
  discount: {
    fontFamily: 'inter-medium',
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 5,
  },
  coupon: {
    fontFamily: 'inter-medium',
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  paymentMethod: {
    fontFamily: 'inter-medium',
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  reference: {
    fontFamily: 'inter-regular',
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
  },
  orderId: {
    fontFamily: 'inter-medium',
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  status: {
    fontFamily: 'inter-medium',
    fontSize: 12,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  statusSection: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statusSectionTitle: {
    fontFamily: 'inter-bold',
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
    fontFamily: 'inter-medium',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    fontFamily: 'inter-medium',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'inter-medium',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontFamily: 'inter-bold',
    fontSize: 18,
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  modalOrderCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
  },
  viewDetailsText: {
    fontFamily: 'inter-medium',
    fontSize: 14,
    color: '#000000ff',
    marginTop: 5,
  },
  noItemsText: {
    fontFamily: 'inter-medium',
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
});