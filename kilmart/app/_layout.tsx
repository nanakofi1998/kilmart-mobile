import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { CartProvider } from "../context/CartContext";
import "../global.css"
import { SafeAreaProvider } from "react-native-safe-area-context";

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
    <SafeAreaProvider>
      <CartProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </CartProvider>
    </SafeAreaProvider>
  );
}
