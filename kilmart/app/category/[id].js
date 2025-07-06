import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, FlatList, ScrollView, Modal, TextInput, ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import apiClient from '../../utils/apiClient';

export default function CategoryScreen() {
  const { id, categoryName } = useLocalSearchParams();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedTab, setSelectedTab] = useState(id);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [cart, setCart] = useState([]);
  const router = useRouter();

  const numColumns = 3;

  const scrollViewRef = useRef(null);
  const tabRefs = useRef({});

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('categories/');
      setCategories(response.data);
      setLoadingCategories(false);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setLoadingCategories(false);
    }
  };

  const fetchItems = async (categoryId) => {
    setLoadingItems(true);
    try {
      const response = await apiClient.get(`categories/${categoryId}/`);
      setItems(response.data);
    } catch (error) {
      console.error(`Failed to fetch items for category ${categoryId}:`, error);
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedTab) {
      fetchItems(selectedTab);
      scrollToActiveTab(selectedTab);
    }
  }, [selectedTab, categories]);

  const handleAddToCart = (item) => {
    setSelectedItem(item);
    setIsModalVisible(true);
  };

  const handleIncreaseQuantity = () => setQuantity((prev) => prev + 1);
  const handleDecreaseQuantity = () => quantity > 1 && setQuantity((prev) => prev - 1);

  const handleModalAddToCart = () => {
    const itemToAdd = { ...selectedItem, quantity };
    setCart((prevCart) => [...prevCart, itemToAdd]);
    setIsModalVisible(false);
    setQuantity(1);
    router.push('/cart');
  };

  const scrollToActiveTab = (categoryId) => {
    const ref = tabRefs.current[categoryId];
    if (ref && scrollViewRef.current) {
      ref.measureLayout(scrollViewRef.current, (x) => {
        scrollViewRef.current.scrollTo({ x: x - 10, animated: true });
      });
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.heroText}>Category: {categoryName}</Text>
      </View>

      {loadingCategories ? (
        <ActivityIndicator size="large" color="#333" style={{ marginTop: 30 }} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarContainer}
          ref={scrollViewRef}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.tab, selectedTab == category.id && styles.activeTab]}
              onPress={() => setSelectedTab(category.id)}
              ref={(el) => (tabRefs.current[category.id] = el)}
            >
              <Text style={[styles.tabText, selectedTab == category.id && styles.activeTabText]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {loadingItems ? (
        <ActivityIndicator size="large" color="#333" style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          numColumns={numColumns}
          contentContainerStyle={styles.itemsContainer}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Image source={{ uri: item.image }} style={styles.itemImage} />
              <Text style={styles.itemText}>{item.name}</Text>
              <Text style={{ fontFamily: 'inter-bold', marginTop: 5, fontSize: 14 }}>{item.price}</Text>
              <TouchableOpacity style={styles.addToCartButton} onPress={() => handleAddToCart(item)}>
                <Text style={styles.addToCartButtonText}>Add to Cart</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsModalVisible(false)}>
          <View style={styles.modalContent}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <Image source={{ uri: selectedItem?.image }} style={styles.modalImage} />
              <Text style={{ fontFamily: 'inter-bold', fontSize: 16 }}>{selectedItem?.name}</Text>
              <Text style={{ fontFamily: 'inter-bold', fontSize: 20 }}>{selectedItem?.price}</Text>
            </View>

            <View style={styles.quantityContainer}>
              <TouchableOpacity style={styles.quantityButton} onPress={handleDecreaseQuantity}>
                <AntDesign name="minus" size={20} color="#fff" />
              </TouchableOpacity>
              <TextInput style={styles.quantityInput} value={quantity.toString()} editable={false} />
              <TouchableOpacity style={styles.quantityButton} onPress={handleIncreaseQuantity}>
                <AntDesign name="plus" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.modalAddToCartButton} onPress={handleModalAddToCart}>
              <Text style={styles.modalAddToCartButtonText}>Add to Cart</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    padding: 20,
    backgroundColor: '#f1b811',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    marginBottom: 5,
  },
  heroText: {
    fontSize: 20,
    fontFamily: 'inter-bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  tabBarContainer: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tab: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeTab: {
    backgroundColor: '#f1b811',
  },
  tabText: {
    fontSize: 15,
    color: '#0d0d0e',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  itemsContainer: {
    paddingHorizontal: 10,
  },
  item: {
    width: '32%',
    alignItems: 'center',
    marginBottom: 20,
  },
  itemImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  itemText: {
    fontSize: 14,
    marginTop: 5,
  },
  addToCartButton: {
    marginTop: 10,
    padding: 8,
    backgroundColor: 'black',
    borderRadius: 20,
  },
  addToCartButtonText: {
    fontSize: 13,
    color: '#fff',
    fontFamily: 'inter-bold',
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
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  quantityButton: {
    padding: 3,
    backgroundColor: 'black',
    borderRadius: 20,
  },
  quantityInput: {
    width: 50,
    textAlign: 'center',
    fontSize: 16,
    marginHorizontal: 10,
  },
  modalAddToCartButton: {
    padding: 15,
    backgroundColor: 'black',
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalAddToCartButtonText: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'inter-bold',
  },
});
