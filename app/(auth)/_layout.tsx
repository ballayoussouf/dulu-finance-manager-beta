import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="register/terms" />
      <Stack.Screen name="register" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register/verify" />
      <Stack.Screen name="register/complete" />
      <Stack.Screen name="register/plan" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-verify" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}