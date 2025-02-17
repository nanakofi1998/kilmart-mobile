import { View, Text, ScrollView } from 'react-native'
import React from 'react'
import Header from '../../components/Profile/Header'
import Menu from '../../components/Profile/Menu'

export default function Profile() {
  return (
    <View style={{flex:1}}>
      {/**Header */}
      <Header/>
      <ScrollView style={{flexGrow:1, paddingBottom:10}}>
        {/**Menu */}
        <Menu/>
      </ScrollView>
    </View>
  )
}