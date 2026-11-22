import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Platform,
  Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { useFocusStore } from '../../stores/focusStore';
import { radius, shadows } from '../../theme/tokens';

const CAT_LOGO = require('../../../assets/logo.png');

export function DynamicIsland() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [expanded, setExpanded] = useState(false);

  const status = useFocusStore((s) => s.status);
  const mode = useFocusStore((s) => s.mode);
  const timeLeft = useFocusStore((s) => s.timeLeft);
  const duration = useFocusStore((s) => s.duration);
  const activeTaskTitle = useFocusStore((s) => s.activeTaskTitle);
  const start = useFocusStore((s) => s.start);
  const pause = useFocusStore((s) => s.pause);
  const resume = useFocusStore((s) => s.resume);
  const reset = useFocusStore((s) => s.reset);
  const tick = useFocusStore((s) => s.tick);

  // Interval timer for active focus session
  useEffect(() => {
    if (status !== 'running') return;
    const interval = setInterval(() => {
      tick();
    }, 1000);
    return () => clearInterval(interval);
  }, [status, tick]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPct = duration > 0 ? (1 - timeLeft / duration) * 100 : 0;

  const toggleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded((prev) => !prev);
  };

  const handleToggleTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (status === 'running') {
      pause();
    } else if (status === 'paused') {
      resume();
    } else {
      start();
    }
  };

  const handleOpenSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded(false);
    router.push('/search');
  };

  const handleOpenFocus = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded(false);
    router.push('/focus');
  };

  const topPosition = Platform.OS === 'android' ? Math.max(insets.top - 4, 8) : insets.top + 2;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.outerContainer, { top: topPosition }]}
    >
      <Animated.View
        style={[
          styles.islandContainer,
          {
            width: expanded ? 340 : status === 'running' || status === 'paused' ? 210 : 165,
            height: expanded ? 135 : 38,
            borderRadius: expanded ? 24 : 19,
            backgroundColor: isDark
              ? 'rgba(24, 21, 18, 0.88)'
              : 'rgba(255, 255, 255, 0.92)',
            borderColor: isDark
              ? 'rgba(255, 255, 255, 0.20)'
              : 'rgba(15, 23, 42, 0.1)',
          },
        ]}
      >
        <BlurView
          intensity={Platform.OS === 'ios' ? 75 : 50}
          tint={isDark ? 'dark' : 'light'}
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />

        {/* Specular Top Shine */}
        <View
          style={[
            styles.specularShine,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.35)'
                : 'rgba(255, 255, 255, 0.9)',
            },
          ]}
        />

        {/* Collapsed Pill Content */}
        {!expanded ? (
          <TouchableOpacity
            onPress={toggleExpand}
            style={styles.collapsedRow}
            activeOpacity={0.8}
          >
            {status === 'running' || status === 'paused' ? (
              <>
                <View style={styles.runningLeft}>
                  <View
                    style={[
                      styles.pulsingDot,
                      {
                        backgroundColor:
                          status === 'running' ? '#F59E0B' : '#64748B',
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.timerText,
                      { color: isDark ? '#FFFFFF' : '#0F172A' },
                    ]}
                  >
                    {timeFormatted}
                  </Text>
                </View>

                <View style={styles.runningRight}>
                  <Text
                    style={[
                      styles.taskSnippet,
                      { color: isDark ? '#F59E0B' : '#D97706' },
                    ]}
                    numberOfLines={1}
                  >
                    {activeTaskTitle || (mode === 'pomodoro' ? 'Focus' : 'Break')}
                  </Text>
                  <Ionicons
                    name={status === 'running' ? 'pause' : 'play'}
                    size={13}
                    color={theme.brand.primary}
                  />
                </View>
              </>
            ) : (
              <>
                <View style={styles.idleLeft}>
                  <Image source={CAT_LOGO} style={styles.catMini} resizeMode="contain" />
                  <Text
                    style={[
                      styles.idleBrand,
                      { color: isDark ? '#FFFFFF' : '#0F172A' },
                    ]}
                  >
                    LifeOS
                  </Text>
                </View>

                <View style={styles.idleRight}>
                  <View style={styles.cloudDot} />
                  <Ionicons
                    name="sparkles"
                    size={13}
                    color={isDark ? '#F59E0B' : '#D97706'}
                  />
                </View>
              </>
            )}
          </TouchableOpacity>
        ) : (
          /* Expanded Card Content */
          <View style={styles.expandedContent}>
            {/* Top Bar */}
            <View style={styles.expandedHeader}>
              <View style={styles.expandedTitleRow}>
                <Image source={CAT_LOGO} style={styles.catExpanded} resizeMode="contain" />
                <View>
                  <Text
                    style={[
                      styles.expandedTitle,
                      { color: isDark ? '#FFFFFF' : '#0F172A' },
                    ]}
                  >
                    {mode === 'pomodoro' ? 'Deep Focus Engine' : 'Rest Break'}
                  </Text>
                  <Text
                    style={[
                      styles.expandedSub,
                      { color: isDark ? '#819BB3' : '#64748B' },
                    ]}
                    numberOfLines={1}
                  >
                    {activeTaskTitle || 'LifeOS Autonomous Workflows'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={toggleExpand}
                style={styles.closeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="chevron-up"
                  size={18}
                  color={isDark ? '#94A3B8' : '#64748B'}
                />
              </TouchableOpacity>
            </View>

            {/* Timer & Controls Middle Row */}
            <View style={styles.expandedMidRow}>
              <View style={styles.timerBlock}>
                <Text
                  style={[
                    styles.bigTimer,
                    { color: isDark ? '#FFFFFF' : '#0F172A' },
                  ]}
                >
                  {timeFormatted}
                </Text>
                <View
                  style={[
                    styles.miniProgressTrack,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(15, 23, 42, 0.08)',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.miniProgressFill,
                      {
                        width: `${Math.round(progressPct)}%`,
                        backgroundColor: '#38BDF8',
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionBtnsRow}>
                <TouchableOpacity
                  onPress={handleToggleTimer}
                  style={[
                    styles.circleBtn,
                    {
                      backgroundColor:
                        status === 'running'
                          ? 'rgba(245, 158, 11, 0.2)'
                          : 'rgba(56, 189, 248, 0.2)',
                    },
                  ]}
                >
                  <Ionicons
                    name={status === 'running' ? 'pause' : 'play'}
                    size={16}
                    color={status === 'running' ? '#F59E0B' : '#38BDF8'}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    reset();
                  }}
                  style={[
                    styles.circleBtn,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(15, 23, 42, 0.06)',
                    },
                  ]}
                >
                  <Ionicons
                    name="refresh"
                    size={14}
                    color={isDark ? '#94A3B8' : '#64748B'}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom Quick Links */}
            <View style={styles.bottomShortcuts}>
              <TouchableOpacity
                onPress={handleOpenSearch}
                style={[
                  styles.shortcutChip,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(15, 23, 42, 0.05)',
                  },
                ]}
              >
                <Ionicons name="search" size={12} color="#38BDF8" />
                <Text
                  style={[
                    styles.shortcutText,
                    { color: isDark ? '#E2E8F0' : '#1E293B' },
                  ]}
                >
                  Omni-Search
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleOpenFocus}
                style={[
                  styles.shortcutChip,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(15, 23, 42, 0.05)',
                  },
                ]}
              >
                <Ionicons name="headset" size={12} color="#A855F7" />
                <Text
                  style={[
                    styles.shortcutText,
                    { color: isDark ? '#E2E8F0' : '#1E293B' },
                  ]}
                >
                  Focus Studio
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  islandContainer: {
    borderWidth: 1.2,
    overflow: 'hidden',
    ...shadows.md,
  },
  specularShine: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1,
  },
  collapsedRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  runningLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulsingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  runningRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 100,
  },
  taskSnippet: {
    fontSize: 11,
    fontWeight: '600',
  },
  idleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  catMini: {
    width: 17,
    height: 17,
  },
  idleBrand: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  idleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cloudDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  expandedContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  expandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expandedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  catExpanded: {
    width: 26,
    height: 26,
  },
  expandedTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  expandedSub: {
    fontSize: 10,
    fontWeight: '500',
  },
  closeBtn: {
    padding: 2,
  },
  expandedMidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  timerBlock: {
    gap: 4,
    flex: 1,
  },
  bigTimer: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  miniProgressTrack: {
    width: 120,
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  actionBtnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomShortcuts: {
    flexDirection: 'row',
    gap: 8,
  },
  shortcutChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  shortcutText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
