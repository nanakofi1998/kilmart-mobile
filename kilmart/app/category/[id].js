import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, FlatList, ScrollView,
  Modal, TextInput, ActivityIndicator, Dimensions, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import apiClient from '../../utils/apiClient';
import { useCart } from '../../context/CartContext'

const { width } = Dimensions.get('window');
const numColumns = 3;

export default function CategoryScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { addToCart } = useCart();

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
    }
  });

  const mainScrollViewRef = useRef(null);
  const subScrollViewRef = useRef(null);
  const tabRefs = useRef({});

  const fetchData = useCallback(async (url, stateKey, loadingKey) => {
    try {
      const response = await apiClient.get(url);
      let data = response.data;

      // 🔥 Sanitize prices if fetching products
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
      console.error(`Failed to fetch ${stateKey}:`, error);
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

  useFocusEffect(useCallback(() => {
    const initialize = async () => {
      const cats = await fetchData('categories/', 'categories', 'categories');
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

    const subs = await fetchData(`categories/${categoryId}/subcategories/`, 'subCategories', 'subCategories');

    if (subs.length > 0) {
      handleSubTabChange(subs[0].id);
    }

    scrollToTab(categoryId, mainScrollViewRef);
  }, [fetchData, scrollToTab]);

  const handleSubTabChange = useCallback(async (subCategoryId) => {
    setState(prev => ({
      ...prev,
      selectedSubTab: subCategoryId,
      loading: { ...prev.loading, items: true }
    }));

    await fetchData(`subcategories/${subCategoryId}/products/`, 'items', 'items');

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

  const renderProductItem = ({ item }) => (
    <View style={styles.item}>
      <Image source={{ uri: item.product_image }} style={styles.itemImage} />
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemDescription}>{item.description}</Text>
      <Text style={styles.itemPrice}>GH₵{(item.price || 0).toFixed(2)}</Text>
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

  return (
    <View style={{ flex: 1 }}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal ref={mainScrollViewRef} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mainTabBarContainer}>
          {state.categories.map(category => renderTab(category))}
        </ScrollView>

        <ScrollView horizontal ref={subScrollViewRef} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subTabBarContainer}>
          {state.subCategories.map(subCategory => renderTab(subCategory, false))}
        </ScrollView>
      </View>

      {/* Products */}
      {state.loading.items ? (
        <ActivityIndicator size="large" color="#333" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={state.items}
          renderItem={renderProductItem}
          keyExtractor={item => item.id.toString()}
          numColumns={numColumns}
          contentContainerStyle={{ paddingBottom: 50 }}
        />
      )}

      {/* Product Modal */}
      <Modal
        visible={state.isModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setState(prev => ({ ...prev, isModalVisible: false }))}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setState(prev => ({ ...prev, isModalVisible: false }))}>
          <View style={styles.modalContent}>
            <Image source={{ uri: state.selectedItem?.product_image }} style={styles.modalImage} />
            <Text style={styles.modalItemName}>{state.selectedItem?.name}</Text>
            <Text style={styles.modalItemStock}>available: {state.selectedItem?.stock}</Text>
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
  subTabScrollView: {
    marginTop: -4, // Bring subcategories closer to main tabs
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
    paddingBottom: 20,
  },
  item: {
    width: '32%',
    alignItems: 'center',
    marginBottom: 15,
    marginRight: '1%',
    padding: 8,
  },
  itemImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    borderRadius: 10,
    marginBottom: 5,
  },
  itemName: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '400',
  },
  itemDescription: {
    fontSize: 10,
    textAlign: 'center',
    fontFamily: 'inter',
  },
  itemPrice: {
    fontWeight: 'bold',
    marginTop: 5,
    fontSize: 14,
  },
  addButton: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#000',
    borderRadius: 50,
    width: '100%',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
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
  modalImage: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
    marginBottom: 20,
    marginTop: 10,
  },
  modalItemName: {
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  modalItemStock: {
    fontWeight: '300',
    fontSize: 14,
    textAlign: 'center',
    color: 'red',
    marginTop: 5,
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
    padding: 10,
    backgroundColor: 'black',
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
    backgroundColor: 'black',
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
  loader: {
    marginTop: 30,
  },
  subLoader: {
    marginVertical: 10,
  },
});