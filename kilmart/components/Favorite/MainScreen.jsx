import { View, Text } from 'react-native'
import React from 'react'
import MaterialIcons from '@expo/vector-icons/MaterialIcons';


export default function MainScreen() {
  return (
    <View style={{alignItems:'center', marginTop:50, justifyContent:'center', flexDirection:'column',gap:10}}>
      <View style={{shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.8, shadowColor: '#000', shadowRadius: 5, elevation: 5}}>
      <MaterialIcons name="favorite" size={120} color="#ccc" />
      </View>
      <Text style={{fontFamily:'poppins', fontSize:18, color:'grey'}}>Your Favorites Will Appear Here!</Text>
    </View>
  )
}