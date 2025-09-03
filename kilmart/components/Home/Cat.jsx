import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import apiClient from '../../utils/apiClient';


const { width } = Dimensions.get('window');
const itemWidth = (width - 40) / 3;

export default function Cat() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('api/categories/');
      setCategories(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError('Could not load categories.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={{
            pathname: `/category/${category.id}`,
            params: { categoryName: category.name },
          }}
          asChild
        >
          <TouchableOpacity style={styles.item}>
            <Image source={{ uri: category.category_image }} style={styles.image} />
            <Text style={styles.text}>{category.name}</Text>
          </TouchableOpacity>
        </Link>
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
    width: itemWidth - 20,
    height: itemWidth - 20,
    resizeMode: 'contain',
    marginBottom: 10,
    backgroundColor: '#f2f2f2',
  },
  text: {
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'poppins',
    textAlign: 'center',
    color: '#333',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  errorText: {
    color: 'tomato',
    fontSize: 18,
    fontFamily: 'poppins',
    fontWeight: 'bold',
  },
});
