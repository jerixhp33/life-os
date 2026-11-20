import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack id="auth-stack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
