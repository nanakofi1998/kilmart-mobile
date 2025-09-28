import React from 'react';
import { 
  View, 
  Text, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  Platform,
  StatusBar
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProductDetail() {
  const { productId, productName, productPrice, productImage, productDescription } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    router.back();
  };

  const handleAddToCart = () => {
    // Add to cart functionality would go here
    console.log('Add to cart:', { productId, productName, productPrice });
  };

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
          <Text style={styles.productPrice}>GH₵{productPrice}</Text>
          
          {/* Description Section */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.productDescription}>
              {productDescription || 'No description available for this product.'}
            </Text>
          </View>

          {/* Features/Details Section */}
          {/* <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Product Details</Text>
            <View style={styles.featureItem}>
              <Ionicons name="cube-outline" size={18} color="#666" />
              <Text style={styles.featureText}>Free delivery on orders above GH₵100</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#666" />
              <Text style={styles.featureText}>Authentic product guarantee</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="return-down-back-outline" size={18} color="#666" />
              <Text style={styles.featureText}>Easy returns within 7 days</Text>
            </View>
          </View> */}
        </View>
      </ScrollView>

      {/* Add to Cart Button */}
      <View style={[
        styles.footer,
        { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 10 : 10 }
      ]}>
        <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
          <Ionicons name="cart-outline" size={20} color="#fff" />
          <Text style={styles.addToCartText}>Add to Cart</Text>
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
    width: 34, // Same as back button for balance
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80, // Space for the fixed button
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
    marginBottom: 10,
    lineHeight: 28,
  },
  productPrice: {
    fontSize: 28,
    fontFamily: 'inter-bold',
    color: '#f1b811',
    marginBottom: 20,
  },
  descriptionSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'inter-bold',
    color: '#333',
    marginBottom: 10,
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