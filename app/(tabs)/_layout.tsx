import React from 'react';
import { Tabs } from 'expo-router';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeContext';
import { radius } from '../../src/theme/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function TabsLayout() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 14 : 10);
  const tabHeight = 60 + bottomPadding;

  return (
    <Tabs
      id="main-tabs"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0.5,
          borderTopColor: isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(15, 23, 42, 0.08)',
          backgroundColor: isDark ? 'rgba(7, 21, 36, 0.88)' : 'rgba(255, 255, 255, 0.90)',
          height: tabHeight,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          elevation: 14,
          shadowColor: isDark ? '#000000' : '#0F172A',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.35 : 0.06,
          shadowRadius: 12,
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView
              tint={isDark ? 'dark' : 'light'}
              intensity={80}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        tabBarActiveTintColor: isDark ? '#38BDF8' : '#0284C7',
        tabBarInactiveTintColor: isDark ? '#7FA0BA' : '#94A3B8',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color as any} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color as any} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarIcon: () => null,
          tabBarButton: (props: any) => <CreateTabButton {...props} isDark={isDark} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'flag' : 'flag-outline'} size={size} color={color as any} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={size} color={color as any} />
          ),
        }}
      />
    </Tabs>
  );
}

function CreateTabButton({ onPress, isDark }: { onPress?: () => void; isDark: boolean }) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.90, { damping: 15, stiffness: 350 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 350 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.();
  };

  return (
    <View style={cS.wrap}>
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={[
          cS.btn,
          {
            backgroundColor: isDark ? '#38BDF8' : '#0284C7',
            shadowColor: isDark ? '#38BDF8' : '#0284C7',
          },
          animStyle,
        ]}
        accessibilityLabel="Create item"
        accessibilityRole="button"
      >
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </AnimatedPressable>
    </View>
  );
}

const cS = StyleSheet.create({
  btn: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 12 : 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.38,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 6 },
});
