import React, { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';
import { useAuthStore } from '../src/stores/authStore';
import { useSecurityStore } from '../src/stores/securityStore';
import { useRealtimeSync } from '../src/lib/supabase/realtime';
import { setupNotificationChannels } from '../src/lib/notifications/service';
import { LoadingScreen } from '../src/components/feedback';
import { OfflineBanner } from '../src/components/feedback/OfflineBanner';
import { BiometricLockModal } from '../src/components/security/BiometricLockModal';

const qc = new QueryClient({ defaultOptions: { queries: { retry: 2, staleTime: 30_000 } } });

function Inner() {
  const { isDark } = useTheme();
  const initialize = useAuthStore(s => s.initialize);
  const isInitialized = useAuthStore(s => s.isInitialized);
  const initSecurity = useSecurityStore(s => s.initialize);

  useRealtimeSync();

  useEffect(() => {
    initialize();
    initSecurity();
    setupNotificationChannels().catch(() => {});

    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        useSecurityStore.getState().onAppBackground();
      } else if (nextState === 'active') {
        useSecurityStore.getState().onAppForeground();
      }
    });

    return () => sub.remove();
  }, [initialize, initSecurity]);

  if (!isInitialized) return <LoadingScreen />;

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <OfflineBanner />
      <Stack
        id="root-stack"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 220,
          gestureEnabled: true,
          fullScreenGestureEnabled: true
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="tasks/[id]" options={{ presentation: 'modal', animation: 'slide_from_bottom', gestureEnabled: true }} />
        <Stack.Screen name="tasks/new" options={{ presentation: 'modal', animation: 'slide_from_bottom', gestureEnabled: true }} />
        <Stack.Screen name="notes/[id]" options={{ presentation: 'modal', animation: 'slide_from_bottom', gestureEnabled: true }} />
        <Stack.Screen name="notes/new" options={{ presentation: 'modal', animation: 'slide_from_bottom', gestureEnabled: true }} />
        <Stack.Screen name="calendar/new" options={{ presentation: 'modal', animation: 'slide_from_bottom', gestureEnabled: true }} />
        <Stack.Screen name="calendar/[id]" options={{ presentation: 'modal', animation: 'slide_from_bottom', gestureEnabled: true }} />
        <Stack.Screen name="goals/new" options={{ presentation: 'modal', animation: 'slide_from_bottom', gestureEnabled: true }} />
        <Stack.Screen name="goals/[id]" options={{ presentation: 'modal', animation: 'slide_from_bottom', gestureEnabled: true }} />
        <Stack.Screen name="habits/new" options={{ presentation: 'modal', animation: 'slide_from_bottom', gestureEnabled: true }} />
        <Stack.Screen name="habits/[id]" options={{ presentation: 'modal', animation: 'slide_from_bottom', gestureEnabled: true }} />
        <Stack.Screen name="finance/new" options={{ presentation: 'modal', animation: 'slide_from_bottom', gestureEnabled: true }} />
        <Stack.Screen name="finance/index" options={{ presentation: 'card', animation: 'slide_from_right', gestureEnabled: true }} />
        <Stack.Screen name="documents/index" options={{ presentation: 'card', animation: 'slide_from_right', gestureEnabled: true }} />
        <Stack.Screen name="documents/[id]" options={{ presentation: 'card', animation: 'slide_from_right', gestureEnabled: true }} />
        <Stack.Screen name="workspaces/index" options={{ presentation: 'card', animation: 'slide_from_right', gestureEnabled: true }} />
        <Stack.Screen name="ai/chat" options={{ presentation: 'card', animation: 'slide_from_right', gestureEnabled: true }} />
        <Stack.Screen name="settings/profile" options={{ presentation: 'card', animation: 'slide_from_right', gestureEnabled: true }} />
        <Stack.Screen name="settings/security" options={{ presentation: 'card', animation: 'slide_from_right', gestureEnabled: true }} />
        <Stack.Screen name="settings/export" options={{ presentation: 'card', animation: 'slide_from_right', gestureEnabled: true }} />
      </Stack>
      <BiometricLockModal />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={qc}>
          <ThemeProvider>
            <Inner />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
