import { View, Text, ScrollView } from 'react-native'
import React from 'react'
import Header from '../../components/Cart/Header'
import EmptyCart from '../../components/Cart/EmptyCart'
import AddedCart from '../../components/Cart/AddedCart'

export default function Cart() {
  return (
    <View style={{flex:1}}>
      {/**Header */}
      <Header/>
      <ScrollView style={{flexGrow:1, paddingBottom:10}}>
      {/**Empty Cart */}
      <EmptyCart/>

      {/**item Added To Cart Screen 
      <AddedCart/>*/}
      </ScrollView>
    </View>
  )
}