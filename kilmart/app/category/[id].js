// app/category/[id].js
import React from 'react';
import { View, Text, StyleSheet, FlatList, Image } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useLocalSearchParams } from 'expo-router';

// Mock data for items in each category
const categoryItems = {
  '1': [
    { id: '1', name: 'Item 1', image: require('../../assets/images/promo.png') },
    { id: '2', name: 'Item 2', image: require('../../assets/images/new.png') },
  ],
  '2': [
    { id: '3', name: 'Item 3', image: require('../../assets/images/lebanon.png') },
    { id: '4', name: 'Item 4', image: require('../../assets/images/meat.png') },
  ],
  // Add more items for other categories...
};

const Tab = createMaterialTopTabNavigator();

function CategoryItems({ categoryId }) {
  const items = categoryItems[categoryId] || [];

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      numColumns={2}
      contentContainerStyle={styles.itemsContainer}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Image source={item.image} style={styles.itemImage} />
          <Text style={styles.itemText}>{item.name}</Text>
        </View>
      )}
    />
  );
}

function PromotionsScreen() {
  const { id } = useLocalSearchParams();
  return <CategoryItems categoryId={id} />;
}

function NewArrivalsScreen() {
  const { id } = useLocalSearchParams();
  return <CategoryItems categoryId={id} />;
}

export default function CategoryScreen() {
  const { id, categoryName } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.heroText}>Welcome to {categoryName}</Text>
      <Tab.Navigator
        screenOptions={{
          tabBarLabelStyle: { fontSize: 14, fontWeight: 'bold' },
          tabBarIndicatorStyle: { backgroundColor: 'blue' },
        }}
      >
        <Tab.Screen name="Promotions" component={PromotionsScreen} />
        <Tab.Screen name="New Arrivals" component={NewArrivalsScreen} />
        {/* Add more tabs for other categories... */}
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  heroText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  itemsContainer: {
    padding: 10,
  },
  item: {
    flex: 1,
    margin: 5,
    alignItems: 'center',
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
});