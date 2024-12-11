import { View, Text, ScrollView } from 'react-native'
import React from 'react'
import Header from '../../components/Home/Header'
import Slider from '../../components/Home/Slider'
import Categories from '../../components/Home/Categories'

export default function Home() {
  return (
    <View style={{flex:1}}>
      {/**Header */}
      <Header/>
      {/**Slider */}
      <ScrollView style={{flexGrow:1,paddingBottom:10}}>
      <Slider/>
      {/**Categories */}
      <Categories/>
      </ScrollView>
    </View>
  )
}