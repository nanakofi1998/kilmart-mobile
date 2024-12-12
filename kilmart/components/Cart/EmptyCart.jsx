import { View, Text, StyleSheet } from 'react-native';
import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function EmptyCart() {
  return (
    <View style={styles.container}>
      <View style={{shadowColor: '#141414', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.8,shadowRadius: 5, elevation: 8,}}>
      <FontAwesome name="shopping-basket" size={100} color="#ccc" />
      </View>
      <Text style={styles.text}>Your Cart Is Empty!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap:10
  },
  text: {
    fontFamily: 'poppins',
    fontSize: 18,
    color: 'grey',
    marginTop: 10,
  },
});
