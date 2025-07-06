import React from "react";
import { Stack } from "expo-router";

const Auth = () => {
  return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="verifyotp" />
      </Stack>
  );
}
export default Auth;