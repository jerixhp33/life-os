import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { AppBackground } from '../layout/AppBackground';
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

export function LoadingScreen({ message = 'Initializing intelligence system...' }: { message?: string }) {
  const { theme, isDark } = useTheme();

  const pulse = useSharedValue(1);
  const glow = useSharedValue(0.4);
  const progress = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    glow.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 1600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    progress.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.cubic) }),
      -1,
      false
    );
  }, []);

  const haloAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: glow.value,
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${Math.round(progress.value * 100)}%`,
  }));

  return (
    <View style={lS.container}>
      <AppBackground screenName="loading" />

      {/* Center Branding Content */}
      <View style={lS.centerContent}>
        {/* Glowing Geometric LifeOS Glyph */}
        <View style={lS.glyphWrapper}>
          {/* Pulsing Aura Halo */}
          <Animated.View style={[lS.haloRing, haloAnimatedStyle]}>
            <LinearGradient
              colors={['#38BDF8', '#6366F1', '#A855F7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          {/* Frosted Glass Emblem Frame */}
          <View
            style={[
              lS.emblemBox,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.12)'
                  : 'rgba(255, 255, 255, 0.92)',
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.28)'
                  : 'rgba(255, 255, 255, 0.95)',
              },
            ]}
          >
            <LinearGradient
              colors={['#2563EB', '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={lS.innerCube}
            >
              <Ionicons name="cube-outline" size={32} color="#FFFFFF" />
            </LinearGradient>
          </View>
        </View>

        {/* Title & Brand Name */}
        <View style={lS.textBlock}>
          <Text style={[lS.brandTitle, { color: theme.text.primary }]}>LifeOS</Text>
          <View
            style={[
              lS.tagPill,
              {
                backgroundColor: isDark
                  ? 'rgba(56, 189, 248, 0.12)'
                  : 'rgba(2, 132, 199, 0.08)',
                borderColor: isDark
                  ? 'rgba(56, 189, 248, 0.25)'
                  : 'rgba(2, 132, 199, 0.18)',
              },
            ]}
          >
            <View style={lS.statusDot} />
            <Text style={[lS.tagText, { color: isDark ? '#38BDF8' : '#0284C7' }]}>
              Personal Intelligence System
            </Text>
          </View>
        </View>

        {/* Micro Progress Bar & Status Message */}
        <View style={lS.progressSection}>
          <View
            style={[
              lS.progressBarTrack,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(15, 23, 42, 0.08)',
              },
            ]}
          >
            <Animated.View style={[lS.progressBarFill, progressAnimatedStyle]}>
              <LinearGradient
                colors={['#38BDF8', '#6366F1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>

          <Text style={[lS.statusMsg, { color: isDark ? '#819BB3' : '#64748B' }]}>
            {message}
          </Text>
        </View>
      </View>

      {/* Minimal Footer */}
      <View style={lS.footer}>
        <Ionicons
          name="shield-checkmark-outline"
          size={13}
          color={isDark ? '#64748B' : '#94A3B8'}
        />
        <Text style={[lS.footerText, { color: isDark ? '#64748B' : '#94A3B8' }]}>
          Zero-Knowledge Encrypted · Cloud Synced
        </Text>
      </View>
    </View>
  );
}

const lS = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 56,
    paddingHorizontal: 24,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 22,
    width: '100%',
  },
  glyphWrapper: {
    width: 104,
    height: 104,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  haloRing: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    opacity: 0.5,
  },
  emblemBox: {
    width: 78,
    height: 78,
    borderRadius: 24,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  innerCube: {
    width: 58,
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBlock: {
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  progressSection: {
    width: '75%',
    maxWidth: 240,
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  progressBarTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  statusMsg: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '500',
  },
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
