import { View, Text, ScrollView } from 'react-native'
import React from 'react'
import Header from '../../components/Search/Header'
import SearchScreen from '../../components/Search/SearchScreen'
import SearchResultScreen from '../../components/Search/SearchResultScreen'

export default function Search() {
  return (
    <View style={{flex:1}}>
      {/**Header */}
      <Header/>
      <ScrollView style={{flexGrow:1,paddingBottom:10}}>
        {/**Blank Search Screen */}
        <SearchScreen/>

        {/** Search Result Screen */}
        {/*<SearchResultScreen/>*/}

      </ScrollView>
    </View>
  )
}