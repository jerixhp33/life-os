import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, radius, fontSize, fontWeight, touchTarget, shadows } from '../../theme/tokens';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: object;
  accessibilityLabel?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  style,
  accessibilityLabel,
}: Props) {
  const { theme, isDark } = useTheme();
  const isDisabled = disabled || loading;
  const vs = getVariant(variant, theme, isDark);
  const ss = getSize(size);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        vs.container,
        ss.container,
        variant === 'primary' && shadows.sm,
        fullWidth && styles.full,
        isDisabled && styles.disabled,
        style,
      ]}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={vs.textColor} />
      ) : (
        <View style={styles.row}>
          {icon && <View style={{ marginRight: spacing[2] }}>{icon}</View>}
          <Text style={[styles.label, { color: vs.textColor }, ss.label]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function getVariant(v: Variant, theme: ReturnType<typeof useTheme>['theme'], isDark: boolean) {
  switch (v) {
    case 'primary':
      return {
        container: {
          backgroundColor: theme.brand.primary,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(2,132,199,0.3)',
        },
        textColor: '#FFFFFF',
      };
    case 'secondary':
      return {
        container: {
          backgroundColor: theme.brand.primaryBg,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(56,189,248,0.2)' : 'rgba(2,132,199,0.15)',
        },
        textColor: theme.brand.primary,
      };
    case 'outline':
      return {
        container: {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: theme.brand.primary,
        },
        textColor: theme.brand.primary,
      };
    case 'ghost':
      return { container: { backgroundColor: 'transparent' }, textColor: theme.brand.primary };
    case 'destructive':
      return {
        container: {
          backgroundColor: theme.error,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.2)',
        },
        textColor: '#FFFFFF',
      };
  }
}

function getSize(s: Size) {
  switch (s) {
    case 'sm':
      return {
        container: { height: 38, paddingHorizontal: spacing[4], borderRadius: radius.lg },
        label: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
      };
    case 'md':
      return {
        container: { height: touchTarget.comfortable, paddingHorizontal: spacing[5], borderRadius: radius.lg },
        label: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
      };
    case 'lg':
      return {
        container: { height: touchTarget.large, paddingHorizontal: spacing[6], borderRadius: radius.xl },
        label: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
      };
  }
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  full: { width: '100%' },
  disabled: { opacity: 0.45 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  label: { letterSpacing: 0.2 },
});
