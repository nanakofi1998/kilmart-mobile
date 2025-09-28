import { View, Text, Platform, StatusBar } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function Header() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[{padding:20, paddingTop:50, backgroundColor:'#f1b811',alignItems:'center', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowColor: '#000', shadowRadius: 5, elevation: 5,}, { paddingTop: Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight }]}>
      <Text style={{fontFamily:'inter-bold', fontSize:18, marginTop:10}}>My Favorite(s)</Text>
    </View>
  )
}