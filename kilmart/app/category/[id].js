import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, FlatList, ScrollView,
  Modal, TextInput, ActivityIndicator, Dimensions, Alert, Platform,
  StatusBar, PanResponder
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiClient from '../../utils/apiClient';
import { useCart } from '../../context/CartContext'

const { width } = Dimensions.get('window');
const numColumns = 3;
const SWIPE_THRESHOLD = 50;

export default function CategoryScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const insets = useSafeAreaInsets();

  const [state, setState] = useState({
    categories: [],
    subCategories: [],
    items: [],
    selectedMainTab: null,
    selectedSubTab: null,
    selectedItem: null,
    quantity: 1,
    isModalVisible: false,
    loading: {
      categories: true,
      subCategories: true,
      items: true
    },
    favorites: [],
    favoriteLoading: {}
  });

  const mainScrollViewRef = useRef(null);
  const subScrollViewRef = useRef(null);
  const tabRefs = useRef({});
  const panResponderRef = useRef(null);
  const isInitializing = useRef(true);
  const hasHandledInitialCategory = useRef(false);
  
  // Use ref to track current category for swipe gestures
  const currentCategoryRef = useRef(null);

  // Update the ref whenever selectedMainTab changes
  useEffect(() => {
    currentCategoryRef.current = state.selectedMainTab;
    console.log('🔄 Ref updated:', currentCategoryRef.current, 'Type:', typeof currentCategoryRef.current);
  }, [state.selectedMainTab]);

  // Create pan responder for swipe gestures
  useEffect(() => {
    panResponderRef.current = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dx } = gestureState;

        if (dx > SWIPE_THRESHOLD) {
          handleSwipe('right');
        } else if (dx < -SWIPE_THRESHOLD) {
          handleSwipe('left');
        }
      },
    });
  }, [state.categories]);

  const handleSwipe = (direction) => {
    if (state.categories.length === 0) return;

    const currentCategoryId = currentCategoryRef.current;
    
    // Convert both to numbers for comparison
    const currentMainIndex = state.categories.findIndex(cat => 
      Number(cat.id) === Number(currentCategoryId)
    );
    
    console.log('🔄 Swipe detected:', direction, 'Current ID:', currentCategoryId, 'Type:', typeof currentCategoryId, 'Current index:', currentMainIndex);
    console.log('📋 Categories:', state.categories.map(cat => `${cat.id}(${typeof cat.id}): ${cat.name}`));
    
    if (currentMainIndex === -1) {
      console.log('❌ Current category not found. Looking for:', currentCategoryId, 'Available:', state.categories.map(c => c.id));
      return;
    }
    
    if (direction === 'left') {
      // Swipe left - go to next category
      if (currentMainIndex < state.categories.length - 1) {
        const nextMain = state.categories[currentMainIndex + 1];
        console.log('🔄 Swipe left: Moving to next category', nextMain.name, 'ID:', nextMain.id, 'Index:', currentMainIndex + 1);
        handleMainTabChange(nextMain.id);
      } else {
        console.log('ℹ️ Already at last category, cannot swipe left');
      }
    } else {
      // Swipe right - go to previous category
      if (currentMainIndex > 0) {
        const prevMain = state.categories[currentMainIndex - 1];
        console.log('🔄 Swipe right: Moving to previous category', prevMain.name, 'ID:', prevMain.id, 'Index:', currentMainIndex - 1);
        handleMainTabChange(prevMain.id);
      } else {
        console.log('ℹ️ Already at first category, cannot swipe right');
      }
    }
  };

  const fetchFavorites = useCallback(async () => {
    try {
      const response = await apiClient.get('api/favourites/');
      setState(prev => ({
        ...prev,
        favorites: response.data || []
      }));
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  }, []);

  const fetchData = useCallback(async (url, stateKey, loadingKey) => {
    try {
      const response = await apiClient.get(url);
      let data = response.data;

      if (stateKey === 'categories') {
        // Sort categories by ID to ensure consistent order and ensure IDs are numbers
        data = data.sort((a, b) => Number(a.id) - Number(b.id)).map(cat => ({
          ...cat,
          id: Number(cat.id) // Ensure ID is a number
        }));
        console.log('📊 Categories loaded and sorted:', data.map(cat => `${cat.id}(${typeof cat.id}): ${cat.name}`));
      }

      if (stateKey === 'items') {
        data = data.map(item => {
          let cleanPrice = Number(item.price);
          if (isNaN(cleanPrice) || cleanPrice === null || cleanPrice === undefined) {
            console.warn(`⚠️ Product "${item.name}" has invalid price value:`, item.price);
            cleanPrice = 0;
          }
          return {
            ...item,
            price: cleanPrice
          };
        });
      }

      setState(prev => ({
        ...prev,
        [stateKey]: data,
        loading: { ...prev.loading, [loadingKey]: false }
      }));
      return data;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, [loadingKey]: false }
      }));
      return [];
    }
  }, []);

  const scrollToTab = useCallback((tabId, scrollViewRef, offset = -10) => {
    const tabRef = tabRefs.current[tabId];
    
    if (tabRef && scrollViewRef.current) {
      // Use a small timeout to ensure the ref is measured correctly
      setTimeout(() => {
        tabRef.measureLayout(
          scrollViewRef.current,
          (x) => {
            if (scrollViewRef.current) {
              scrollViewRef.current.scrollTo({ 
                x: Math.max(0, x + offset), 
                animated: true 
              });
            }
          },
          () => {
            console.log('❌ Failed to measure tab layout for:', tabId);
            // Fallback: scroll to start if measurement fails
            scrollViewRef.current?.scrollTo({ x: 0, animated: true });
          }
        );
      }, 50);
    } else {
      console.log('❌ Tab ref or scrollView ref not available for:', tabId);
    }
  }, []);

  const isItemFavorited = useCallback((itemId) => {
    return state.favorites.some(fav => fav.product?.id === itemId);
  }, [state.favorites]);

  const getFavoriteId = useCallback((itemId) => {
    const favorite = state.favorites.find(fav => fav.product?.id === itemId);
    return favorite?.id;
  }, [state.favorites]);

  const toggleFavorite = useCallback(async (item) => {
    const itemId = item.id;
    const isCurrentlyFavorite = isItemFavorited(itemId);
    const favoriteId = getFavoriteId(itemId);

    setState(prev => ({
      ...prev,
      favoriteLoading: { ...prev.favoriteLoading, [itemId]: true }
    }));

    try {
      if (isCurrentlyFavorite && favoriteId) {
        await apiClient.delete(`api/favourites/${favoriteId}/`);
        setState(prev => ({
          ...prev,
          favorites: prev.favorites.filter(fav => fav.id !== favoriteId)
        }));
        Alert.alert('Success', 'Removed from favorites!');
      } else {
        const response = await apiClient.post('api/favourites/', {
          product: itemId
        });
        setState(prev => ({
          ...prev,
          favorites: [...prev.favorites, response.data]
        }));
        Alert.alert('Success', 'Added to favorites!');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      if (error.response?.status === 401) {
        Alert.alert('Login Required', 'Please login to manage your favorites.');
      } else {
        Alert.alert('Error', 'Failed to update favorites. Please try again.');
      }
    } finally {
      setState(prev => ({
        ...prev,
        favoriteLoading: { ...prev.favoriteLoading, [itemId]: false }
      }));
    }
  }, [isItemFavorited, getFavoriteId]);

  useFocusEffect(useCallback(() => {
    const initialize = async () => {
      if (hasHandledInitialCategory.current) return;

      isInitializing.current = true;
      const cats = await fetchData('api/categories/', 'categories', 'categories');
      await fetchFavorites();

      let targetCategoryId = null;

      // Priority: URL parameter > First category
      if (id && cats.find(cat => cat.id.toString() === id.toString())) {
        targetCategoryId = Number(id); // Ensure URL param is converted to number
        console.log('🔄 Using URL category:', targetCategoryId, 'Type:', typeof targetCategoryId);
      } else if (cats.length > 0) {
        targetCategoryId = cats[0].id;
        console.log('🔄 Using first category:', targetCategoryId, 'Type:', typeof targetCategoryId);
      }

      if (targetCategoryId) {
        await handleMainTabChange(targetCategoryId);
        hasHandledInitialCategory.current = true;
      }

      isInitializing.current = false;
    };
    
    initialize();
  }, [id]));

  const handleMainTabChange = useCallback(async (categoryId) => {
    // Ensure categoryId is a number
    const numericCategoryId = Number(categoryId);
    console.log('📱 Changing main tab to:', numericCategoryId, 'Type:', typeof numericCategoryId, 'from current:', state.selectedMainTab);
    
    // Update both state and ref
    setState(prev => ({
      ...prev,
      selectedMainTab: numericCategoryId,
      selectedSubTab: null,
      subCategories: [],
      items: [],
      loading: { ...prev.loading, subCategories: true, items: true }
    }));

    currentCategoryRef.current = numericCategoryId;

    // Use setTimeout to ensure scroll happens after re-render
    setTimeout(() => {
      scrollToTab(numericCategoryId, mainScrollViewRef);
    }, 100);

    // Load subcategories for the new category
    const subs = await fetchData(`api/categories/${numericCategoryId}/subcategories/`, 'subCategories', 'subCategories');

    if (subs.length > 0) {
      // Always select the first subcategory when switching categories
      const firstSub = subs[0];
      console.log('🔄 Selecting first subcategory:', firstSub.name, 'ID:', firstSub.id);
      
      setState(prev => ({
        ...prev,
        selectedSubTab: firstSub.id
      }));

      // Load items for the first subcategory
      await fetchData(`api/subcategories/${firstSub.id}/products/`, 'items', 'items');
      
      // Scroll to the first subcategory after a brief delay
      setTimeout(() => {
        scrollToTab(firstSub.id, subScrollViewRef);
      }, 150);
    } else {
      setState(prev => ({
        ...prev,
        items: [],
        selectedSubTab: null,
        loading: { ...prev.loading, items: false }
      }));
    }
  }, [fetchData, scrollToTab, state.selectedMainTab]);

  const handleSubTabChange = useCallback(async (subCategoryId) => {
    console.log('📱 Changing sub tab to:', subCategoryId);
    
    if (state.selectedSubTab === subCategoryId) return;

    setState(prev => ({
      ...prev,
      selectedSubTab: subCategoryId,
      loading: { ...prev.loading, items: true }
    }));

    await fetchData(`api/subcategories/${subCategoryId}/products/`, 'items', 'items');
    
    setTimeout(() => {
      scrollToTab(subCategoryId, subScrollViewRef);
    }, 100);
  }, [fetchData, scrollToTab, state.selectedSubTab]);

  const handleAddToCart = (item) => {
    setState(prev => ({
      ...prev,
      selectedItem: item,
      quantity: 1,
      isModalVisible: true
    }));
  };

  const handleQuantityChange = (amount) => {
    const { quantity, selectedItem } = state;
    const maxQty = selectedItem?.stock || 0;
    const newQty = Math.max(1, Math.min(quantity + amount, maxQty));

    setState(prev => ({
      ...prev,
      quantity: newQty
    }));
  };

  const handleModalAddToCart = async () => {
    if (!state.selectedItem) {
      Alert.alert('Error', 'No item selected');
      return;
    }

    try {
      if (state.selectedItem.stock === 0) {
        Alert.alert('Unavailable', 'This product is out of stock.');
        return;
      }

      if (state.quantity > state.selectedItem.stock) {
        Alert.alert('Out of Stock', `Only ${state.selectedItem.stock} available`);
        return;
      }

      await addToCart(state.selectedItem, state.quantity);

      Alert.alert(
        'Added to Cart',
        `${state.selectedItem.name} (${state.quantity}) added to your cart`,
        [
          { text: 'View Cart', onPress: () => router.push('/cart') },
          { text: 'Continue Shopping', style: 'cancel' }
        ]
      );

      setState(prev => ({
        ...prev,
        isModalVisible: false,
        quantity: 1
      }));
    } catch (error) {
      Alert.alert('Error', 'Failed to add item to cart');
      console.error('Add to cart error:', error);
    }
  };

  const renderTab = (item, isMainTab = true) => (
    <TouchableOpacity
      key={item.id}
      ref={el => tabRefs.current[item.id] = el}
      style={[
        isMainTab ? styles.mainTab : styles.subTab,
        (isMainTab ? state.selectedMainTab : state.selectedSubTab) == item.id &&
        (isMainTab ? styles.activeMainTab : styles.activeSubTab)
      ]}
      onPress={() => isMainTab ? handleMainTabChange(item.id) : handleSubTabChange(item.id)}
    >
      <Text style={[
        isMainTab ? styles.mainTabText : styles.subTabText,
        (isMainTab ? state.selectedMainTab : state.selectedSubTab) == item.id &&
        (isMainTab ? styles.activeMainTabText : styles.activeSubTabText)
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }) => {
    const isFavorited = isItemFavorited(item.id);
    const isFavoriteLoading = state.favoriteLoading[item.id];

    return (
      <View style={styles.item}>
        <TouchableOpacity style={styles.imageContainer} onPress={() => {
          router.push({
            pathname: '/product-detail', 
            params: {
              productId: item.id?.toString() || '1',
              productName: item.name || 'Product',
              productPrice: item.price || '0',
              productImage: item.product_image || '',
              productDescription: item.description || 'No description available',
              discountPrice: item.discount_price || '',
              productSku: item.product_sku || '',
              available_stock: item.available_stock?.toString() || '0'
            }
          });
        }}>
          <Image source={{ uri: item.product_image }} style={styles.itemImage} />
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(item)}
            disabled={isFavoriteLoading}
          >
            {isFavoriteLoading ? (
              <ActivityIndicator size="small" color="#FF5252" />
            ) : (
              <MaterialIcons
                name={isFavorited ? "favorite" : "favorite-border"}
                size={20}
                color={isFavorited ? "#FF5252" : "rgba(0,0,0,0.3)"}
              />
            )}
          </TouchableOpacity>
        </TouchableOpacity>

        <Text style={styles.itemPrice}>GH₵{(item.price || 0).toFixed(2)}</Text>
        <Text style={styles.itemName} numberOfLines={2} ellipsizeMode='tail'>{item.name}</Text>
        <Text style={styles.itemDescription} numberOfLines={2} ellipsizeMode='tail'>{item.description}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleAddToCart(item)}
          disabled={item.stock === 0}
        >
          <Text style={styles.addButtonText}>
            {item.stock === 0 ? 'Out of Stock' : 'ADD'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight
      }}
      {...panResponderRef.current?.panHandlers}
    >
      {/* Debug info - remove in production */}
      {/* {__DEV__ && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            Current: {state.selectedMainTab}({typeof state.selectedMainTab}) | 
            Ref: {currentCategoryRef.current}({typeof currentCategoryRef.current})
          </Text>
        </View>
      )} */}

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          ref={mainScrollViewRef}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mainTabBarContainer}
        >
          {state.categories.map(category => renderTab(category))}
        </ScrollView>

        <ScrollView
          horizontal
          ref={subScrollViewRef}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subTabBarContainer}
        >
          {state.subCategories.map(subCategory => renderTab(subCategory, false))}
        </ScrollView>
      </View>

      {/* Products */}
      {state.loading.items ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#333" />
        </View>
      ) : (
        <FlatList
          data={state.items}
          renderItem={renderProductItem}
          keyExtractor={item => item.id.toString()}
          numColumns={numColumns}
          contentContainerStyle={[
            styles.itemsContainer,
            { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 20 : 20 }
          ]}
        />
      )}

      {/* Product Modal */}
      <Modal
        visible={state.isModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setState(prev => ({ ...prev, isModalVisible: false }))}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setState(prev => ({ ...prev, isModalVisible: false }))}
        >
          <View style={[
            styles.modalContent,
            { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 20 : 20 }
          ]}>
            <View style={styles.modalImageContainer}>
              <Image source={{ uri: state.selectedItem?.product_image }} style={styles.modalImage} />
              <TouchableOpacity
                style={styles.modalFavoriteButton}
                onPress={() => state.selectedItem && toggleFavorite(state.selectedItem)}
                disabled={state.favoriteLoading[state.selectedItem?.id]}
              >
                {state.favoriteLoading[state.selectedItem?.id] ? (
                  <ActivityIndicator size="small" color="#FF5252" />
                ) : (
                  <MaterialIcons
                    name={state.selectedItem && isItemFavorited(state.selectedItem.id) ? "favorite" : "favorite-border"}
                    size={24}
                    color={state.selectedItem && isItemFavorited(state.selectedItem.id) ? "#FF5252" : "#666"}
                  />
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.modalItemName}>{state.selectedItem?.name}</Text>
            <Text style={styles.modalItemPrice}>GH₵{state.selectedItem?.price}</Text>

            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={[styles.quantityButton, { opacity: state.quantity <= 1 ? 0.4 : 1 }]}
                onPress={() => handleQuantityChange(-1)}
                disabled={state.quantity <= 1}
              >
                <AntDesign name="minus" size={20} color="#fff" />
              </TouchableOpacity>

              <TextInput
                style={styles.quantityInput}
                value={state.quantity.toString()}
                editable={false}
              />

              <TouchableOpacity
                style={[styles.quantityButton, { opacity: state.quantity >= (state.selectedItem?.stock || 0) ? 0.4 : 1 }]}
                onPress={() => handleQuantityChange(1)}
                disabled={state.quantity >= (state.selectedItem?.stock || 0)}
              >
                <AntDesign name="plus" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.modalAddButton} onPress={handleModalAddToCart}>
              <Text style={styles.modalAddButtonText}>ADD TO CART</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  debugInfo: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 5,
    position: 'absolute',
    top: 40,
    left: 10,
    zIndex: 1000,
    borderRadius: 5,
  },
  debugText: {
    color: 'white',
    fontSize: 10,
  },
  tabContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  mainTabBarContainer: {
    paddingLeft: 12,
    paddingVertical: 12,
  },
  mainTab: {
    marginRight: 24,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  activeMainTab: {
    backgroundColor: '#000',
  },
  mainTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  activeMainTabText: {
    color: '#f1b811',
    fontWeight: 'bold',
    fontFamily: 'inter-bold'
  },
  subTabBarContainer: {
    paddingLeft: 12,
    paddingVertical: 8,
    paddingBottom: 12,
  },
  subTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  activeSubTab: {
    backgroundColor: '#000',
  },
  subTabText: {
    fontSize: 13,
    color: '#666',
  },
  activeSubTabText: {
    color: '#fff',
    fontFamily: 'inter',
  },
  itemsContainer: {
    paddingHorizontal: 8,
    paddingTop: 10,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  item: {
    width: '32%',
    alignItems: 'flex-start',
    marginBottom: 15,
    marginRight: '1%',
    padding: 8,
    position: 'relative',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
  },
  itemImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    borderRadius: 10,
    marginBottom: 5,
  },
  favoriteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  itemName: {
    fontSize: 12,
    textAlign: 'start',
    fontWeight: '600',
    height: 16,
    lineHeight: 15,
    fontFamily: 'inter',
    overflow: 'hidden',
    width: '100%',
  },
  itemDescription: {
    fontSize: 12,
    textAlign: 'start',
    fontFamily: 'inter',
    height: 16,
    lineHeight: 16,
    overflow: 'hidden',
    width: '100%',
    marginTop: 4,
  },
  itemPrice: {
    marginTop: 5,
    fontSize: 12,
    color: '#000000ff',
    fontFamily: 'inter',
    textAlign: 'start',
    lineHeight: 16,
  },
  addButton: {
    marginTop: 8,
    padding: 5,
    borderWidth: 1,
    borderColor: '#efb506ff',
    backgroundColor: '#ffffffff',
    borderRadius: 50,
    width: '100%',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 12,
    color: '#000000ff',
    fontWeight: 'bold',
    fontFamily: 'inter'
  },
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
  },
  modalImageContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  modalImage: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
    marginBottom: 20,
    marginTop: 10,
  },
  modalFavoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  modalItemName: {
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  modalItemPrice: {
    fontWeight: 'bold',
    fontSize: 20,
    marginTop: 5,
    textAlign: 'center'
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  quantityButton: {
    padding: 5,
    backgroundColor: '#eba500ff',
    borderRadius: 20,
  },
  quantityInput: {
    width: 50,
    textAlign: 'center',
    fontSize: 16,
    marginHorizontal: 10,
  },
  modalAddButton: {
    padding: 15,
    backgroundColor: '#eba500ff',
    borderRadius: 50,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalAddButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});