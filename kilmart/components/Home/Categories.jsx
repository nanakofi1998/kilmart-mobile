import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import React from 'react';
import promotion from '../../assets/images/promo.png';
import arrival from '../../assets/images/new.png';
import lebanese from '../../assets/images/lebanon.png';
import meat from '../../assets/images/meat.png';
import fruit from '../../assets/images/fruit.png';
import bakery from '../../assets/images/bake.png';
import eat from '../../assets/images/ready.png';
import milk from '../../assets/images/dairy.png';
import cereal from '../../assets/images/cheerios.png';
import can from '../../assets/images/jars.png';
import pantry from '../../assets/images/ketchup.png';
import snack from '../../assets/images/ahoy.png';
import frozen from '../../assets/images/froze.png';
import beverages from '../../assets/images/bev.png';
import alcohol from '../../assets/images/drinks.png';

const categories = [
  { id: '1', name: 'Promotions', image: promotion },
  { id: '2', name: 'New Arrivals', image: arrival },
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

const { width } = Dimensions.get('window');
const itemWidth = (width - 40) / 3; // Adjust the margins and spacing to fit 3 items per row

export default function Categories() {
  return (
    <View style={styles.container}>
      {categories.map((category) => (
        <TouchableOpacity key={category.id} style={styles.item}>
          <Image source={category.image} style={styles.image} />
          <Text style={styles.text}>{category.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 30,
  },
  item: {
    width: itemWidth,
    alignItems: 'center',
    marginBottom: 20,
  },
  image: {
    width: itemWidth - 20, // Smaller than the item width for some padding
    height: itemWidth - 20,
    objectFit:'contain',
    marginBottom: 20,
  },
  text: {
    fontSize: 14,
    fontFamily:'poppins',
    textAlign: 'center',
    color: '#333',
  },
});
