import { View, Text, FlatList, TouchableOpacity, Image, Dimensions } from 'react-native'
import React from 'react'
import fruit from '../../assets/images/image1.jpg'
import milk from '../../assets/images/image2.jpg'
import can from '../../assets/images/image3.jpg'
import alcohol from '../../assets/images/image4.jpg'
import Sliderlist from './Sliderlist'

const slider_item = [
  { id: '1', name: 'Fruits & Veggies', image: fruit },
  { id: '2', name: 'Dairy & Egg', image: milk },
  { id: '3', name: 'Cans & Jars', image: can },
  { id: '4', name: 'Pantry', image: alcohol },
];
const {width} = Dimensions.get('screen');

export default function Slider() {
  return (
    <View style={{marginTop:10}}>
      <FlatList
      data={slider_item}
      horizontal={true}
      showsHorizontalScrollIndicator={false}
      pagingEnabled
      style={{borderRadius:20}}
      renderItem={({item}) => (
        <TouchableOpacity>
          <View style={{alignItems:'center', width:width}}>
            <Image source={item.image} style={{width:390, height:130, borderRadius:20, gap:20}}/>
          </View>
        </TouchableOpacity>
      )} />
    </View>
  )
}