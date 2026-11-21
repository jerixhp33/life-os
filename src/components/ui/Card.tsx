import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { shadows } from '../../theme/tokens';

interface CardProps {
  children: React.ReactNode;
  style?: object;
  elevation?: 'flat' | 'raised' | 'floating';
  index?: number;
}

interface TouchableCardProps extends CardProps {
  onPress: () => void;
}

const BORDER_RADIUS = 22;
const BORDER_WIDTH = 1.2;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function enteringAnimation(index: number) {
  return FadeInDown.duration(380).delay(index * 40).springify();
}

function elevationShadow(elevation: CardProps['elevation']) {
  if (elevation === 'flat') return {};
  if (elevation === 'floating') return shadows.lg;
  return shadows.md;
}

// Glassy white transparent gradients with specular reflection
const DARK_GRADIENT: readonly [string, string, ...string[]] = [
  'rgba(255, 255, 255, 0.18)',
  'rgba(255, 255, 255, 0.06)',
  'rgba(14, 28, 48, 0.70)',
];

const LIGHT_GRADIENT: readonly [string, string, ...string[]] = [
  'rgba(255, 255, 255, 0.96)',
  'rgba(255, 255, 255, 0.85)',
  'rgba(238, 245, 252, 0.78)',
];

export function Card({
  children,
  style,
  elevation = 'raised',
  index,
}: CardProps) {
  const { isDark } = useTheme();

  const borderColor = isDark
    ? 'rgba(255, 255, 255, 0.22)'
    : 'rgba(255, 255, 255, 0.92)';

  return (
    <Animated.View
      entering={enteringAnimation(index ?? 0)}
      style={[
        styles.card,
        { borderColor },
        elevationShadow(elevation),
        style,
      ]}
    >
      <BlurView
        tint={isDark ? 'dark' : 'light'}
        intensity={Platform.OS === 'ios' ? 60 : 45}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={isDark ? DARK_GRADIENT : LIGHT_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Specular hairline top reflection */}
      <View
        style={[
          styles.specularShine,
          {
            backgroundColor: isDark
              ? 'rgba(255, 255, 255, 0.38)'
              : 'rgba(255, 255, 255, 0.95)',
          },
        ]}
      />
      <View style={styles.content}>{children}</View>
    </Animated.View>
  );
}

export function TouchableCard({
  children,
  style,
  onPress,
  elevation = 'raised',
  index,
}: TouchableCardProps) {
  const { isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const borderColor = isDark
    ? 'rgba(255, 255, 255, 0.24)'
    : 'rgba(255, 255, 255, 0.92)';

  return (
    <AnimatedPressable
      entering={enteringAnimation(index ?? 0)}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.975, { damping: 18, stiffness: 350 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 18, stiffness: 350 });
      }}
      accessibilityRole="button"
      style={[
        styles.card,
        { borderColor },
        elevationShadow(elevation),
        animatedStyle,
        style,
      ]}
    >
      <BlurView
        tint={isDark ? 'dark' : 'light'}
        intensity={Platform.OS === 'ios' ? 60 : 45}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={isDark ? DARK_GRADIENT : LIGHT_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Specular hairline top reflection */}
      <View
        style={[
          styles.specularShine,
          {
            backgroundColor: isDark
              ? 'rgba(255, 255, 255, 0.38)'
              : 'rgba(255, 255, 255, 0.95)',
          },
        ]}
      />
      <View style={styles.content}>{children}</View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS,
    borderWidth: BORDER_WIDTH,
    overflow: 'hidden',
    position: 'relative',
  },
  specularShine: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
  },
  content: {
    padding: 16,
  },
});
