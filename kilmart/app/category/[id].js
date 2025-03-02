import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router'; // Import useRouter
import { AntDesign } from '@expo/vector-icons'; // For plus/minus icons

// Dummy data for category items
const categoryItems = {
  '1': [
    { id: '1', name: 'Basmati Rice', image: require('../../assets/images/basmati.png'), price: 'GH₵ 500.00' },
    { id: '2', name: 'Doughnut', image: require('../../assets/images/doughnut.png'), price: 'GH₵ 120.00' },
    { id: '3', name: 'Chips Ahoy', image: require('../../assets/images/ahoy.png'), price: 'GH₵ 68.00' },
  ],
  '2': [
    { id: '4', name: 'Green Tea', image: require('../../assets/images/green-tea.png'), price: 'GH₵ 20.00' },
    { id: '5', name: 'Frozen Wings', image: require('../../assets/images/wings.png'), price: 'GH₵ 230.00' },
  ],
  // Add more items for other categories...
};

const categories = [
  { id: '1', name: 'Promotions' },
  { id: '2', name: 'New Arrivals' },
  { id: '3', name: 'Shop Lebanese' },
  { id: '4', name: 'Meat & Fish' },
  { id: '5', name: 'Fruits & Veggies' },
  { id: '6', name: 'Bakery' },
  { id: '7', name: 'Ready to Eat' },
  { id: '8', name: 'Dairy & Egg' },
  { id: '9', name: 'Cereal & Packs' },
  { id: '10', name: 'Cans & Jars' },
  { id: '11', name: 'Pantry' },
  { id: '12', name: 'Frozen' },
  { id: '13', name: 'Beverages' },
  { id: '14', name: 'Snacks' },
  { id: '15', name: 'Alcohol' },
];

export default function CategoryScreen() {
  const { id, categoryName } = useLocalSearchParams();
  const [selectedTab, setSelectedTab] = useState(id);
  const [selectedItem, setSelectedItem] = useState(null); // Track selected item for modal
  const [quantity, setQuantity] = useState(1); // Quantity state
  const [isModalVisible, setIsModalVisible] = useState(false); // Modal visibility
  const [cart, setCart] = useState([]); // Cart state
  const router = useRouter(); // Initialize router

  const numColumns = 3;

  // Handle "Add to Cart" button press
  const handleAddToCart = (item) => {
    setSelectedItem(item); // Set the selected item
    setIsModalVisible(true); // Show the modal
  };

  // Handle quantity increase
  const handleIncreaseQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  // Handle quantity decrease
  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  // Handle "Add to Cart" inside the modal
  const handleModalAddToCart = () => {
    // Add the item to the cart
    const itemToAdd = {
      ...selectedItem,
      quantity,
    };
    setCart((prevCart) => [...prevCart, itemToAdd]);

    // Close the modal and reset quantity
    setIsModalVisible(false);
    setQuantity(1);

    // Navigate to the cart page
    router.push('/cart');
  };

  // Close the modal when tapping outside
  const closeModal = () => {
    setIsModalVisible(false);
  };

  return (
    <View>
      {/* Header */}
      <View style={styles.container}>
        <Text style={styles.heroText}>Category: {categoryName}</Text>
      </View>

      {/* Scrollable Tab Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBarContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.tab,
              selectedTab === category.id && styles.activeTab,
            ]}
            onPress={() => setSelectedTab(category.id)}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === category.id && styles.activeTabText,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Display Category Items */}
      <FlatList
        key={`flatlist-${numColumns}`}
        data={categoryItems[selectedTab]}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        contentContainerStyle={styles.itemsContainer}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Image source={item.image} style={styles.itemImage} />
            <Text style={styles.itemText}>{item.name}</Text>
            <Text style={{ fontFamily: 'inter-bold', marginTop: 10, fontSize: 16 }}>{item.price}</Text>
            <TouchableOpacity
              style={styles.addToCartButton}
              onPress={() => handleAddToCart(item)}
            >
              <Text style={styles.addToCartButtonText}>Add to Cart</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Drop-Up Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        {/* Overlay to close the modal when tapped */}
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1} // Prevents the overlay from flashing
          onPress={closeModal} // Close the modal when tapped
        >
          {/* Modal Content */}
          <View style={styles.modalContent}>
            {/* Selected Item Image */}
            <View style={{ alignItems: 'center', flexDirection: 'column', marginBottom: 20, gap: 5 }}>
              <Image source={selectedItem?.image} style={styles.modalImage} />
              <Text style={{ fontFamily: 'inter-bold', fontSize: 16 }}>{selectedItem?.name}</Text>
              <Text style={{ fontFamily: 'inter-bold', fontSize: 20 }}>{selectedItem?.price}</Text>
            </View>

            {/* Quantity Field */}
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={handleDecreaseQuantity}
              >
                <AntDesign name="minus" size={20} color="#ffff" />
              </TouchableOpacity>
              <TextInput
                style={styles.quantityInput}
                value={quantity.toString()}
                keyboardType="numeric"
                editable={false}
              />
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={handleIncreaseQuantity}
              >
                <AntDesign name="plus" size={20} color="#ffff" />
              </TouchableOpacity>
            </View>

            {/* Add to Cart Button */}
            <TouchableOpacity
              style={styles.modalAddToCartButton}
              onPress={handleModalAddToCart}
            >
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowColor: '#000',
    shadowRadius: 5,
    elevation: 5,
    marginBottom: 20,
  },
  heroText: {
    fontSize: 20,
    fontFamily: 'inter-bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  tabBarContainer: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    alignItems: 'center',
  },
  tab: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#f1b811',
  },
  tabText: {
    fontSize: 16,
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
    marginTop: 15,
    padding: 8,
    backgroundColor: 'black',
    borderRadius: 20,
  },
  addToCartButtonText: {
    fontSize: 14,
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