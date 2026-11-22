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
            borderWidth: 1.5,
            borderColor: isDark
              ? 'rgba(255, 255, 255, 0.35)'
              : 'rgba(255, 255, 255, 0.95)',
            backgroundColor: isDark
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(255, 255, 255, 0.82)',
            paddingBottom: 6,
            paddingTop: 6,
            elevation: 20,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDark ? 0.45 : 0.15,
            shadowRadius: 18,
          },
          tabBarBackground: () => (
            <View style={[StyleSheet.absoluteFill, { borderRadius: 33, overflow: 'hidden' }]}>
              <BlurView
                tint={isDark ? 'dark' : 'light'}
                intensity={Platform.OS === 'ios' ? 80 : 60}
                experimentalBlurMethod="dimezisBlurView"
                style={StyleSheet.absoluteFill}
              />
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(255, 255, 255, 0.82)',
                  },
                ]}
              />
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 24,
                  right: 24,
                  height: 1.2,
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.45)'
                    : 'rgba(255, 255, 255, 0.95)',
                }}
              />
            </View>
          ),
          tabBarActiveTintColor: isDark ? '#F59E0B' : '#D97706',
          tabBarInactiveTintColor: isDark ? '#A89F91' : '#64748B',
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
      {/* Animated active glowing pill */}
      <Animated.View
        style={[
          iconStyles.indicatorPill,
          {
            backgroundColor: isDark
              ? 'rgba(245, 158, 11, 0.20)'
              : 'rgba(217, 119, 6, 0.12)',
            borderColor: isDark
              ? 'rgba(245, 158, 11, 0.40)'
              : 'rgba(217, 119, 6, 0.25)',
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
    borderWidth: 1,
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
            backgroundColor: isDark ? '#F59E0B' : '#D97706',
            shadowColor: isDark ? '#F59E0B' : '#D97706',
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
    shadowOpacity: 0.38,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
