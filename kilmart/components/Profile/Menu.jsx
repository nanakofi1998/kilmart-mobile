import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import Octicons from '@expo/vector-icons/Octicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import { router } from 'expo-router';

export default function Menu() {
  return (
    <View style={{display:'flex',marginTop:10}}>
      <View style={{padding:20, flexDirection:'column',justifyContent:'center'}}>
        <TouchableOpacity style={{paddingTop:60, flexDirection:'row',alignItems:'center', justifyContent:'space-between'}}>
          <View style={{ gap:10, flexDirection:'row', alignItems:'center'}}>
            <AntDesign name="wallet" size={24} color="black" />
            <Text style={{fontFamily:'poppins',fontSize:17, color:'#141414'}}>My Wallet</Text>
          </View>
          <Text style={{fontFamily:'poppins-bold', fontSize:20, color:'#141414'}}>GH₵ 0.00</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{marginTop:40, flexDirection:'row',alignItems:'center', gap:10}}onPress={() => router.push('/coupon-screen')}>
          <AntDesign name="gift" size={28} color="#141414" />
          <Text style={{fontFamily:'poppins', fontSize:17, color:'#141414'}}>Gifts & Coupons</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{marginTop:40, flexDirection:'row',alignItems:'center', gap:10}}>
          <Ionicons name="notifications-outline" size={24} color="#141414" />
          <Text style={{fontFamily:'poppins', fontSize:17, color:'#141414'}}>Notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{marginTop:40, flexDirection:'row',alignItems:'center', gap:10}}>
          <Octicons name="person-add" size={24} color="#141414" />
          <Text style={{fontFamily:'poppins', fontSize:17, color:'#141414'}}>Refer A Friend</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{marginTop:40, flexDirection:'row',alignItems:'center', gap:10}} onPress={()=> router.push('/orders')}>
          <Ionicons name="receipt-outline" size={24} color="#141414" />
          <Text style={{fontFamily:'poppins', fontSize:17, color:'#141414'}}>Order History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{marginTop:40, flexDirection:'row',alignItems:'center', gap:10}}>
          <Octicons name="location" size={24} color="#141414" />
          <Text style={{fontFamily:'poppins', fontSize:17, color:'#141414'}}>Addresses</Text>
        </TouchableOpacity>
        {/* <TouchableOpacity style={{marginTop:40, flexDirection:'row',alignItems:'center', gap:10}}>
          <MaterialIcons name="payment" size={24} color="#141414" />
          <Text style={{fontFamily:'poppins', fontSize:17, color:'#141414'}}>Payment Methods</Text>
        </TouchableOpacity> */}
        <TouchableOpacity style={{marginTop:40, flexDirection:'row',alignItems:'center', gap:10}} onPress={() => router.push('/ContactUs')}>
          <MaterialIcons name="support-agent" size={24} color="#141414" />
          <Text style={{fontFamily:'poppins', fontSize:17, color:'#141414'}}>Contact Us</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{marginTop:40, flexDirection:'row',alignItems:'center', gap:10}}>
          <SimpleLineIcons name="settings" size={24} color="#141414" />
          <Text style={{fontFamily:'poppins', fontSize:17, color:'#141414'}}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}