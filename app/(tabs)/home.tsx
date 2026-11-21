import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius, shadows } from '../../src/theme/tokens';
import { useTodayTasks, useCompleteTask } from '../../src/features/tasks/hooks';
import { useUpcomingEvents } from '../../src/features/calendar/hooks';
import { useAuthStore, isCleanAvatarUrl } from '../../src/stores/authStore';
import { Card, TouchableCard } from '../../src/components/ui/Card';
import { SkeletonCard, EmptyState } from '../../src/components/feedback';

const AVATAR_CACHE_KEY = 'lifeos_cached_avatar_url';

const PC: Record<string, { color: string; bg: string; label: string }> = {
  urgent: { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)', label: 'Urgent' },
  high:   { color: '#F97316', bg: 'rgba(249, 115, 22, 0.15)', label: 'High' },
  medium: { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)', label: 'Med' },
  low:    { color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)', label: 'Low' },
};

const EC: Record<string, string> = {
  violet: '#0284C7',
  blue: '#38BDF8',
  green: '#10B981',
  yellow: '#F59E0B',
  red: '#EF4444',
  pink: '#EC4899',
  orange: '#F97316',
};

const QA: Array<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  bg: string;
  color: string;
  route: string;
}> = [
  { icon: 'checkbox-outline', label: 'Tasks', bg: 'rgba(56, 189, 248, 0.16)', color: '#38BDF8', route: '/tasks' },
  { icon: 'document-text-outline', label: 'Notes', bg: 'rgba(16, 185, 129, 0.16)', color: '#10B981', route: '/notes' },
  { icon: 'wallet-outline', label: 'Finance', bg: 'rgba(245, 158, 11, 0.16)', color: '#F59E0B', route: '/finance' },
  { icon: 'sparkles', label: 'AI', bg: 'rgba(168, 220, 244, 0.20)', color: '#38BDF8', route: '/ai/chat' },
];

export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const profile = useAuthStore((s) => s.profile);
  const [cachedAvatar, setCachedAvatar] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(AVATAR_CACHE_KEY).then((stored) => {
      if (isCleanAvatarUrl(stored)) {
        setCachedAvatar(stored);
      }
    }).catch(() => {});
  }, []);

  const rawAvatar = profile?.avatar_url || cachedAvatar;
  const activeAvatar = isCleanAvatarUrl(rawAvatar) ? rawAvatar : null;

  const { data: tasks, isLoading: tl } = useTodayTasks();
  const { data: events, isLoading: el } = useUpcomingEvents(4);
  const complete = useCompleteTask();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await qc.invalidateQueries();
  }, [qc]);

  const completedCount = (tasks ?? []).filter((t) => t.status === 'completed').length;
  const totalCount = tasks?.length ?? 0;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg.primary }]} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={theme.brand.primary} />}
      >
        {/* Header with Avatar and Greeting */}
        <Animated.View entering={FadeInDown.duration(400)} style={s.header}>
          <View style={{ flex: 1 }}>
            <View style={[s.pillBadge, {
              backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(2, 132, 199, 0.10)',
              borderColor: isDark ? 'rgba(168, 220, 244, 0.28)' : 'rgba(2, 132, 199, 0.25)',
            }]}>
              <View style={[s.pillDot, { backgroundColor: theme.brand.primary }]} />
              <Text style={[s.pillText, { color: theme.brand.primary }]}>LifeOS Cloud Active</Text>
            </View>
            <Text style={[s.greeting, { color: theme.text.secondary }]}>{greeting},</Text>
            <Text style={[s.name, { color: theme.text.primary }]}>{profile?.full_name?.split(' ')[0] ?? 'Manikandan'}</Text>
            <Text style={[s.date, { color: theme.text.tertiary }]}>{format(new Date(), 'EEEE, MMMM d')}</Text>
          </View>

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/settings/profile');
            }}
            style={s.avatarWrap}
            activeOpacity={0.8}
            accessibilityLabel="Open profile settings"
          >
            <View style={[s.avatar, {
              backgroundColor: isDark ? 'rgba(10, 36, 56, 0.9)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(168, 220, 244, 0.40)' : 'rgba(2, 132, 199, 0.35)',
            }]}>
              {activeAvatar ? (
                <Image
                  source={{ uri: activeAvatar }}
                  style={s.avatarImg}
                  onError={() => setCachedAvatar(null)}
                />
              ) : (
                <Text style={[s.avatarText, { color: theme.brand.primary }]}>
                  {profile?.full_name?.[0]?.toUpperCase() ?? 'M'}
                </Text>
              )}
            </View>
            <View style={s.onlineBadge}>
              <View style={[s.onlineDot, { backgroundColor: '#10B981' }]} />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Daily Focus Summary Card */}
        {totalCount > 0 && (
          <Animated.View entering={FadeInUp.duration(400).delay(60)}>
            <Card style={s.focusCard}>
              <View style={s.focusHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.focusLabel, { color: theme.text.secondary }]}>Today's Focus</Text>
                  <Text style={[s.focusTitle, { color: theme.text.primary }]}>
                    {completedCount} of {totalCount} tasks completed
                  </Text>
                </View>
                <View style={[s.pctBadge, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(2, 132, 199, 0.12)' }]}>
                  <Text style={[s.pctText, { color: theme.brand.primary }]}>{progressPct}%</Text>
                </View>
              </View>

              <View style={[s.progressBarBg, { backgroundColor: theme.surface.inset }]}>
                <View style={[s.progressBarFill, { width: `${progressPct}%`, backgroundColor: theme.brand.primary }]} />
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Quick Actions (Apple Frosted Vector Pills - strictly no emojis) */}
        <Animated.View entering={FadeInUp.duration(400).delay(100)} style={s.qa}>
          {QA.map((a) => (
            <TouchableOpacity
              key={a.label}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(a.route as never);
              }}
              activeOpacity={0.75}
              style={[
                s.qaItem,
                {
                  backgroundColor: isDark ? 'rgba(10, 36, 56, 0.88)' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(168, 220, 244, 0.22)' : 'rgba(15, 23, 42, 0.08)',
                  ...shadows.sm,
                },
              ]}
              accessibilityRole="button"
            >
              <View style={[s.qaIconBox, { backgroundColor: a.bg }]}>
                <Ionicons name={a.icon} size={22} color={a.color} />
              </View>
              <Text style={[s.qaLabel, { color: theme.text.primary }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Today's Tasks Section */}
        <SH title="Today's Tasks" icon="checkbox-outline" count={tasks?.length} onMore={() => router.push('/tasks')} />
        {tl ? (
          [1, 2].map((i) => <SkeletonCard key={i} />)
        ) : !tasks?.length ? (
          <EmptyState
            icon="checkbox-outline"
            title="All caught up!"
            description="Nothing pending due today. Enjoy your time or plan ahead."
            actionLabel="Add a Task"
            onAction={() => router.push('/(tabs)/create')}
          />
        ) : (
          tasks.map((t, index) => {
            const pInfo = PC[t.priority] ?? PC.medium;
            const isDone = t.status === 'completed';
            return (
              <TouchableCard
                key={t.id}
                index={index}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/tasks/${t.id}` as never);
                }}
                style={s.taskCard}
              >
                <View style={s.taskRow}>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      complete.mutate(t.id);
                    }}
                    style={[
                      s.check,
                      {
                        borderColor: isDone ? '#10B981' : pInfo.color,
                        backgroundColor: isDone ? '#10B981' : 'transparent',
                      },
                    ]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isDone }}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    {isDone && <Ionicons name="checkmark" size={14} color="#ffffff" />}
                  </TouchableOpacity>

                  <View style={s.taskBody}>
                    <Text style={[s.taskTitle, { color: theme.text.primary }, isDone && s.strike]} numberOfLines={1}>
                      {t.title}
                    </Text>
                    {t.due_date && (
                      <Text style={[s.taskMeta, { color: theme.text.tertiary }]}>
                        {format(new Date(t.due_date), 'MMM d')}
                        {t.due_time && ` · ${t.due_time}`}
                      </Text>
                    )}
                  </View>

                  <View style={[s.priorityBadge, { backgroundColor: pInfo.bg }]}>
                    <Text style={[s.priorityText, { color: pInfo.color }]}>{pInfo.label}</Text>
                  </View>
                </View>
              </TouchableCard>
            );
          })
        )}

        {/* Coming Up Section */}
        <SH title="Coming Up" icon="calendar-outline" count={events?.length} onMore={() => router.push('/(tabs)/calendar')} />
        {el ? (
          <SkeletonCard />
        ) : !events?.length ? (
          <EmptyState
            icon="calendar-outline"
            title="No Upcoming Events"
            description="Your schedule is clear. Tap + to add an event."
            actionLabel="Add Event"
            onAction={() => router.push('/(tabs)/create')}
          />
        ) : (
          events.map((e, index) => {
            const barColor = EC[e.color] ?? theme.brand.primary;
            return (
              <TouchableCard
                key={e.id}
                index={index}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/calendar/${e.id}` as never);
                }}
                style={s.evCard}
              >
                <View style={[s.evAccent, { backgroundColor: barColor }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.evTitle, { color: theme.text.primary }]} numberOfLines={1}>
                    {e.title}
                  </Text>
                  <Text style={[s.evTime, { color: theme.text.tertiary }]}>
                    {e.all_day ? format(new Date(e.start_at), 'MMM d') : `${format(new Date(e.start_at), 'MMM d · h:mm a')}`}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.text.tertiary} />
              </TouchableCard>
            );
          })
        )}

        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SH({
  title,
  icon,
  count,
  onMore,
}: {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  count?: number;
  onMore: () => void;
}) {
  const { theme, isDark } = useTheme();
  return (
    <View style={sh.row}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {icon && (
          <View style={[sh.iconCircle, {
            backgroundColor: isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(2, 132, 199, 0.12)',
            borderColor: isDark ? 'rgba(168, 220, 244, 0.25)' : 'transparent',
          }]}>
            <Ionicons name={icon} size={15} color={theme.brand.primary} />
          </View>
        )}
        <Text style={[sh.title, { color: theme.text.primary }]}>
          {title}
          {count != null && count > 0 && <Text style={{ color: theme.text.tertiary, fontWeight: '500' }}> ({count})</Text>}
        </Text>
      </View>
      <TouchableOpacity onPress={onMore} activeOpacity={0.7}>
        <Text style={{ color: theme.brand.primary, fontSize: fontSize.sm, fontWeight: fontWeight.semibold }}>
          See all
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const sh = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[6],
    marginBottom: spacing[3],
    paddingHorizontal: spacing[1],
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  title: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
});

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: spacing[5], paddingBottom: 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing[4] },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: spacing[2],
  },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
  greeting: { fontSize: fontSize.base, fontWeight: fontWeight.medium },
  name: { fontSize: fontSize['3xl'], fontWeight: fontWeight.bold, lineHeight: 38 },
  date: { fontSize: fontSize.sm, marginTop: spacing[1] },
  avatarWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  onlineBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#071524',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: { width: 10, height: 10, borderRadius: 5 },
  focusCard: { marginBottom: spacing[4] },
  focusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[3] },
  focusLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.5 },
  focusTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, marginTop: 2 },
  pctBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  pctText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  progressBarBg: { height: 7, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  qa: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing[2], marginBottom: spacing[4] },
  qaItem: {
    flex: 1,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[1],
    borderRadius: 18,
    borderWidth: 1.2,
    alignItems: 'center',
    gap: spacing[2],
  },
  qaIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  taskCard: { marginBottom: spacing[2] },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  taskBody: { flex: 1 },
  taskTitle: { fontSize: fontSize.base, fontWeight: fontWeight.medium },
  taskMeta: { fontSize: fontSize.xs, marginTop: 2 },
  strike: { textDecorationLine: 'line-through', opacity: 0.5 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  priorityText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  evCard: { marginBottom: spacing[2], flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  evAccent: { width: 4, height: 38, borderRadius: 2 },
  evTitle: { fontSize: fontSize.base, fontWeight: fontWeight.medium },
  evTime: { fontSize: fontSize.xs, marginTop: 2 },
});
