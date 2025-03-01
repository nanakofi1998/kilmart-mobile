import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import "../global.css"

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'inter-bold': require('./../assets/fonts/Inter_18pt-Bold.ttf'),
    'inter': require('./../assets/fonts/Inter_18pt-Regular.ttf'),
    'inter-semi': require('./../assets/fonts/Inter_18pt-SemiBold.ttf'),
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
