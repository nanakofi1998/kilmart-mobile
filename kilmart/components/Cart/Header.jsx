import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import Octicons from '@expo/vector-icons/Octicons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

export default function Header() {
  const navigation = useNavigation();

  const handleClearCart = () => {
    // Logic to clear the cart
    console.log('Cart cleared!');
  };

  return (
    <View
      style={{
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
      }}
    >
      <View
        style={{
          alignContent: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 10,
        }}
      >
        {/* Back Button */}
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back-sharp" size={24} color="black" />
        </TouchableOpacity>

        {/* Title */}
        <Text style={{ fontFamily: 'inter-bold', fontSize: 18, color: 'black' }}>
          Cart
        </Text>

        {/* Clear Cart Button */}
        <TouchableOpacity onPress={handleClearCart}>
          <Octicons name="trash" size={24} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
