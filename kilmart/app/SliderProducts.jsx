import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, Dimensions, ScrollView, ActivityIndicator, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../utils/apiClient';
import { useCart } from '../context/CartContext';

const { width } = Dimensions.get('window');

const SliderProducts = () => {
  const { category, categoryId, title } = useLocalSearchParams();
  const router = useRouter();
  const { addToCart } = useCart();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSort, setActiveSort] = useState('featured');
  const [addingToCart, setAddingToCart] = useState({});

  // API endpoints mapping - same as in EnhancedSlider
  const categoryEndpoints = {
    'Discounted': 'api/products/featured/discounted/',
    'Seasonal': 'api/products/featured/seasonal/',
    'Origin Specials': 'api/products/featured/origin/',
    'New Arrivals': 'api/products/featured/new/',
    'Trending Now': 'api/products/featured/trending/',
  };

  useEffect(() => {
    fetchCategoryProducts();
  }, [category]);

  const fetchCategoryProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!category || !categoryEndpoints[category]) {
        setError('Invalid category selected');
        return;
      }

      const endpoint = categoryEndpoints[category];
      console.log('Fetching category products from:', endpoint);
      
      const response = await apiClient.get(endpoint);
      
      // Handle different response formats
      let productsData = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          productsData = response.data;
        } else if (response.data.results) {
          productsData = response.data.results;
        } else if (response.data.data) {
          productsData = response.data.data;
        }
      }

      console.log(`Loaded ${productsData.length} products for ${category}`);
      setProducts(productsData);
      
    } catch (error) {
      console.error('Error fetching category products:', error);
      const errorMessage = error.response?.status === 404 
        ? `No products found for ${category}` 
        : 'Failed to load products. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced sorting options
  const handleSort = (sortType) => {
    setActiveSort(sortType);
    let sorted = [...products];
    
    switch (sortType) {
      case 'price-low':
        sorted.sort((a, b) => {
          const priceA = parseFloat(a.discount_price || a.price) || 0;
          const priceB = parseFloat(b.discount_price || b.price) || 0;
          return priceA - priceB;
        });
        break;
      case 'price-high':
        sorted.sort((a, b) => {
          const priceA = parseFloat(a.discount_price || a.price) || 0;
          const priceB = parseFloat(b.discount_price || b.price) || 0;
          return priceB - priceA;
        });
        break;
      case 'name':
        sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'discount':
        sorted.sort((a, b) => {
          const discountA = a.discount_price ? ((parseFloat(a.price) - parseFloat(a.discount_price)) / parseFloat(a.price)) * 100 : 0;
          const discountB = b.discount_price ? ((parseFloat(b.price) - parseFloat(b.discount_price)) / parseFloat(b.price)) * 100 : 0;
          return discountB - discountA;
        });
        break;
      case 'stock':
        sorted.sort((a, b) => (b.available_stock || 0) - (a.available_stock || 0));
        break;
      default:
        // Featured - keep original order
        break;
    }
    
    setProducts(sorted);
  };

  // Limit description to 30 words
  const truncateDescription = (description) => {
    if (!description) return 'No description available';
    const words = description.split(' ');
    if (words.length > 30) {
      return words.slice(0, 30).join(' ') + '...';
    }
    return description;
  };

  const handleProductPress = (product) => {
    router.push({
      pathname: '/product-detail',
      params: {
        productId: product.id?.toString() || '1',
        productName: product.name || 'Product',
        productPrice: product.price || '0',
        productImage: product.product_image || '',
        productDescription: product.description || 'No description available',
        discountPrice: product.discount_price || '',
        productSku: product.product_sku || '',
        available_stock: product.available_stock?.toString() || '0'
      }
    });
  };

  const showAddToCartAlert = (productName) => {
    Alert.alert(
      'Success! 🎉',
      `${productName} has been added to your cart`,
      [
        {
          text: 'Continue Shopping',
          style: 'cancel'
        },
        {
          text: 'View Cart',
          onPress: () => router.push('/cart')
        }
      ],
      { cancelable: true }
    );
  };

  const handleAddToCart = async (product) => {
    if (product.available_stock === 0) return;
    
    setAddingToCart(prev => ({ ...prev, [product.id]: true }));
    
    try {
      await addToCart({
        id: product.id,
        name: product.name,
        price: product.discount_price || product.price,
        originalPrice: product.price,
        image: product.product_image,
        sku: product.product_sku,
        stock: product.available_stock,
        description: product.description
      }, 1);
      
      console.log('Product added to cart:', product.name);
      
      // Show success alert
      showAddToCartAlert(product.name);
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      
      // Show error alert
      Alert.alert(
        'Error ❌',
        'Failed to add item to cart. Please try again.',
        [{ text: 'OK', style: 'cancel' }]
      );
    } finally {
      setAddingToCart(prev => ({ ...prev, [product.id]: false }));
    }
  };

  const renderProductItem = ({ item, index }) => (
    <View style={[
      styles.productCard,
      index % 2 === 0 ? styles.cardLeft : styles.cardRight
    ]}>
      {/* Product Image */}
      <TouchableOpacity onPress={() => handleProductPress(item)}>
        <View style={styles.imageContainer}>
          {item.product_image ? (
            <Image 
              source={{ uri: item.product_image }} 
              style={styles.productImage}
              defaultSource={require('../assets/images/kwikmart_logo.png')}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={32} color="#ccc" />
            </View>
          )}
          
          {/* Discount Badge */}
          {item.discount_price && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                {Math.round(((parseFloat(item.price) - parseFloat(item.discount_price)) / parseFloat(item.price)) * 100)}% OFF
              </Text>
            </View>
          )}
          
          {/* Stock Status */}
          <View style={[
            styles.stockBadge,
            { backgroundColor: item.available_stock > 10 ? '#10b981' : item.available_stock > 0 ? '#f59e0b' : '#ef4444' }
          ]}>
            <Text style={styles.stockText}>
              {item.available_stock > 10 ? 'In Stock' : item.available_stock > 0 ? 'Low Stock' : 'Out of Stock'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Product Info */}
      <View style={styles.productInfo}>
        <TouchableOpacity onPress={() => handleProductPress(item)} style={styles.productInfoTouchable}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name || 'Unnamed Product'}
          </Text>
          
          <Text style={styles.productDescription} numberOfLines={3}>
            {truncateDescription(item.description)}
          </Text>
          
          {/* Price */}
          <View style={styles.priceContainer}>
            {item.discount_price ? (
              <>
                <Text style={styles.discountPrice}>GH₵{item.discount_price}</Text>
                <Text style={styles.originalPrice}>GH₵{item.price}</Text>
              </>
            ) : (
              <Text style={styles.normalPrice}>GH₵{item.price || '0.00'}</Text>
            )}
          </View>
        </TouchableOpacity>
        
        {/* Add to Cart Button */}
        <TouchableOpacity 
          style={[
            styles.addToCartButton,
            { 
              backgroundColor: item.available_stock > 0 ? '#f1b811' : '#ccc',
              opacity: addingToCart[item.id] ? 0.7 : 1
            }
          ]}
          onPress={() => handleAddToCart(item)}
          disabled={item.available_stock === 0 || addingToCart[item.id]}
        >
          {addingToCart[item.id] ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons 
                name={item.available_stock > 0 ? "cart" : "cart-outline"} 
                size={16} 
                color={item.available_stock > 0 ? "#fff" : "#666"} 
              />
              <Text style={[
                styles.addToCartText,
                { color: item.available_stock > 0 ? "#fff" : "#666" }
              ]}>
                {item.available_stock > 0 ? "Add to Cart" : "Out of Stock"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  // Enhanced sort tabs
  const sortOptions = [
    { key: 'featured', label: 'Featured', icon: 'star' },
    { key: 'name', label: 'Name', icon: 'text' },
    { key: 'price-low', label: 'Price: Low', icon: 'arrow-down' },
    { key: 'price-high', label: 'Price: High', icon: 'arrow-up' },
    { key: 'discount', label: 'Best Deals', icon: 'pricetag' },
    { key: 'stock', label: 'In Stock', icon: 'cube' },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f1b811" />
        <Text style={styles.loadingText}>Loading {category} products...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchCategoryProducts}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {title || category || 'Products'}
          </Text>
          <Text style={styles.productCount}>
            {products.length} {products.length === 1 ? 'product' : 'products'} found
          </Text>
        </View>
        
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton} onPress={fetchCategoryProducts}>
            <Ionicons name="refresh" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Enhanced Sort Options */}
      <View style={styles.sortContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortContent}
        >
          {sortOptions.map((option) => (
            <TouchableOpacity 
              key={option.key}
              style={[
                styles.sortButton,
                activeSort === option.key && styles.sortButtonActive
              ]}
              onPress={() => handleSort(option.key)}
            >
              <Ionicons 
                name={option.icon} 
                size={16} 
                color={activeSort === option.key ? "#fff" : "#64748b"} 
              />
              <Text style={[
                styles.sortText,
                activeSort === option.key && styles.sortTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Products Grid */}
      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.productsGrid}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptyText}>
              No products available in {category} category
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => router.back()}>
              <Text style={styles.emptyButtonText}>Browse Other Categories</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#f1b811',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  productCount: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 4,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    maxHeight: 60,
  },
  sortContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  sortButtonActive: {
    backgroundColor: '#f1b811',
    borderColor: '#f1b811',
  },
  sortText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  sortTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  productsGrid: {
    padding: 8,
    paddingBottom: 100,
    minHeight: 400,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 4,
    marginBottom: 8,
    width: (width - 32) / 2 - 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
  },
  cardLeft: {
    marginLeft: 8,
  },
  cardRight: {
    marginRight: 8,
  },
  imageContainer: {
    position: 'relative',
    height: 140,
    backgroundColor: '#f8fafc',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  stockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stockText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '600',
  },
  productInfo: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  productInfoTouchable: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
    lineHeight: 18,
  },
  productDescription: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 8,
    lineHeight: 14,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  normalPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  discountPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ef4444',
  },
  originalPrice: {
    fontSize: 12,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addToCartText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#f1b811',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#64748b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#f1b811',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SliderProducts;