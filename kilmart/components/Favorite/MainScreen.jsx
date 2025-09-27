import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AntDesign } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import apiClient from '../../utils/apiClient';
import AwesomeAlert from 'react-native-awesome-alerts';
import { useCart } from '../../context/CartContext';

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alert, setAlert] = useState({ show: false, title: '', message: '' });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const router = useRouter();
  const { addToCart } = useCart();

  const showAlert = (title, message) => {
    setAlert({ show: true, title, message });
  };

  const fetchFavorites = async () => {
    try {
      const response = await apiClient.get('api/favourites/');
      console.log('Favorites response:', response.data);
      setFavorites(response.data || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      if (error.response?.status === 401) {
        showAlert('Error', 'Please login to view your favorites');
      } else {
        showAlert('Error', 'Failed to load favorites. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const removeFromFavorites = async (favoriteId, event) => {
    if (event) event.stopPropagation();
    
    try {
      await apiClient.delete(`api/favourites/${favoriteId}/`);
      showAlert('Success', 'Product removed from favorites!');
      setFavorites(prev => prev.filter(item => item.id !== favoriteId));
    } catch (error) {
      console.error('Error removing from favorites:', error);
      showAlert('Error', 'Failed to remove from favorites. Please try again.');
      fetchFavorites();
    }
  };

  const confirmRemove = (favoriteId, productName, event) => {
    if (event) event.stopPropagation();
    
    Alert.alert(
      'Remove Favorite',
      `Are you sure you want to remove ${productName} from favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeFromFavorites(favoriteId) }
      ]
    );
  };

  const handleProductPress = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setIsModalVisible(true);
  };

  const handleViewProduct = (product) => {
    if (product?.product?.id) {
      setIsModalVisible(false);
      router.push({
        pathname: '/product-detail',
        params: { 
          productId: product.product.id,
          productName: product.product.name,
          productPrice: product.product.price,
          productImage: product.product.image,
          productDescription: product.product.description
        }
      });
    }
  };

  const handleQuantityChange = (amount) => {
    const maxQty = selectedProduct?.product?.stock || 0;
    const newQty = Math.max(1, Math.min(quantity + amount, maxQty));
    setQuantity(newQty);
  };

  const handleAddToCart = async () => {
    if (!selectedProduct?.product) {
      showAlert('Error', 'No product selected');
      return;
    }

    try {
      const product = selectedProduct.product;
      
      if (product.stock === 0) {
        showAlert('Unavailable', 'This product is out of stock.');
        return;
      }

      if (quantity > product.stock) {
        showAlert('Out of Stock', `Only ${product.stock} available`);
        return;
      }

      await addToCart(product, quantity);

      showAlert('Success', `${product.name} (${quantity}) added to your cart!`);
      
      setIsModalVisible(false);
      setQuantity(1);
    } catch (error) {
      showAlert('Error', 'Failed to add item to cart');
      console.error('Add to cart error:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFavorites();
  };

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [])
  );

  const renderProductItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => handleProductPress(item)}
      activeOpacity={0.7}
    >
      <Image 
        source={{ uri: item.product?.image || 'https://via.placeholder.com/100' }} 
        style={styles.productImage}
        defaultSource={require('../../assets/images/kwikmart.png')}
      />
      
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.product?.name || 'Unknown Product'}
        </Text>
        <Text style={styles.productPrice}>
          GH₵{item.product?.price ? parseFloat(item.product.price).toFixed(2) : '0.00'}
        </Text>
        {item.product?.in_stock !== undefined && (
          <Text style={[
            styles.stockStatus,
            { color: item.product.in_stock ? '#4CAF50' : '#F44336' }
          ]}>
            {item.product.in_stock ? 'In Stock' : 'Out of Stock'}
          </Text>
        )}
        
        {/* Quick Action Buttons */}
        <View style={styles.quickActions}>
          {/* <TouchableOpacity 
            style={styles.viewButton}
            onPress={(e) => {
              e.stopPropagation();
              handleViewProduct(item);
            }}
          >
            <Text style={styles.viewButtonText}>View Product</Text>
          </TouchableOpacity> */}
          <Text style={styles.tapToViewText}>Tap to View</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.favoriteButton}
        onPress={(e) => confirmRemove(item.id, item.product?.name, e)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <MaterialIcons name="favorite" size={24} color="#FF5252" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const EmptyFavorites = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <MaterialIcons name="favorite" size={120} color="#ccc" />
      </View>
      <Text style={styles.emptyText}>Your Favorites Will Appear Here!</Text>
      <Text style={styles.emptySubtext}>
        Start adding products to your favorites by tapping the heart icon on any product.
      </Text>
      <TouchableOpacity 
        style={styles.browseButton}
        onPress={() => router.push('/categories')}
      >
        <Text style={styles.browseButtonText}>Browse Products</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading your favorites...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>
          {favorites.length} {favorites.length === 1 ? 'item' : 'items'}
        </Text>
      </View>

      {favorites.length === 0 ? (
        <EmptyFavorites />
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#000']}
              tintColor={'#000'}
            />
          }
          showsVerticalScrollIndicator={false}
          style={styles.flatList}
        />
      )}

      {/* Product Action Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setIsModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Image 
              source={{ uri: selectedProduct?.product?.image }} 
              style={styles.modalImage}
              defaultSource={require('../../assets/images/kwikmart.png')}
            />
            
            <Text style={styles.modalProductName}>{selectedProduct?.product?.name}</Text>
            <Text style={styles.modalProductPrice}>
              GH₵{selectedProduct?.product?.price ? parseFloat(selectedProduct.product.price).toFixed(2) : '0.00'}
            </Text>
            
            <Text style={styles.modalStock}>
              Available: {selectedProduct?.product?.stock || 0} units
            </Text>

            {/* Quantity Selector */}
            <View style={styles.quantityContainer}>
              <Text style={styles.quantityLabel}>Quantity:</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={[styles.quantityButton, { opacity: quantity <= 1 ? 0.4 : 1 }]}
                  onPress={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  <AntDesign name="minus" size={20} color="#fff" />
                </TouchableOpacity>

                <TextInput
                  style={styles.quantityInput}
                  value={quantity.toString()}
                  editable={false}
                />

                <TouchableOpacity
                  style={[styles.quantityButton, { 
                    opacity: quantity >= (selectedProduct?.product?.stock || 0) ? 0.4 : 1 
                  }]}
                  onPress={() => handleQuantityChange(1)}
                  disabled={quantity >= (selectedProduct?.product?.stock || 0)}
                >
                  <AntDesign name="plus" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.viewDetailButton}
                onPress={() => handleViewProduct(selectedProduct)}
              >
                <Text style={styles.viewDetailButtonText}>View Details</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.addToCartButton,
                  { opacity: selectedProduct?.product?.stock === 0 ? 0.6 : 1 }
                ]}
                onPress={handleAddToCart}
                disabled={selectedProduct?.product?.stock === 0}
              >
                <Text style={styles.addToCartButtonText}>
                  {selectedProduct?.product?.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'inter-bold',
    color: '#333',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'inter-regular',
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'inter-regular',
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowColor: '#000',
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 20,
  },
  emptyText: {
    fontFamily: 'inter-medium',
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtext: {
    fontFamily: 'inter-regular',
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  browseButton: {
    backgroundColor: '#f1b811',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  browseButtonText: {
    fontFamily: 'inter-bold',
    fontSize: 16,
    color: '#fff',
  },
  flatList: {
    flex: 1,
  },
  listContainer: {
    padding: 10,
    paddingBottom: 20,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontFamily: 'inter-bold',
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  productPrice: {
    fontFamily: 'inter-bold',
    fontSize: 18,
    color: '#000',
    marginBottom: 5,
  },
  stockStatus: {
    fontFamily: 'inter-regular',
    fontSize: 12,
    marginBottom: 10,
  },
  quickActions: {
    flexDirection: 'row',
    marginTop: 5,
  },
  viewButton: {
    backgroundColor: '#f1b811',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  viewButtonText: {
    fontFamily: 'inter-medium',
    fontSize: 12,
    color: '#fff',
  },
  favoriteButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: 'center',
    maxHeight: '80%',
  },
  modalImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 15,
    borderRadius: 10,
  },
  modalProductName: {
    fontFamily: 'inter-bold',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 5,
  },
  modalProductPrice: {
    fontFamily: 'inter-bold',
    fontSize: 20,
    color: '#000',
    marginBottom: 10,
  },
  modalStock: {
    fontFamily: 'inter-regular',
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  quantityLabel: {
    fontFamily: 'inter-medium',
    fontSize: 16,
    color: '#333',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    padding: 8,
    backgroundColor: '#f1b811',
    borderRadius: 20,
    marginHorizontal: 5,
  },
  quantityInput: {
    width: 50,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'inter-bold',
    marginHorizontal: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
    gap: 10,
  },
  viewDetailButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#0f0e0eff',
    borderRadius: 50,
    alignItems: 'center',
  },
  viewDetailButtonText: {
    fontFamily: 'inter-bold',
    fontSize: 14,
    color: '#fff',
  },
  addToCartButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f1b811',
    borderRadius: 50,
    alignItems: 'center',
  },
  addToCartButtonText: {
    fontFamily: 'inter-bold',
    fontSize: 14,
    color: '#fff',
  },
  closeButton: {
    padding: 12,
    width: '100%',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  closeButtonText: {
    fontFamily: 'inter-medium',
    fontSize: 16,
    color: '#666',
  },
  tapToViewText: {
    fontFamily: 'inter-bold',
    fontSize: 10,
    color: '#999',
    alignSelf: 'center',
  },
});