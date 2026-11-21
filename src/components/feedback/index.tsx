import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, radius, fontSize, fontWeight } from '../../theme/tokens';
import { Button } from '../ui/Button';

export function Spinner({ size = 'small' }: { size?: 'small' | 'large' }) {
  const { theme } = useTheme();
  return <ActivityIndicator size={size} color={theme.brand.primary} />;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = radius.sm,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: object;
}) {
  const { isDark } = useTheme();
  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(15, 23, 42, 0.08)',
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  const { theme, isDark } = useTheme();
  return (
    <View
      style={[
        skS.card,
        {
          backgroundColor: isDark ? 'rgba(14, 38, 64, 0.85)' : '#FFFFFF',
          borderColor: theme.border.subtle,
        },
      ]}
    >
      <View style={skS.row}>
        <Skeleton width={36} height={36} borderRadius={radius.md} />
        <View style={skS.flex}>
          <Skeleton height={15} width="60%" />
          <Skeleton height={11} width="40%" style={{ marginTop: spacing[1] }} />
        </View>
      </View>
      <Skeleton height={12} width="85%" style={{ marginTop: spacing[2] }} />
    </View>
  );
}

const skS = StyleSheet.create({
  card: {
    padding: spacing[4],
    borderRadius: radius.card,
    borderWidth: 1,
    marginBottom: spacing[3],
    gap: spacing[2],
  },
  row: { flexDirection: 'row', gap: spacing[3], alignItems: 'center' },
  flex: { flex: 1, gap: spacing[1] },
});

export function EmptyState({
  icon = 'file-tray-outline',
  title,
  description,
  actionLabel,
  onAction,
  style,
}: {
  icon?: any;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: object;
}) {
  const { theme } = useTheme();
  return (
    <View style={[emS.container, style]}>
      <View style={[emS.iconBox, { backgroundColor: theme.brand.primaryBg }]}>
        {typeof icon === 'string' ? (
          <Ionicons name={icon as any} size={36} color={theme.brand.primary} />
        ) : (
          icon
        )}
      </View>
      <Text style={[emS.title, { color: theme.text.primary }]}>{title}</Text>
      {description && <Text style={[emS.desc, { color: theme.text.tertiary }]}>{description}</Text>}
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} variant="primary" size="md" style={{ marginTop: spacing[4] }} />
      )}
    </View>
  );
}

const emS = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[8],
  },
  iconBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, textAlign: 'center', marginBottom: spacing[2] },
  desc: { fontSize: fontSize.base, textAlign: 'center', lineHeight: 22 },
});

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { theme } = useTheme();
  return (
    <View style={erS.container}>
      <Text style={[erS.msg, { color: theme.text.secondary }]}>{message}</Text>
      {onRetry && (
        <Button label="Try again" onPress={onRetry} variant="outline" size="sm" style={{ marginTop: spacing[3] }} />
      )}
    </View>
  );
}

const erS = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing[10],
    paddingHorizontal: spacing[6],
    gap: spacing[2],
  },
  msg: { fontSize: fontSize.base, textAlign: 'center', lineHeight: 22 },
});

export function LoadingScreen() {
  const { theme } = useTheme();
  return (
    <View style={[lS.container, { backgroundColor: theme.bg.primary }]}>
      <Text style={[lS.logo, { color: theme.brand.primary }]}>LifeOS</Text>
      <Text style={{ fontSize: fontSize.xs, color: theme.text.tertiary, marginTop: -8 }}>
        One UI Frosted Glass Edition
      </Text>
      <Spinner size="small" />
    </View>
  );
}

const lS = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[4] },
  logo: { fontSize: 28, fontWeight: fontWeight.bold, letterSpacing: -0.5 },
});

export function Badge({ label, color, bg, style }: { label: string; color: string; bg: string; style?: object }) {
  return (
    <View style={[bS.badge, { backgroundColor: bg }, style]}>
      <Text style={[bS.label, { color }]}>{label}</Text>
    </View>
  );
}

const bS = StyleSheet.create({
  badge: { paddingHorizontal: spacing[2], paddingVertical: 3, borderRadius: radius.full, alignSelf: 'flex-start' },
  label: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
});
