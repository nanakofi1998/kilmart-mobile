import { View, Text, StyleSheet } from 'react-native';
import React from 'react';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

export default function SearchScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
      <FontAwesome5 name="search" size={100} color="#ccc" style={styles.icon} />
      </View>
      <Text style={styles.text}>Search For Products & Brands</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hero: {
     // Shadow for iOS
     shadowColor: '#141414',
     shadowOffset: { width: 0, height: 5 },
     shadowOpacity: 0.8,
     shadowRadius: 5,
     // Shadow for Android
     elevation: 8,
  },
  icon: {
    marginBottom: 20,
  },
  text: {
    fontFamily: 'poppins',
    fontSize: 18,
    color: 'grey',
  },
});
