import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { useTheme } from '../../src/theme/ThemeContext';
import { AppBackground } from '../../src/components/layout/AppBackground';
import {
  useFocusStore,
  FocusMode,
  SoundscapeType,
} from '../../src/stores/focusStore';
import {
  playSoundscape,
  stopSoundscape,
  playTactileCue,
} from '../../src/lib/sound/soundService';
import { useTodayTasks } from '../../src/features/tasks/hooks';
import { fontSize, fontWeight, radius, shadows, spacing } from '../../src/theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CIRCLE_SIZE = Math.min(SCREEN_WIDTH * 0.72, 280);
const STROKE_WIDTH = 12;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const SOUNDSCAPES: { type: SoundscapeType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: 'none', label: 'Silence', icon: 'volume-mute-outline' },
  { type: 'cosmic', label: 'Cosmic Noise', icon: 'planet-outline' },
  { type: 'rain', label: 'Rainfall', icon: 'rainy-outline' },
  { type: 'forest', label: 'Deep Forest', icon: 'leaf-outline' },
  { type: 'lofi', label: 'Lo-Fi Alpha', icon: 'headset-outline' },
];

export default function FocusStudioScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();

  const {
    status,
    mode,
    timeLeft,
    duration,
    soundscape,
    activeTaskId,
    activeTaskTitle,
    completedSessions,
    start,
    pause,
    resume,
    reset,
    tick,
    setMode,
    setSoundscape,
  } = useFocusStore();

  const { data: tasks } = useTodayTasks();
  const [showTaskPicker, setShowTaskPicker] = useState(false);

  // Background ticker
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (status === 'running') {
      interval = setInterval(() => {
        tick();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, tick]);

  // Ambient soundscape audio player synchronization
  useEffect(() => {
    if (soundscape !== 'none') {
      playSoundscape(soundscape);
    } else {
      stopSoundscape();
    }
    return () => {
      stopSoundscape();
    };
  }, [soundscape]);

  // Session completion audio chime
  useEffect(() => {
    if (status === 'break') {
      playTactileCue('bell');
      playTactileCue('success');
    }
  }, [status]);

  // Breathing pulse animation for active focus ring
  const pulseScale = useSharedValue(1);
  useEffect(() => {
    if (status === 'running') {
      pulseScale.value = withRepeat(
        withTiming(1.03, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
    }
  }, [status]);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Calculations
  const progress = duration > 0 ? (duration - timeLeft) / duration : 0;
  const strokeDashoffset = CIRCUMFERENCE - progress * CIRCUMFERENCE;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;

  const handleToggleTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    playTactileCue('click');
    if (status === 'running') {
      pause();
    } else if (status === 'paused') {
      resume();
    } else {
      start();
    }
  };

  const handleReset = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    playTactileCue('click');
    reset();
  };

  const handleModeChange = (newMode: FocusMode) => {
    Haptics.selectionAsync();
    setMode(newMode);
  };

  return (
    <View style={s.container}>
      <AppBackground screenName="focus" />

      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        {/* Top Header */}
        <Animated.View entering={FadeInDown.duration(350)} style={s.header}>
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              router.back();
            }}
            style={[
              s.iconBtn,
              {
                backgroundColor: isDark
                  ? 'rgba(10, 36, 56, 0.75)'
                  : 'rgba(255, 255, 255, 0.85)',
                borderColor: isDark
                  ? 'rgba(168, 220, 244, 0.28)'
                  : 'rgba(15, 23, 42, 0.12)',
              },
            ]}
          >
            <Ionicons name="chevron-down" size={22} color={theme.text.primary} />
          </TouchableOpacity>

          <View style={s.headerTitleBox}>
            <Text style={[s.headerTitle, { color: theme.text.primary }]}>
              Focus Studio
            </Text>
            <Text style={[s.headerSubtitle, { color: isDark ? '#819BB3' : '#64748B' }]}>
              {completedSessions} {completedSessions === 1 ? 'block' : 'blocks'} completed today
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowTaskPicker(!showTaskPicker)}
            style={[
              s.iconBtn,
              {
                backgroundColor: activeTaskId
                  ? isDark
                    ? 'rgba(56, 189, 248, 0.2)'
                    : 'rgba(2, 132, 199, 0.15)'
                  : isDark
                  ? 'rgba(10, 36, 56, 0.75)'
                  : 'rgba(255, 255, 255, 0.85)',
                borderColor: isDark
                  ? 'rgba(168, 220, 244, 0.28)'
                  : 'rgba(15, 23, 42, 0.12)',
              },
            ]}
          >
            <Ionicons
              name={activeTaskId ? 'checkbox' : 'checkbox-outline'}
              size={20}
              color={activeTaskId ? '#38BDF8' : theme.text.primary}
            />
          </TouchableOpacity>
        </Animated.View>

        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Mode Switcher Tabs */}
          <Animated.View entering={FadeInDown.duration(400).delay(80)} style={s.modeRow}>
            {(['pomodoro', 'short_break', 'long_break'] as FocusMode[]).map((m) => {
              const active = mode === m;
              const label =
                m === 'pomodoro' ? '25m Focus' : m === 'short_break' ? '5m Break' : '15m Rest';
              return (
                <TouchableOpacity
                  key={m}
                  onPress={() => handleModeChange(m)}
                  style={[
                    s.modeTab,
                    active && {
                      backgroundColor: isDark
                        ? 'rgba(56, 189, 248, 0.22)'
                        : 'rgba(2, 132, 199, 0.14)',
                      borderColor: isDark ? '#38BDF8' : '#0284C7',
                    },
                  ]}
                >
                  <Text
                    style={[
                      s.modeTabText,
                      {
                        color: active
                          ? isDark
                            ? '#38BDF8'
                            : '#0284C7'
                          : isDark
                          ? '#819BB3'
                          : '#64748B',
                        fontWeight: active ? '700' : '500',
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Animated.View>

          {/* Active Attached Task Card */}
          {activeTaskTitle ? (
            <Animated.View entering={FadeInDown.duration(400).delay(120)}>
              <TouchableOpacity
                onPress={() => setShowTaskPicker(true)}
                style={[
                  s.taskPill,
                  {
                    backgroundColor: isDark
                      ? 'rgba(10, 36, 56, 0.85)'
                      : 'rgba(255, 255, 255, 0.85)',
                    borderColor: isDark
                      ? 'rgba(56, 189, 248, 0.35)'
                      : 'rgba(2, 132, 199, 0.25)',
                  },
                ]}
              >
                <Ionicons name="flame" size={16} color="#F59E0B" />
                <Text
                  style={[s.taskPillText, { color: theme.text.primary }]}
                  numberOfLines={1}
                >
                  {activeTaskTitle}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={isDark ? '#819BB3' : '#64748B'}
                />
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <TouchableOpacity
              onPress={() => setShowTaskPicker(true)}
              style={s.attachTaskPrompt}
            >
              <Ionicons
                name="add-circle-outline"
                size={15}
                color={isDark ? '#819BB3' : '#64748B'}
              />
              <Text style={[s.attachTaskPromptText, { color: isDark ? '#819BB3' : '#64748B' }]}>
                Attach a task to track productivity
              </Text>
            </TouchableOpacity>
          )}

          {/* Task Picker Dropdown */}
          {showTaskPicker && (
            <Animated.View
              entering={FadeInDown.duration(300)}
              style={[
                s.pickerCard,
                {
                  backgroundColor: isDark
                    ? 'rgba(10, 36, 56, 0.95)'
                    : 'rgba(255, 255, 255, 0.95)',
                  borderColor: isDark
                    ? 'rgba(168, 220, 244, 0.3)'
                    : 'rgba(15, 23, 42, 0.12)',
                },
              ]}
            >
              <Text style={[s.pickerHeader, { color: theme.text.primary }]}>
                Select Task to Focus On:
              </Text>
              {(tasks ?? [])
                .filter((t) => t.status !== 'completed')
                .slice(0, 5)
                .map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      start({ id: task.id, title: task.title });
                      setShowTaskPicker(false);
                    }}
                    style={s.pickerItem}
                  >
                    <Ionicons
                      name={
                        task.id === activeTaskId
                          ? 'radio-button-on'
                          : 'radio-button-off'
                      }
                      size={18}
                      color="#38BDF8"
                    />
                    <Text
                      style={[s.pickerItemText, { color: theme.text.primary }]}
                      numberOfLines={1}
                    >
                      {task.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              <TouchableOpacity
                onPress={() => {
                  start();
                  setShowTaskPicker(false);
                }}
                style={s.pickerItem}
              >
                <Ionicons name="sparkles-outline" size={18} color="#A855F7" />
                <Text style={[s.pickerItemText, { color: theme.text.primary }]}>
                  General Deep Work (No Task)
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Central Circular Progress Timer */}
          <Animated.View style={[s.timerRingWrapper, animatedPulseStyle]}>
            <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={s.svgRing}>
              <Defs>
                <SvgGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#38BDF8" />
                  <Stop offset="100%" stopColor="#2563EB" />
                </SvgGradient>
              </Defs>

              {/* Background Track Circle */}
              <Circle
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={RADIUS}
                stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)'}
                strokeWidth={STROKE_WIDTH}
                fill="none"
              />

              {/* Active Progress Circle */}
              <Circle
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={RADIUS}
                stroke="url(#focusGradient)"
                strokeWidth={STROKE_WIDTH}
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
              />
            </Svg>

            {/* Inner Clock Face */}
            <View style={s.timerInnerContent}>
              <Text style={[s.timerTime, { color: theme.text.primary }]}>
                {formattedTime}
              </Text>
              <Text
                style={[
                  s.timerStatusBadge,
                  {
                    color:
                      status === 'running'
                        ? '#38BDF8'
                        : status === 'paused'
                        ? '#F59E0B'
                        : isDark
                        ? '#819BB3'
                        : '#64748B',
                  },
                ]}
              >
                {status === 'running'
                  ? 'FLOWING'
                  : status === 'paused'
                  ? 'PAUSED'
                  : 'READY'}
              </Text>
            </View>
          </Animated.View>

          {/* Control Buttons */}
          <Animated.View entering={FadeInUp.duration(450).delay(150)} style={s.controlsRow}>
            {/* Reset Button */}
            <TouchableOpacity
              onPress={handleReset}
              disabled={status === 'idle'}
              style={[
                s.secondaryControlBtn,
                {
                  opacity: status === 'idle' ? 0.35 : 1,
                  backgroundColor: isDark
                    ? 'rgba(10, 36, 56, 0.8)'
                    : 'rgba(255, 255, 255, 0.85)',
                  borderColor: isDark
                    ? 'rgba(168, 220, 244, 0.28)'
                    : 'rgba(15, 23, 42, 0.12)',
                },
              ]}
            >
              <Ionicons
                name="refresh"
                size={22}
                color={isDark ? '#819BB3' : '#64748B'}
              />
            </TouchableOpacity>

            {/* Main Play/Pause Button */}
            <TouchableOpacity
              onPress={handleToggleTimer}
              activeOpacity={0.85}
              style={[
                s.primaryPlayBtn,
                {
                  backgroundColor:
                    status === 'running'
                      ? '#F59E0B'
                      : isDark
                      ? '#38BDF8'
                      : '#2563EB',
                },
              ]}
            >
              <Ionicons
                name={status === 'running' ? 'pause' : 'play'}
                size={32}
                color="#FFFFFF"
                style={{ marginLeft: status === 'running' ? 0 : 3 }}
              />
            </TouchableOpacity>

            {/* Soundscape Quick Toggle */}
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                const nextSound =
                  soundscape === 'none'
                    ? 'cosmic'
                    : soundscape === 'cosmic'
                    ? 'rain'
                    : soundscape === 'rain'
                    ? 'forest'
                    : soundscape === 'forest'
                    ? 'lofi'
                    : 'none';
                setSoundscape(nextSound);
              }}
              style={[
                s.secondaryControlBtn,
                {
                  backgroundColor:
                    soundscape !== 'none'
                      ? isDark
                        ? 'rgba(56, 189, 248, 0.22)'
                        : 'rgba(2, 132, 199, 0.15)'
                      : isDark
                      ? 'rgba(10, 36, 56, 0.8)'
                      : 'rgba(255, 255, 255, 0.85)',
                  borderColor:
                    soundscape !== 'none'
                      ? isDark
                        ? '#38BDF8'
                        : '#0284C7'
                      : isDark
                      ? 'rgba(168, 220, 244, 0.28)'
                      : 'rgba(15, 23, 42, 0.12)',
                },
              ]}
            >
              <Ionicons
                name={
                  soundscape === 'none'
                    ? 'volume-mute-outline'
                    : 'volume-high-outline'
                }
                size={22}
                color={soundscape !== 'none' ? '#38BDF8' : isDark ? '#819BB3' : '#64748B'}
              />
            </TouchableOpacity>
          </Animated.View>

          {/* Soundscapes Selector */}
          <Animated.View entering={FadeInUp.duration(450).delay(200)} style={s.soundscapesSection}>
            <Text style={[s.sectionTitle, { color: isDark ? '#819BB3' : '#64748B' }]}>
              AMBIENT SOUNDSCAPE
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.soundscapesScroll}
            >
              {SOUNDSCAPES.map((sc) => {
                const active = soundscape === sc.type;
                return (
                  <TouchableOpacity
                    key={sc.type}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSoundscape(sc.type);
                    }}
                    style={[
                      s.soundscapeChip,
                      {
                        backgroundColor: active
                          ? isDark
                            ? 'rgba(56, 189, 248, 0.24)'
                            : 'rgba(2, 132, 199, 0.16)'
                          : isDark
                          ? 'rgba(10, 36, 56, 0.7)'
                          : 'rgba(255, 255, 255, 0.8)',
                        borderColor: active
                          ? isDark
                            ? '#38BDF8'
                            : '#0284C7'
                          : isDark
                          ? 'rgba(168, 220, 244, 0.2)'
                          : 'rgba(15, 23, 42, 0.08)',
                      },
                    ]}
                  >
                    <Ionicons
                      name={sc.icon}
                      size={15}
                      color={
                        active
                          ? isDark
                            ? '#38BDF8'
                            : '#0284C7'
                          : isDark
                          ? '#819BB3'
                          : '#64748B'
                      }
                    />
                    <Text
                      style={[
                        s.soundscapeChipText,
                        {
                          color: active
                            ? isDark
                              ? '#38BDF8'
                              : '#0284C7'
                            : theme.text.primary,
                          fontWeight: active ? '700' : '500',
                        },
                      ]}
                    >
                      {sc.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 40,
    paddingTop: 10,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  modeTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modeTabText: {
    fontSize: 13,
  },
  taskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    maxWidth: SCREEN_WIDTH * 0.85,
    marginBottom: 20,
    ...shadows.sm,
  },
  taskPillText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  attachTaskPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    marginBottom: 20,
  },
  attachTaskPromptText: {
    fontSize: 12,
    fontWeight: '500',
  },
  pickerCard: {
    width: SCREEN_WIDTH * 0.88,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 18,
    ...shadows.md,
  },
  pickerHeader: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  pickerItemText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  timerRingWrapper: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  svgRing: {
    position: 'absolute',
  },
  timerInnerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerTime: {
    fontSize: 54,
    fontWeight: '800',
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
  },
  timerStatusBadge: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 6,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginTop: 20,
    marginBottom: 32,
  },
  secondaryControlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  primaryPlayBtn: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  soundscapesSection: {
    width: '100%',
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 10,
    paddingLeft: 4,
  },
  soundscapesScroll: {
    gap: 8,
    paddingRight: 20,
  },
  soundscapeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  soundscapeChipText: {
    fontSize: 12,
  },
});
