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
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import apiClient from '../utils/apiClient';
import { useNavigation } from '@react-navigation/core';

function Header() {
  const navigation = useNavigation();
  console.log('Header rendering, Ionicons:', typeof Ionicons); // Debug import
  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back-sharp" size={24} color="black" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>My Orders</Text>
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

  console.log('Orders rendering, Modal:', typeof Modal); // Debug import

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
      console.log('Order details response:', JSON.stringify(response.data, null, 2));
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

  const renderOrderItem = ({ item }) => {
    const firstItem = item.order_items && item.order_items.length > 0 ? item.order_items[0] : null;
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
              <Text style={styles.viewDetailsText}>Tap to view order details</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.noItemsText}>No items in this order</Text>
        )}
        <View style={styles.statusContainer}>
          <Text style={[styles.status, styles.paidStatus]}>Paid</Text>
          <Text style={[styles.status, styles.pendingStatus]}>Delivery Pending</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderModalContent = () => (
    <TouchableOpacity
      style={styles.modalOverlay}
      activeOpacity={1}
      onPress={() => setIsModalVisible(false)}
    >
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Order Details</Text>
          <TouchableOpacity onPress={() => setIsModalVisible(false)}>
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
        ) : !selectedOrder ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Order not found.</Text>
          </View>
        ) : (
          <View style={styles.modalOrderCard}>
            <Text style={styles.orderDate}>Ordered on {formatDate(selectedOrder.order_date)}</Text>
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
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noItemsText}>No items in this order</Text>
            )}
            <View style={styles.orderSummary}>
              <Text style={styles.address}>Delivery Address: {selectedOrder.shipping_address}</Text>
              <Text style={styles.amount}>Total: GH₵{calculateTotal(selectedOrder.order_items)}</Text>
              <View style={styles.statusContainer}>
                <Text style={[styles.status, styles.paidStatus]}>Paid</Text>
                <Text style={[styles.status, styles.pendingStatus]}>Delivery Pending</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

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
          contentContainerStyle={styles.listContainer}
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
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#f1b811',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowColor: '#000',
    shadowRadius: 5,
    elevation: 5,
  },
  headerTitle: {
    fontFamily: 'inter-bold',
    fontSize: 15,
    color: 'black',
    marginLeft: 10,
    alignItems: 'center',
  },
  listContainer: {
    padding: 20,
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
  address: {
    fontFamily: 'inter-medium',
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  amount: {
    fontFamily: 'inter-bold',
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  status: {
    fontFamily: 'inter-medium',
    fontSize: 12,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    marginRight: 10,
  },
  paidStatus: {
    backgroundColor: '#e6f3e6',
    color: '#2e7d32',
  },
  pendingStatus: {
    backgroundColor: '#fff3e0',
    color: '#f57c00',
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