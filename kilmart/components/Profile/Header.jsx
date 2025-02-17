import { View, Text } from 'react-native'
import React from 'react'

export default function Header() {
  return (
    <View style={{padding:20, paddingTop:50, backgroundColor:'#f1b811', alignItems:'center', justifyContent:'center',borderBottomLeftRadius:10,borderBottomRightRadius:10, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowColor: '#000', shadowRadius: 5, elevation: 5,}}>
      <Text style={{fontFamily:'poppins-bold', fontSize:18, color:'black', marginTop:10}}>My Profile</Text>
    </View>
  )
}