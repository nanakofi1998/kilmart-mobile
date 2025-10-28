import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  Platform,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext'; 

export default function ProductDetail() {
  const { 
    productId, 
    productName, 
    productPrice, 
    productImage, 
    productDescription,
    product_sku,
    available_stock 
  } = useLocalSearchParams();
  
  const insets = useSafeAreaInsets();
  const { addToCart } = useCart(); 
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleAddToCart = async () => {
    setAddingToCart(true);
    try {
      const product = {
        id: productId,
        name: productName,
        price: productPrice,
        image: productImage,
        sku: product_sku,
        stock: parseInt(available_stock || 0) // Use 'stock' to match your CartContext
      };

      await addToCart(product, quantity);
      
      // Show success message
      alert(`${quantity} ${productName} added to cart successfully!`);
      
      // Reset quantity after adding to cart
      setQuantity(1);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add product to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const incrementQuantity = () => {
    const maxStock = parseInt(available_stock || 0);
    if (quantity < maxStock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const isOutOfStock = parseInt(available_stock || 0) <= 0;

  return (
    <View style={[
      styles.container,
      { paddingTop: Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight }
    ]}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
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
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: productImage }} 
            style={styles.productImage} 
            resizeMode="contain"
            defaultSource={require('../assets/images/kwikmart.png')}
          />
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{productName}</Text>
          <Text style={styles.productSku}>SKU: {product_sku}</Text>
          <Text style={styles.productPrice}>GH₵{productPrice}</Text>
          
          {/* Stock Status */}
          <Text style={[
            styles.stockStatus,
            { color: !isOutOfStock ? '#4CAF50' : '#F44336' }
          ]}>
            {!isOutOfStock ? `${available_stock} in stock` : 'Out of stock'}
          </Text>

          {/* Quantity Selector */}
          {!isOutOfStock && (
            <View style={styles.quantityContainer}>
              <Text style={styles.quantityLabel}>Quantity:</Text>
              <View style={styles.quantitySelector}>
                <TouchableOpacity 
                  style={[
                    styles.quantityButton,
                    quantity <= 1 && styles.quantityButtonDisabled
                  ]}
                  onPress={decrementQuantity}
                  disabled={quantity <= 1}
                >
                  <Ionicons 
                    name="remove" 
                    size={20} 
                    color={quantity <= 1 ? '#ccc' : '#333'} 
                  />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{quantity}</Text>
                <TouchableOpacity 
                  style={[
                    styles.quantityButton,
                    quantity >= parseInt(available_stock) && styles.quantityButtonDisabled
                  ]}
                  onPress={incrementQuantity}
                  disabled={quantity >= parseInt(available_stock)}
                >
                  <Ionicons 
                    name="add" 
                    size={20} 
                    color={quantity >= parseInt(available_stock) ? '#ccc' : '#333'} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {/* Description Section */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.productDescription}>
              {productDescription || 'No description available for this product.'}
            </Text>
          </View>

          {/* Product Features */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Product Features</Text>
            <View style={styles.featureItem}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#666" />
              <Text style={styles.featureText}>Authentic product guarantee</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="return-down-back-outline" size={18} color="#666" />
              <Text style={styles.featureText}>Easy returns within 7 days</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Add to Cart Button */}
      <View style={[
        styles.footer,
        { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 10 : 10 }
      ]}>
        <TouchableOpacity 
          style={[
            styles.addToCartButton,
            { opacity: !isOutOfStock ? 1 : 0.5 }
          ]} 
          onPress={handleAddToCart}
          disabled={isOutOfStock || addingToCart}
        >
          {addingToCart ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="cart-outline" size={20} color="#fff" />
              <Text style={styles.addToCartText}>
                {isOutOfStock ? 'Out of Stock' : `Add ${quantity} to Cart`}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
    width: 34,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  imageContainer: {
    backgroundColor: '#f9f9f9',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productImage: {
    width: '100%',
    height: 300,
    borderRadius: 10,
  },
  productInfo: {
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontFamily: 'inter-bold',
    color: '#333',
    marginBottom: 8,
    lineHeight: 28,
  },
  productSku: {
    fontSize: 14,
    fontFamily: 'inter-regular',
    color: '#666',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 28,
    fontFamily: 'inter-bold',
    color: '#f1b811',
    marginBottom: 12,
  },
  stockStatus: {
    fontSize: 16,
    fontFamily: 'inter-medium',
    marginBottom: 20,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  quantityLabel: {
    fontFamily: 'inter-medium',
    fontSize: 16,
    color: '#333',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  quantityButton: {
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  quantityButtonDisabled: {
    backgroundColor: '#f5f5f5',
  },
  quantityText: {
    fontFamily: 'inter-medium',
    fontSize: 16,
    paddingHorizontal: 20,
    minWidth: 40,
    textAlign: 'center',
  },
  descriptionSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'inter-bold',
    color: '#333',
    marginBottom: 12,
  },
  productDescription: {
    fontSize: 16,
    fontFamily: 'inter-regular',
    color: '#666',
    lineHeight: 22,
  },
  featuresSection: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 5,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'inter-regular',
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  addToCartButton: {
    flexDirection: 'row',
    backgroundColor: '#f1b811',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addToCartText: {
    fontSize: 18,
    fontFamily: 'inter-bold',
    color: '#fff',
    marginLeft: 8,
  },
});