import { View, Text,TouchableOpacity, Image, StyleSheet, FlatList } from 'react-native';
import React from 'react';
import promotion from '../../assets/images/promo.png';
import arrival from '../../assets/images/new.png';
import lebanese from '../../assets/images/lebanon.png'
import meat from '../../assets/images/meat.png'
import fruit from '../../assets/images/fruit.png'
import bakery from '../../assets/images/bake.png'
import eat from '../../assets/images/ready.png'
import milk from '../../assets/images/dairy.png'
import cereal from '../../assets/images/cheerios.png'
import can from '../../assets/images/jars.png'
import pantry from '../../assets/images/ketchup.png'
import snack from '../../assets/images/snacks.png'
import frozen from '../../assets/images/froze.png'
import beverages from '../../assets/images/bev.png'
import alcohol from '../../assets/images/drinks.png'

const categories = [
  { id: '1', name: 'Promotions', image: promotion },
  { id: '2', name: 'New Arrivals', image:arrival },
  { id: '3', name: 'Shop Lebanese', image: lebanese },
  { id: '4', name: 'Meat & Fish', image: meat },
  { id: '5', name: 'Fruits & Veggies', image: fruit },
  { id: '6', name: 'Bakery', image: bakery },
  { id: '7', name: 'Ready to Eat', image: eat },
  { id: '8', name: 'Dairy & Egg', image: milk },
  { id: '9', name: 'Cereal & Packs', image: cereal },
  { id: '10', name: 'Cans & Jars', image: can },
  { id: '11', name: 'Pantry', image: pantry },
  { id: '12', name: 'Snacks', image: snack },
  { id: '13', name: 'Frozen', image: frozen },
  { id: '14', name: 'Beverages', image: beverages },
  { id: '15', name: 'Alcohol', image: alcohol },
];
export default function Categories() {
  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card}>
      <Image source={item.image} style={styles.image} />
      <Text style={styles.text}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={categories}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={3}
      contentContainerStyle={styles.list}
      columnWrapperStyle={styles.row}
      showsVerticalScrollIndicator={true}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 5,
    paddingBottom: 20,
    flexGrow: 1, // Ensures content expands for scrolling
  },
  row: {
    justifyContent: 'space-between',
  },
  card: {
    flex: 1,
    margin: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  image: {
    width: 110,
    height: 80,
    resizeMode:  'contain'
  },
  text: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'poppins-bold',
    textAlign: 'center',
  },
});