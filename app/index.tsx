import React from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';

export default function Index() {
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);

  if (session || profile) {
    return <Redirect href="/(tabs)/home" />;
  }
  return <Redirect href="/(auth)/welcome" />;
}
