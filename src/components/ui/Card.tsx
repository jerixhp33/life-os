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
  return FadeInDown.duration(380).delay(index * 45).springify();
}

function elevationShadow(elevation: CardProps['elevation']) {
  if (elevation === 'flat') return {};
  if (elevation === 'floating') return shadows.lg;
  return shadows.md;
}

const DARK_GRADIENT: readonly [string, string, ...string[]] = [
  'rgba(255, 255, 255, 0.12)',
  'rgba(26, 90, 127, 0.25)',
  'rgba(10, 36, 56, 0.85)',
];

const LIGHT_GRADIENT: readonly [string, string, ...string[]] = [
  'rgba(255, 255, 255, 0.96)',
  'rgba(235, 245, 252, 0.88)',
  'rgba(212, 222, 227, 0.80)',
];

export function Card({
  children,
  style,
  elevation = 'raised',
  index,
}: CardProps) {
  const { isDark } = useTheme();

  const borderColor = isDark
    ? 'rgba(168, 220, 244, 0.28)'
    : 'rgba(255, 255, 255, 0.88)';

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
      {Platform.OS === 'ios' && (
        <BlurView
          tint={isDark ? 'dark' : 'light'}
          intensity={55}
          style={StyleSheet.absoluteFill}
        />
      )}
      <LinearGradient
        colors={isDark ? DARK_GRADIENT : LIGHT_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
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
    ? 'rgba(168, 220, 244, 0.28)'
    : 'rgba(255, 255, 255, 0.88)';

  return (
    <AnimatedPressable
      entering={enteringAnimation(index ?? 0)}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
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
      {Platform.OS === 'ios' && (
        <BlurView
          tint={isDark ? 'dark' : 'light'}
          intensity={55}
          style={StyleSheet.absoluteFill}
        />
      )}
      <LinearGradient
        colors={isDark ? DARK_GRADIENT : LIGHT_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
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
  content: {
    padding: 16,
  },
});
