import { View, TextInput, Text, StyleSheet } from 'react-native';
import React from 'react';
import EvilIcons from '@expo/vector-icons/EvilIcons';

export default function Header() {
  return (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>SEARCH BRANDS AND PRODUCTS</Text>
      <View style={styles.searchContainer}>
        <EvilIcons name="search" size={24} color="#777" style={styles.searchIcon} />
        <TextInput
          placeholder="Search...."
          placeholderTextColor="#999"
          style={styles.searchInput}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#f1b811',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowColor: '#000',
    shadowRadius: 5,
    elevation: 5, // Shadow effect for Android
  },
  headerTitle: {
    fontFamily: 'poppins-bold',
    fontSize: 15,
    color: 'black',
    marginBottom: 10,
  },
  searchContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 15,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingLeft: 40, 
    paddingRight: 15,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
  },
});
