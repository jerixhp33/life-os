import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { shadows, radius } from '../../theme/tokens';

interface CardProps {
  children: React.ReactNode;
  style?: object;
  elevation?: 'flat' | 'raised' | 'floating';
  index?: number;
}

interface TouchableCardProps extends CardProps {
  onPress: () => void;
}

const BORDER_RADIUS = radius.card || 16;
const BORDER_WIDTH = 0.5;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function enteringAnimation(index: number) {
  return FadeInDown.duration(380).delay(index * 50).springify();
}

function elevationShadow(elevation: CardProps['elevation']) {
  if (elevation === 'flat') return {};
  if (elevation === 'floating') return shadows.md;
  return shadows.sm;
}

export function Card({
  children,
  style,
  elevation = 'raised',
  index,
}: CardProps) {
  const { theme, isDark } = useTheme();

  const fallbackBg = isDark
    ? 'rgba(16, 42, 68, 0.78)'
    : 'rgba(255, 255, 255, 0.85)';

  return (
    <Animated.View
      entering={enteringAnimation(index ?? 0)}
      style={[
        styles.card,
        {
          borderColor: theme.border.subtle,
          backgroundColor: Platform.OS === 'android' ? fallbackBg : 'transparent',
        },
        elevationShadow(elevation),
        style,
      ]}
    >
      {Platform.OS === 'ios' && (
        <BlurView
          tint={isDark ? 'dark' : 'light'}
          intensity={50}
          style={StyleSheet.absoluteFill}
        />
      )}
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
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const fallbackBg = isDark
    ? 'rgba(16, 42, 68, 0.78)'
    : 'rgba(255, 255, 255, 0.85)';

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
        {
          borderColor: theme.border.subtle,
          backgroundColor: Platform.OS === 'android' ? fallbackBg : 'transparent',
        },
        elevationShadow(elevation),
        animatedStyle,
        style,
      ]}
    >
      {Platform.OS === 'ios' && (
        <BlurView
          tint={isDark ? 'dark' : 'light'}
          intensity={50}
          style={StyleSheet.absoluteFill}
        />
      )}
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
