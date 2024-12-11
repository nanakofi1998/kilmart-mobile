import { View, Text } from 'react-native'
import React from 'react'
import Dropdown from '../Dropdown'

export default function Header() {
  return (
    <View style={{padding:20, paddingTop:50, backgroundColor:'#101010',borderBottomLeftRadius:10,borderBottomRightRadius:10}}>
      <View style={{display:'flex',flexDirection:'column', alignItems:'flex-start', gap:10}}>
        <Text style={{fontFamily:'poppins-bold', fontSize:15, color:'#ffff'}}>DELIVERY ADDRESS</Text>
        <View>
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
    </View>
  )
}