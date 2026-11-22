import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeContext';
import { radius } from '../../src/theme/tokens';
import { DynamicIsland } from '../../src/components/layout/DynamicIsland';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function TabsLayout() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Safe clearance above Android 3-button bar / gestures and iOS home indicator
  const bottomOffset = Platform.OS === 'android'
    ? Math.max(insets.bottom, 16) + 12
    : Math.max(insets.bottom, 12);

  return (
    <View style={{ flex: 1 }}>
      <DynamicIsland />
      <Tabs
        id="main-tabs"
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            left: 18,
            right: 18,
            bottom: bottomOffset,
            height: 66,
            borderRadius: 33,
            borderWidth: 1,
            borderColor: isDark
              ? 'rgba(255, 255, 255, 0.12)'
              : 'rgba(255, 255, 255, 0.85)',
            backgroundColor: 'transparent',
            paddingBottom: 6,
            paddingTop: 6,
            elevation: 0,
            shadowColor: 'transparent',
            shadowOpacity: 0,
          },
          tabBarBackground: () => (
            <View style={[StyleSheet.absoluteFill, { borderRadius: 33, overflow: 'hidden' }]}>
              <BlurView
                tint={isDark ? 'dark' : 'light'}
                intensity={Platform.OS === 'ios' ? 70 : 50}
                experimentalBlurMethod="dimezisBlurView"
                style={StyleSheet.absoluteFill}
              />
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.04)'
                      : 'rgba(255, 255, 255, 0.75)',
                  },
                ]}
              />
            </View>
          ),
          tabBarActiveTintColor: isDark ? '#FFFFFF' : '#2563EB',
          tabBarInactiveTintColor: isDark ? '#94A3B8' : '#64748B',
          tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 1 },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused, size }) => (
              <TabIconWithSpring
                name="home"
                outlineName="home-outline"
                focused={focused}
                color={color}
                size={size}
                isDark={isDark}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: 'Calendar',
            tabBarIcon: ({ color, focused, size }) => (
              <TabIconWithSpring
                name="calendar"
                outlineName="calendar-outline"
                focused={focused}
                color={color}
                size={size}
                isDark={isDark}
              />
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
              <TabIconWithSpring
                name="flag"
                outlineName="flag-outline"
                focused={focused}
                color={color}
                size={size}
                isDark={isDark}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: 'More',
            tabBarIcon: ({ color, focused, size }) => (
              <TabIconWithSpring
                name="grid"
                outlineName="grid-outline"
                focused={focused}
                color={color}
                size={size}
                isDark={isDark}
              />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

function TabIconWithSpring({
  name,
  outlineName,
  focused,
  color,
  size,
  isDark,
}: {
  name: keyof typeof Ionicons.glyphMap;
  outlineName: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: any;
  size: number;
  isDark: boolean;
}) {
  const scale = useSharedValue(focused ? 1.15 : 1.0);
  const pillOpacity = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.18 : 1.0, { damping: 14, stiffness: 280 });
    pillOpacity.value = withTiming(focused ? 1 : 0, { duration: 180 });
  }, [focused]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pillStyle = useAnimatedStyle(() => ({
    opacity: pillOpacity.value,
  }));

  return (
    <View style={iconStyles.container}>
      {/* Animated active glowing pill - borderless clean glow */}
      <Animated.View
        style={[
          iconStyles.indicatorPill,
          {
            backgroundColor: isDark
              ? 'rgba(59, 130, 246, 0.22)'
              : 'rgba(37, 99, 235, 0.12)',
          },
          pillStyle,
        ]}
      />
      <Animated.View style={animStyle}>
        <Ionicons
          name={focused ? name : outlineName}
          size={size - 2}
          color={color as any}
        />
      </Animated.View>
    </View>
  );
}

const iconStyles = StyleSheet.create({
  container: {
    width: 38,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorPill: {
    position: 'absolute',
    width: 34,
    height: 26,
    borderRadius: 13,
    borderWidth: 0,
  },
});

function CreateTabButton({ onPress, isDark }: { onPress?: () => void; isDark: boolean }) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.88, { damping: 15, stiffness: 380 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1.06, { damping: 12, stiffness: 320 });
    setTimeout(() => {
      scale.value = withSpring(1.0, { damping: 15, stiffness: 350 });
    }, 120);
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
            backgroundColor: '#3B82F6',
            shadowColor: '#3B82F6',
          },
          animStyle,
        ]}
        accessibilityLabel="Create item"
        accessibilityRole="button"
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </AnimatedPressable>
    </View>
  );
}

const cS = StyleSheet.create({
  btn: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 0,
  },
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
