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
const SWIPE_THRESHOLD = 50; // Minimum swipe distance

export default function CategoryScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const insets = useSafeAreaInsets();

  const [state, setState] = useState({
    categories: [],
    subCategories: [],
    items: [],
    selectedMainTab: id,
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

  // Create pan responder for swipe gestures
  useEffect(() => {
    panResponderRef.current = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dx } = gestureState;
        
        // Swipe right (positive dx) - go to previous
        if (dx > SWIPE_THRESHOLD) {
          handleSwipe('right');
        }
        // Swipe left (negative dx) - go to next
        else if (dx < -SWIPE_THRESHOLD) {
          handleSwipe('left');
        }
      },
    });
  }, [state.selectedMainTab, state.selectedSubTab, state.subCategories, state.categories]);

  const handleSwipe = (direction) => {
    const currentMainIndex = state.categories.findIndex(cat => cat.id === state.selectedMainTab);
    const currentSubIndex = state.subCategories.findIndex(sub => sub.id === state.selectedSubTab);
    
    if (direction === 'left') {
      // Swipe left - go to next subcategory or next category
      if (currentSubIndex < state.subCategories.length - 1) {
        // Next subcategory in current category
        const nextSub = state.subCategories[currentSubIndex + 1];
        handleSubTabChange(nextSub.id);
      } else if (currentMainIndex < state.categories.length - 1) {
        // Move to next category (first subcategory)
        const nextMain = state.categories[currentMainIndex + 1];
        handleMainTabChange(nextMain.id);
      }
    } else {
      // Swipe right - go to previous subcategory or previous category
      if (currentSubIndex > 0) {
        // Previous subcategory in current category
        const prevSub = state.subCategories[currentSubIndex - 1];
        handleSubTabChange(prevSub.id);
      } else if (currentMainIndex > 0) {
        // Move to previous category (last subcategory)
        const prevMain = state.categories[currentMainIndex - 1];
        handleMainTabChange(prevMain.id);
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
      tabRef.measureLayout(
        scrollViewRef.current,
        (x) => scrollViewRef.current?.scrollTo({ x: x + offset, animated: true }),
        () => { }
      );
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
      const cats = await fetchData('api/categories/', 'categories', 'categories');
      await fetchFavorites();
      
      if (state.selectedMainTab) {
        await handleMainTabChange(state.selectedMainTab);
      } else if (cats.length > 0) {
        handleMainTabChange(cats[0].id);
      }
    };
    initialize();
  }, []));

  const handleMainTabChange = useCallback(async (categoryId) => {
    setState(prev => ({
      ...prev,
      selectedMainTab: categoryId,
      loading: { ...prev.loading, subCategories: true, items: true }
    }));

    const subs = await fetchData(`api/categories/${categoryId}/subcategories/`, 'subCategories', 'subCategories');

    if (subs.length > 0) {
      handleSubTabChange(subs[0].id);
    } else {
      // If no subcategories, clear items
      setState(prev => ({
        ...prev,
        items: [],
        loading: { ...prev.loading, items: false }
      }));
    }

    scrollToTab(categoryId, mainScrollViewRef);
  }, [fetchData, scrollToTab]);

  const handleSubTabChange = useCallback(async (subCategoryId) => {
    setState(prev => ({
      ...prev,
      selectedSubTab: subCategoryId,
      loading: { ...prev.loading, items: true }
    }));

    await fetchData(`api/subcategories/${subCategoryId}/products/`, 'items', 'items');

    scrollToTab(subCategoryId, subScrollViewRef);
  }, [fetchData, scrollToTab]);

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
        <TouchableOpacity style={styles.imageContainer} onPress={() => router.push('/product-detail')}>
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
      {...panResponderRef.current?.panHandlers} // Add swipe gesture handlers
    >
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

      {/* Swipe Instructions */}
      {/* <View style={styles.swipeInstruction}>
        <Text style={styles.swipeInstructionText}>
          Swipe left/right to navigate categories
        </Text>
      </View> */}

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
    textAlign:'start',
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
  swipeInstruction: {
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  swipeInstructionText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});