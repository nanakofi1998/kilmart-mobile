import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import "../global.css"

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'poppins-bold': require('./../assets/fonts/Poppins-Bold.ttf'),
    'poppins': require('./../assets/fonts/Poppins-Medium.ttf'),
    'poppins-semi': require('./../assets/fonts/Poppins-SemiBold.ttf'),
  });

  if (!fontsLoaded) {
    return null; 
  }
  
  return (
  <Stack screenOptions={{ headerShown:false}}>
    <Stack.Screen name="(tabs)"></Stack.Screen>
  </Stack>
  )
}
