// app/product-detail.jsx
import React from 'react';
import { View, Text, Image, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function ProductDetail() {
  const { productId, productName, productPrice, productImage, productDescription } = useLocalSearchParams();
  
  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      <Image source={{ uri: productImage }} style={{ width: '100%', height: 300 }} />
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginTop: 20 }}>{productName}</Text>
      <Text style={{ fontSize: 20, color: '#000', marginVertical: 10 }}>GH₵{productPrice}</Text>
      <Text style={{ fontSize: 16, color: '#666' }}>{productDescription}</Text>
    </ScrollView>
  );
}