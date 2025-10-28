import { View, TextInput, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import apiClient from '../../utils/apiClient';

// Header Component with Search
export function Header({ onSearchResults, onSearchLoading }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);

  const performSearch = async (query) => {
    if (query.trim() === '') {
      onSearchResults([]);
      return;
    }

    onSearchLoading(true);
    try {
      const response = await apiClient.get(`api/products/?search=${encodeURIComponent(query)}`);
      // Extract the data array from the response
      onSearchResults(response.data.data || []);
    } catch (error) {
      console.error('Search error:', error);
      onSearchResults([]);
    } finally {
      onSearchLoading(false);
    }
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      performSearch(text);
    }, 500);

    setSearchTimeout(timeout);
  };

  const clearSearch = () => {
    setSearchQuery('');
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    onSearchResults([]);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>SEARCH BRANDS AND PRODUCTS</Text>
      <View style={styles.searchContainer}>
        <EvilIcons name="search" size={24} color="#777" style={styles.searchIcon} />
        <TextInput
          placeholder="Search...."
          placeholderTextColor="#999"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={handleSearchChange}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <EvilIcons name="close" size={20} color="#777" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// Search Screen Component
export default function SearchScreen() {
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const router = useRouter();

  const handleSearchResults = (results) => {
    setSearchResults(results);
    setHasSearched(true);
  };

  const handleSearchLoading = (isLoading) => {
    setLoading(isLoading);
  };

  const handleProductPress = (product) => {
    router.push({
      pathname: '/product-detail',
      params: {
        productId: product.id.toString(),
        productName: product.name,
        productPrice: product.price,
        productImage: product.product_image,
        productDescription: product.description || 'No description available for this product.',
        product_sku: product.product_sku,
        available_stock: product.available_stock.toString()
      }
    });
  };

  const renderProductItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.productItem}
      onPress={() => handleProductPress(item)}
    >
      <Image 
        source={{ uri: item.product_image }} 
        style={styles.productImage}
        defaultSource={require('../../assets/images/kwikmart_logo.png')}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productSku}>SKU: {item.product_sku}</Text>
        <Text style={styles.productPrice}>GHC {item.price}</Text>
        <Text style={styles.stockText}>
          {item.available_stock > 0 ? 
            `${item.available_stock} in stock` : 
            'Out of stock'
          }
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#f1b811" />
          <Text style={styles.emptyText}>Searching...</Text>
        </View>
      );
    }

    if (hasSearched && searchResults.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <FontAwesome5 name="search" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No products found</Text>
          <Text style={styles.emptySubText}>Try different keywords</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <FontAwesome5 name="search" size={100} color="#ccc" style={styles.icon} />
        <Text style={styles.text}>Search For Products & Brands</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header 
        onSearchResults={handleSearchResults} 
        onSearchLoading={handleSearchLoading} 
      />
      
      {searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.resultsContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.resultsCount}>
              Found {searchResults.length} product{searchResults.length !== 1 ? 's' : ''}
            </Text>
          }
        />
      ) : (
        renderEmptyState()
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
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
    marginBottom: 10,
  },
  searchContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 15,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingLeft: 40,
    paddingRight: 40,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  clearButton: {
    position: 'absolute',
    right: 15,
    zIndex: 1,
    padding: 5,
  },
  // Search Results Styles
  resultsContainer: {
    padding: 16,
  },
  resultsCount: {
    fontFamily: 'inter-regular',
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  productItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontFamily: 'inter-bold',
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  productSku: {
    fontFamily: 'inter-regular',
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  productPrice: {
    fontFamily: 'inter-bold',
    fontSize: 18,
    color: '#f1b811',
    marginBottom: 4,
  },
  stockText: {
    fontFamily: 'inter-regular',
    fontSize: 12,
    color: '#666',
  },
  // Empty State Styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  icon: {
    marginBottom: 20,
  },
  text: {
    fontFamily: 'inter-regular',
    fontSize: 18,
    color: 'grey',
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: 'inter-bold',
    fontSize: 20,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: {
    fontFamily: 'inter-regular',
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});