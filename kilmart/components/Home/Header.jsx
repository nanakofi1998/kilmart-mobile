import { View, Text } from 'react-native'
import React from 'react'
import Dropdown from '../Dropdown'

export default function Header() {
  return (
    <View style={{padding:20, paddingTop:60, backgroundColor:'#f1b811',borderBottomLeftRadius:10,borderBottomRightRadius:10, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowColor: '#000', shadowRadius: 5, elevation: 5,}}>
      <View style={{display:'flex',flexDirection:'column', alignItems:'flex-start', gap:10,alignContent:'center'}}>
        <Text style={{fontFamily:'inter-bold', fontSize:15, color:'black'}}>DELIVERY ADDRESS</Text>
        <Dropdown
          data={[
            { value: 'accra', label: 'Greater Accra' },
            { value: 'ashanti', label: 'Ashanti' },
            { value: 'central', label: 'Central' },
          ]}
          onChange={console.log}
          placeholder="Fetching Location..."
        />
      </View>
    </View>
  )
}