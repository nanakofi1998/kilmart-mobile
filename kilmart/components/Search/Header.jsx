import { View, TextInput } from 'react-native'
import React from 'react'
import EvilIcons from '@expo/vector-icons/EvilIcons';

export default function Header() {
  return (
    <View style={{padding:20, paddingTop:50, backgroundColor:'#f1b811',borderBottomLeftRadius:10,borderBottomRightRadius:10}}>
      <View>
        <EvilIcons name="search" size={24} color="black"/>
        <TextInput placeholder='Search for products and brands' style={{backgroundColor:'#ffff'}}/>
      </View>
    </View>
  )
}