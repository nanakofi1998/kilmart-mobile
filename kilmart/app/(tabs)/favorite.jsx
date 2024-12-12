import { View, Text, ScrollView } from 'react-native'
import React from 'react'
import Header from '../../components/Favorite/Header'
import MainScreen from '../../components/Favorite/MainScreen'

export default function Favorite() {
  return (
    <View style={{flex:1}}>
      {/**Header */}
      <Header/>
      <ScrollView style={{flexGrow:1, paddingBottom:10}}>
        {/**Main Screen */}
        <MainScreen/>
      </ScrollView>
    </View>
  )
}