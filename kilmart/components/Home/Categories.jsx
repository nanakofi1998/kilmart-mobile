import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import apiClient from '../../utils/apiClient';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const itemWidth = (width - 40) / 3; // 3 items per row

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    apiClient.get('/categories')
      .then((response) => {
        setCategories(response.data);
      })
      .catch((error) => {
        console.error('Error fetching categories:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#000" style={{ alignItems: 'center', padding: 50, marginTop: 100 }} />;
  }

  return (
    <View style={styles.container}>
      {categories.length > 0 ? (
        categories.map((category) => (
          <TouchableOpacity key={category.id} style={styles.item}>
            <Image source={{ uri: category.image }} style={styles.image} />
            <Text style={styles.text}>{category.name}</Text>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={{fontFamily:'poppins-bold', fontSize:24,padding:40, marginTop:100}}>No categories found 💔</Text>
      )}
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowColor: '#000',
    shadowRadius: 5,
    elevation: 5,
  },
  item: {
    width: itemWidth,
    alignItems: 'center',
    marginBottom: 20,
  },
  image: {
    width: itemWidth - 20,
    height: itemWidth - 20,
    resizeMode: 'contain', // ✅ Correct way instead of objectFit
    marginBottom: 10,
  },
  text: {
    fontSize: 13,
    fontFamily: 'poppins',
    textAlign: 'center',
    color: '#333',
  },
});
