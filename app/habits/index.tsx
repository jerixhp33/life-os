import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius, shadows } from '../../src/theme/tokens';
import {
  fetchHabits,
  fetchTodayHabitLogs,
  logHabit,
  unlogHabit,
  archiveHabit,
  calculateStreak,
} from '../../src/features/habits/api';
import { useAuthStore } from '../../src/stores/authStore';
import { EmptyState, SkeletonCard } from '../../src/components/feedback';
import { AppBackground } from '../../src/components/layout/AppBackground';
import type { Habit } from '../../src/types';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const TIME_FILTERS = [
  { k: 'all', l: 'All Habits' },
  { k: 'morning', l: 'Morning' },
  { k: 'afternoon', l: 'Afternoon' },
  { k: 'evening', l: 'Evening' },
] as const;

export default function HabitsScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const uid = useAuthStore((s) => s.user?.id ?? s.profile?.id);

  const [timeFilter, setTimeFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');

  const { data: habits, isLoading, refetch } = useQuery({
    queryKey: ['habits', uid],
    queryFn: () => fetchHabits(uid!),
    enabled: Boolean(uid),
  });

  const { data: logs } = useQuery({
    queryKey: ['habit_logs', 'today', uid],
    queryFn: () => fetchTodayHabitLogs(uid!),
    enabled: Boolean(uid),
    refetchInterval: 60_000,
  });

  const logMut = useMutation({
    mutationFn: ({ hid }: { hid: string }) => logHabit(uid!, hid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habit_logs'] });
    },
  });

  const unlogMut = useMutation({
    mutationFn: (hid: string) => unlogHabit(uid!, hid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habit_logs'] });
    },
  });

  const archiveMut = useMutation({
    mutationFn: archiveHabit,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits'] });
    },
  });

  const tod = new Date().getDay();
  const allHabits = habits ?? [];
  const todayHabits = useMemo(
    () => allHabits.filter((h) => h.frequency === 'daily' || h.days_of_week.includes(tod)),
    [allHabits, tod]
  );

  const doneCount = todayHabits.filter((h) =>
    (logs ?? []).some((l) => l.habit_id === h.id && l.count >= h.target_count)
  ).length;

  const totalCount = todayHabits.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const realStreak = calculateStreak(logs ?? []);

  const filteredHabits = useMemo(() => {
    return todayHabits.filter((h) => {
      if (timeFilter === 'all') return true;
      return h.time_of_day === timeFilter;
    });
  }, [todayHabits, timeFilter]);

  const handleArchive = (h: Habit) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Archive Habit', `Archive "${h.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Archive', style: 'destructive', onPress: () => archiveMut.mutate(h.id) },
    ]);
  };

  const handleToggleHabit = (h: Habit, isComplete: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isComplete) {
      unlogMut.mutate(h.id);
    } else {
      logMut.mutate({ hid: h.id });
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      {/* 4K Blurred Organic U-Shape Wallpaper Background */}
      <AppBackground screenName="habits" />

      {/* ============================================================== */}
      {/* 1. TOP HEADER WITH GLOSSY "+ NEW HABIT" BUTTON                 */}
      {/* ============================================================== */}
      <Animated.View entering={FadeInDown.duration(400)} style={s.header}>
        <View style={{ flex: 1 }}>
          <View style={s.headerTagRow}>
            <View
              style={[
                s.headerBadge,
                {
                  backgroundColor: isDark ? 'rgba(244, 63, 94, 0.16)' : 'rgba(225, 29, 72, 0.10)',
                  borderColor: isDark ? 'rgba(244, 63, 94, 0.30)' : 'rgba(225, 29, 72, 0.20)',
                },
              ]}
            >
              <Ionicons name="repeat" size={11} color={isDark ? '#FB7185' : '#E11D48'} />
              <Text style={[s.headerBadgeText, { color: isDark ? '#FB7185' : '#E11D48' }]}>
                Routines & Consistency
              </Text>
            </View>
          </View>
          <Text style={[s.title, { color: theme.text.primary }]}>Daily Habits</Text>
          <Text style={[s.subtitle, { color: isDark ? '#819BB3' : '#64748B' }]}>
            Master daily micro-routines with momentum
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/habits/new');
          }}
          style={s.addBtnContainer}
          activeOpacity={0.85}
          accessibilityLabel="Add New Habit"
        >
          <LinearGradient
            colors={['#E11D48', '#FB7185']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.addBtnGradient}
          >
            <Ionicons name="add" size={19} color="#FFFFFF" />
            <Text style={s.addBtnText}>New Habit</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* ============================================================== */}
        {/* 2. FEATURED HERO PROGRESS BANNER                               */}
        {/* ============================================================== */}
        <Animated.View entering={FadeInUp.duration(400).delay(60)}>
          <LinearGradient
            colors={['#BE123C', '#E11D48', '#FB7185']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.heroBanner}
          >
            <View style={s.heroTopRow}>
              <View style={s.heroTag}>
                <Ionicons name="flame" size={13} color="#FFFFFF" />
                <Text style={s.heroTagText}>Active Momentum</Text>
              </View>
              <Text style={s.heroDateText}>{format(new Date(), 'EEEE, MMM d')}</Text>
            </View>

            <View style={s.heroBodyRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.heroHeadline}>
                  {pct === 100
                    ? 'All Habits Conquered!'
                    : pct >= 50
                    ? 'Momentum is Strong!'
                    : 'Kickstart Your Day!'}
                </Text>
                <Text style={s.heroSubtitle}>
                  {doneCount} of {totalCount} daily routines completed ({pct}%).
                </Text>
              </View>

              {/* Circular Percentage Pill */}
              <View style={s.heroPctCircle}>
                <Text style={s.heroPctNumber}>{pct}%</Text>
              </View>
            </View>

            {/* White Capsule Progress Bar */}
            <View style={s.heroProgressTrack}>
              <View style={[s.heroProgressFill, { width: `${Math.max(10, pct)}%` }]} />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ============================================================== */}
        {/* 3. THREE GLOSSY KPI CARDS                                      */}
        {/* ============================================================== */}
        <Animated.View entering={FadeInUp.duration(400).delay(100)} style={s.kpiRow}>
          {/* Card 1: Today's Target */}
          <View
            style={[
              s.kpiCard,
              {
                backgroundColor: isDark ? 'rgba(10, 36, 56, 0.85)' : 'rgba(255, 255, 255, 0.88)',
                borderColor: isDark ? 'rgba(168, 220, 244, 0.28)' : 'rgba(255, 255, 255, 0.95)',
                ...shadows.sm,
              },
            ]}
          >
            <View style={[s.kpiIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.18)' }]}>
              <Ionicons name="disc-outline" size={17} color="#0284C7" />
            </View>
            <Text style={[s.kpiNumber, { color: theme.text.primary }]}>{totalCount}</Text>
            <Text style={[s.kpiLabel, { color: isDark ? '#819BB3' : '#64748B' }]}>Targets</Text>
          </View>

          {/* Card 2: Completed */}
          <View
            style={[
              s.kpiCard,
              {
                backgroundColor: isDark ? 'rgba(10, 36, 56, 0.85)' : 'rgba(255, 255, 255, 0.88)',
                borderColor: isDark ? 'rgba(168, 220, 244, 0.28)' : 'rgba(255, 255, 255, 0.95)',
                ...shadows.sm,
              },
            ]}
          >
            <View style={[s.kpiIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.18)' }]}>
              <Ionicons name="checkmark-done" size={17} color="#10B981" />
            </View>
            <Text style={[s.kpiNumber, { color: '#10B981' }]}>{doneCount}</Text>
            <Text style={[s.kpiLabel, { color: isDark ? '#819BB3' : '#64748B' }]}>Done</Text>
          </View>

          {/* Card 3: Best Streak */}
          <View
            style={[
              s.kpiCard,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.88)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.95)',
                ...shadows.sm,
              },
            ]}
          >
            <View style={[s.kpiIconBox, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.18)' : 'rgba(224, 242, 254, 0.95)' }]}>
              <Ionicons name="flame" size={17} color="#38BDF8" />
            </View>
            <Text style={[s.kpiNumber, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
              {`${realStreak}d`}
            </Text>
            <Text style={[s.kpiLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>Streak</Text>
          </View>
        </Animated.View>

        {/* ============================================================== */}
        {/* 4. SEGMENTED FILTER PILL BAR                                    */}
        {/* ============================================================== */}
        <Animated.View entering={FadeInUp.duration(400).delay(140)}>
          <View
            style={[
              s.segmentBar,
              {
                backgroundColor: isDark ? 'rgba(10, 36, 56, 0.82)' : 'rgba(226, 232, 240, 0.65)',
                borderColor: isDark ? 'rgba(168, 220, 244, 0.25)' : 'rgba(255, 255, 255, 0.95)',
              },
            ]}
          >
            {TIME_FILTERS.map((tf) => {
              const isSelected = timeFilter === tf.k;
              return (
                <TouchableOpacity
                  key={tf.k}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setTimeFilter(tf.k);
                  }}
                  activeOpacity={0.8}
                  style={[
                    s.segmentBtn,
                    isSelected && [
                      s.segmentBtnActive,
                      {
                        backgroundColor: isDark ? '#E11D48' : '#FFFFFF',
                        ...shadows.sm,
                      },
                    ],
                  ]}
                >
                  <Text
                    style={[
                      s.segmentBtnText,
                      {
                        color: isSelected
                          ? isDark
                            ? '#FFFFFF'
                            : '#0F172A'
                          : isDark
                          ? '#819BB3'
                          : '#64748B',
                        fontWeight: isSelected ? fontWeight.bold : fontWeight.medium,
                      },
                    ]}
                  >
                    {tf.l}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* ============================================================== */}
        {/* 5. HABITS LIST                                                 */}
        {/* ============================================================== */}
        <View style={s.habitsList}>
          {isLoading ? (
            [1, 2, 3].map((i) => <SkeletonCard key={i} />)
          ) : !filteredHabits.length ? (
            <EmptyState
              icon="repeat-outline"
              title="No routines scheduled"
              description="Build consistent daily habits to achieve your long term goals."
              actionLabel="+ New Routine"
              onAction={() => router.push('/habits/new')}
            />
          ) : (
            filteredHabits.map((h, index) => {
              const isComplete = (logs ?? []).some(
                (l) => l.habit_id === h.id && l.count >= h.target_count
              );

              return (
                <Animated.View key={h.id} entering={FadeInUp.duration(380).delay(index * 30)}>
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={() => router.push(`/habits/${h.id}` as never)}
                    onLongPress={() => handleArchive(h)}
                    style={[
                      s.habitCard,
                      {
                        backgroundColor: isDark ? 'rgba(10, 36, 56, 0.88)' : 'rgba(255, 255, 255, 0.92)',
                        borderColor: isComplete
                          ? h.color
                          : isDark
                          ? 'rgba(168, 220, 244, 0.28)'
                          : 'rgba(255, 255, 255, 0.95)',
                        ...shadows.sm,
                      },
                    ]}
                  >
                    {/* Circular Ripple Checkbox */}
                    <TouchableOpacity
                      onPress={() => handleToggleHabit(h, isComplete)}
                      style={[
                        s.habitCheckbox,
                        {
                          borderColor: isComplete ? h.color : isDark ? 'rgba(255, 255, 255, 0.35)' : '#CBD5E1',
                          backgroundColor: isComplete ? h.color : 'transparent',
                        },
                      ]}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityRole="checkbox"
                    >
                      {isComplete && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                    </TouchableOpacity>

                    {/* Body */}
                    <View style={s.habitBody}>
                      <Text
                        style={[
                          s.habitTitle,
                          {
                            color: isComplete
                              ? isDark
                                ? '#64748B'
                                : '#94A3B8'
                              : theme.text.primary,
                            textDecorationLine: isComplete ? 'line-through' : 'none',
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {h.title}
                      </Text>

                      {/* Weekday dots & Time of day */}
                      <View style={s.habitMetaRow}>
                        <View style={s.dotsContainer}>
                          {WEEKDAYS.map((d, i) => {
                            const isSched = h.days_of_week.includes(i);
                            const isCurrent = i === tod;
                            return (
                              <View
                                key={i}
                                style={[
                                  s.dayDot,
                                  {
                                    backgroundColor: isSched ? h.color : isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
                                    borderWidth: isCurrent ? 1 : 0,
                                    borderColor: h.color,
                                  },
                                ]}
                              />
                            );
                          })}
                        </View>

                        <View style={[s.timeChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)' }]}>
                          <Text style={[s.timeChipText, { color: isDark ? '#819BB3' : '#64748B' }]}>
                            {h.time_of_day.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Ionicons name="chevron-forward" size={16} color={isDark ? '#819BB3' : '#94A3B8'} />
                  </TouchableOpacity>
                </Animated.View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  ambientGlowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 380,
    overflow: 'hidden',
  },
  ambientGlow: { width: '100%', height: '100%' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
  },
  headerTagRow: { flexDirection: 'row', marginBottom: 4 },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  headerBadgeText: { fontSize: 10, fontWeight: fontWeight.bold, letterSpacing: 0.3 },
  title: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, letterSpacing: -0.4 },
  subtitle: { fontSize: fontSize.xs, marginTop: 2, fontWeight: fontWeight.medium },
  addBtnContainer: { borderRadius: radius.full, overflow: 'hidden', ...shadows.sm },
  addBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.full,
  },
  addBtnText: { color: '#FFFFFF', fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  scrollContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[1],
    paddingBottom: 130, // Safe clearance for bottom dock
    gap: spacing[3],
  },
  heroBanner: {
    borderRadius: 22,
    padding: spacing[4],
    gap: 10,
    ...shadows.md,
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  heroTagText: { color: '#FFFFFF', fontSize: 10, fontWeight: fontWeight.bold },
  heroDateText: { color: 'rgba(255, 255, 255, 0.85)', fontSize: 11, fontWeight: fontWeight.medium },
  heroBodyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroHeadline: { color: '#FFFFFF', fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  heroSubtitle: { color: 'rgba(255, 255, 255, 0.85)', fontSize: 11, marginTop: 2 },
  heroPctCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPctNumber: { color: '#FFFFFF', fontSize: 14, fontWeight: fontWeight.bold },
  heroProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
  },
  heroProgressFill: { height: '100%', backgroundColor: '#FFFFFF', borderRadius: 3 },
  kpiRow: { flexDirection: 'row', gap: 8 },
  kpiCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1.2,
  },
  kpiIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  kpiNumber: { fontSize: 16, fontWeight: fontWeight.bold, letterSpacing: -0.2 },
  kpiLabel: { fontSize: 10, fontWeight: fontWeight.medium, marginTop: 1 },
  segmentBar: { flexDirection: 'row', padding: 4, borderRadius: radius.full, borderWidth: 1 },
  segmentBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  segmentBtnActive: { borderRadius: radius.full },
  segmentBtnText: { fontSize: 11 },
  habitsList: { gap: 8, marginTop: 2 },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing[3] + 2,
    borderRadius: 18,
    borderWidth: 1.2,
  },
  habitCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitBody: { flex: 1, gap: 4 },
  habitTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  habitMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dotsContainer: { flexDirection: 'row', gap: 3 },
  dayDot: { width: 7, height: 7, borderRadius: 3.5 },
  timeChip: { paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: radius.full },
  timeChipText: { fontSize: 9, fontWeight: fontWeight.bold },
});
