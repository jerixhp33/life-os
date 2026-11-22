import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius, shadows } from '../../src/theme/tokens';
import { useTodayTasks, useCompleteTask } from '../../src/features/tasks/hooks';
import { useUpcomingEvents } from '../../src/features/calendar/hooks';
import { useHabits, useTodayHabitLogs } from '../../src/features/habits/hooks';
import { calculateStreak } from '../../src/features/habits/api';
import { useAuthStore, isCleanAvatarUrl } from '../../src/stores/authStore';
import { Card, TouchableCard } from '../../src/components/ui/Card';
import { SkeletonCard, EmptyState } from '../../src/components/feedback';
import { OmniCaptureBar } from '../../src/components/intelligence/OmniCaptureBar';
import { DailyBriefCard } from '../../src/components/intelligence/DailyBriefCard';
import { SmartActionPills } from '../../src/components/intelligence/SmartActionPills';
import { VoiceAssistantModal } from '../../src/components/intelligence/VoiceAssistantModal';
import { NotificationCenterModal } from '../../src/components/notifications/NotificationCenterModal';
import { useNotificationStore } from '../../src/stores/notificationStore';
import {
  evaluateGreetingState,
  WISDOM_SNIPPETS,
} from '../../src/lib/intelligence/greetingEngine';
import { AppBackground } from '../../src/components/layout/AppBackground';

const AVATAR_CACHE_KEY = 'lifeos_cached_avatar_url';

const QA: Array<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  bg: string;
  color: string;
  route: string;
}> = [
  { icon: 'document-text-outline', label: 'Notes', bg: 'rgba(16, 185, 129, 0.16)', color: '#10B981', route: '/notes' },
  { icon: 'wallet-outline', label: 'Finance', bg: 'rgba(245, 158, 11, 0.16)', color: '#F59E0B', route: '/finance' },
  { icon: 'repeat-outline', label: 'Habits', bg: 'rgba(236, 72, 153, 0.16)', color: '#EC4899', route: '/habits' },
  { icon: 'sparkles', label: 'AI Assistant', bg: 'rgba(129, 140, 248, 0.20)', color: '#6366F1', route: '/ai/chat' },
];

const EC: Record<string, string> = {
  violet: '#6366F1',
  blue:   '#38BDF8',
  green:  '#10B981',
  yellow: '#F59E0B',
  red:    '#EF4444',
  pink:   '#EC4899',
  orange: '#F97316',
};

export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const profile = useAuthStore((s) => s.profile);
  const [cachedAvatar, setCachedAvatar] = useState<string | null>(null);
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [wisdomToast, setWisdomToast] = useState<string | null>(null);

  const unreadNotifCount = useNotificationStore((s) => s.unreadCount);

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
  const { data: events, isLoading: el } = useUpcomingEvents(3);
  const { data: habits } = useHabits();
  const { data: habitLogs } = useTodayHabitLogs();
  const complete = useCompleteTask();

  const rawName = profile?.full_name?.trim();
  const emailName = profile?.email ? profile.email.split('@')[0] : '';
  const firstName = rawName ? rawName.split(' ')[0] : emailName || 'There';

  const greetingState = useMemo(() => {
    return evaluateGreetingState(
      firstName,
      tasks ?? [],
      events ?? [],
      habits ?? [],
      habitLogs ?? []
    );
  }, [firstName, tasks, events, habits, habitLogs]);

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await qc.invalidateQueries();
  }, [qc]);

  const completedCount = (tasks ?? []).filter((t) => t.status === 'completed').length;
  const totalCount = tasks?.length ?? 0;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Real Focus Time: Each completed task represents actual productive focus time (25m session)
  const focusMinutes = completedCount * 25;
  const focusHours = Math.floor(focusMinutes / 60);
  const focusRem = focusMinutes % 60;
  const focusDisplay = focusMinutes === 0 ? '0m' : focusHours > 0 ? `${focusHours}h ${focusRem}m` : `${focusRem}m`;

  // Real Day Streak calculated strictly from actual habit logs
  const dayStreak = habits?.length ? calculateStreak(habitLogs ?? []) : 0;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      {/* 4K Blurred Organic U-Shape Wallpaper Background */}
      <AppBackground screenName="home" />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={theme.brand.primary} />}
      >
        {/* ============================================================== */}
        {/* 1. TOP HEADER WITH GREETING, ACTIONS & GLOWING AVATAR           */}
        {/* ============================================================== */}
        <Animated.View entering={FadeInDown.duration(420)} style={s.header}>
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const next = WISDOM_SNIPPETS[Math.floor(Math.random() * WISDOM_SNIPPETS.length)];
                setWisdomToast(next);
              }}
              activeOpacity={0.8}
              style={s.brandHeaderRow}
            >
              <Image
                source={require('../../assets/logo.png')}
                style={s.headerAppLogo}
                resizeMode="contain"
              />
              <Text style={[s.greetingSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                {greetingState.greetingText}
              </Text>
            </TouchableOpacity>
            <View style={s.nameGreetingRow}>
              <Text style={[s.nameTitle, { color: theme.text.primary }]}>
                Hello, {firstName} 👋
              </Text>
            </View>
            <Text style={[s.mottoText, { color: isDark ? '#819BB3' : '#64748B' }]} numberOfLines={2}>
              {wisdomToast || greetingState.contextualSubtitle}
            </Text>
          </View>

          {/* Right Header: Glass Buttons & Glowing Avatar Frame */}
          <View style={s.headerRight}>
            <View style={s.headerTopButtons}>
              {/* Search Glass Button */}
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push('/search');
                }}
                style={[
                  s.topGlassBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.85)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(15, 23, 42, 0.08)',
                  },
                ]}
                activeOpacity={0.8}
                accessibilityLabel="Search"
              >
                <Ionicons name="search-outline" size={17} color={theme.text.primary} />
              </TouchableOpacity>

              {/* Voice Copilot Glass Button */}
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  setVoiceModalVisible(true);
                }}
                style={[
                  s.topGlassBtn,
                  {
                    backgroundColor: isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(2, 132, 199, 0.1)',
                    borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(2, 132, 199, 0.2)',
                  },
                ]}
                activeOpacity={0.8}
                accessibilityLabel="Voice Copilot"
              >
                <Ionicons name="mic" size={17} color={isDark ? '#38BDF8' : '#0284C7'} />
              </TouchableOpacity>

              {/* Notification Glass Button with unread dot */}
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  setNotifModalVisible(true);
                }}
                style={[
                  s.topGlassBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.85)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(15, 23, 42, 0.08)',
                  },
                ]}
                activeOpacity={0.8}
                accessibilityLabel="Notifications"
              >
                <Ionicons name="notifications-outline" size={17} color={theme.text.primary} />
                {unreadNotifCount > 0 && <View style={s.notifDot} />}
              </TouchableOpacity>
            </View>

            {/* Glowing Avatar Frame with Soft Purple Aura */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/settings/profile');
              }}
              style={s.avatarWrapper}
              activeOpacity={0.85}
              accessibilityLabel="Open profile settings"
            >
              {/* Soft purple/indigo circular glow aura */}
              <LinearGradient
                colors={['#818CF8', '#C084FC', 'transparent']}
                start={{ x: 0.2, y: 0.2 }}
                end={{ x: 0.9, y: 0.9 }}
                style={s.avatarGlowAura}
              />

              <View
                style={[
                  s.avatarInner,
                  {
                    backgroundColor: isDark ? 'rgba(10, 36, 56, 0.95)' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(168, 220, 244, 0.45)' : 'rgba(255, 255, 255, 0.95)',
                  },
                ]}
              >
                {activeAvatar ? (
                  <Image
                    source={{ uri: activeAvatar }}
                    style={s.avatarImg}
                    onError={() => setCachedAvatar(null)}
                  />
                ) : (
                  <View style={[s.avatarPlaceholder, { backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF' }]}>
                    <Text style={s.avatarLetter}>{firstName[0]?.toUpperCase() ?? 'A'}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ============================================================== */}
        {/* 1.5. CONTEXT-AWARE PREDICTIVE ACTION PILLS                     */}
        {/* ============================================================== */}
        <Animated.View entering={FadeInUp.duration(400).delay(50)} style={{ marginBottom: 12 }}>
          <SmartActionPills />
        </Animated.View>

        {/* ============================================================== */}
        {/* 2. 3 GLOSSY WHITE TRANSPARENT KPI CARDS                         */}
        {/* ============================================================== */}
        <Animated.View entering={FadeInUp.duration(420).delay(80)} style={s.kpiRow}>
          {/* Card 1: Tasks Done */}
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              router.push('/tasks');
            }}
            activeOpacity={0.8}
            style={[
              s.kpiCard,
              {
                backgroundColor: isDark ? 'rgba(10, 36, 56, 0.85)' : 'rgba(255, 255, 255, 0.88)',
                borderColor: isDark ? 'rgba(168, 220, 244, 0.28)' : 'rgba(255, 255, 255, 0.95)',
                ...shadows.sm,
              },
            ]}
          >
            <View style={[s.kpiIconBox, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.20)' : 'rgba(238, 242, 255, 0.95)' }]}>
              <Ionicons name="bar-chart-outline" size={18} color="#6366F1" />
            </View>
            <Text style={[s.kpiNumber, { color: theme.text.primary }]}>
              {completedCount}
            </Text>
            <Text style={[s.kpiLabel, { color: isDark ? '#819BB3' : '#64748B' }]}>
              Tasks Done
            </Text>
          </TouchableOpacity>

          {/* Card 2: Focus Time */}
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              router.push('/habits');
            }}
            activeOpacity={0.8}
            style={[
              s.kpiCard,
              {
                backgroundColor: isDark ? 'rgba(10, 36, 56, 0.85)' : 'rgba(255, 255, 255, 0.88)',
                borderColor: isDark ? 'rgba(168, 220, 244, 0.28)' : 'rgba(255, 255, 255, 0.95)',
                ...shadows.sm,
              },
            ]}
          >
            <View style={[s.kpiIconBox, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.20)' : 'rgba(240, 249, 255, 0.95)' }]}>
              <Ionicons name="time-outline" size={18} color="#0284C7" />
            </View>
            <Text style={[s.kpiNumber, { color: theme.text.primary, fontSize: 18 }]}>
              {focusDisplay}
            </Text>
            <Text style={[s.kpiLabel, { color: isDark ? '#819BB3' : '#64748B' }]}>
              Focus Time
            </Text>
          </TouchableOpacity>

          {/* Card 3: Day Streak */}
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              router.push('/habits');
            }}
            activeOpacity={0.8}
            style={[
              s.kpiCard,
              {
                backgroundColor: isDark ? 'rgba(10, 36, 56, 0.85)' : 'rgba(255, 255, 255, 0.88)',
                borderColor: isDark ? 'rgba(168, 220, 244, 0.28)' : 'rgba(255, 255, 255, 0.95)',
                ...shadows.sm,
              },
            ]}
          >
            <View style={[s.kpiIconBox, { backgroundColor: isDark ? 'rgba(249, 115, 22, 0.20)' : 'rgba(255, 247, 237, 0.95)' }]}>
              <Ionicons name="flame" size={18} color="#EA580C" />
            </View>
            <Text style={[s.kpiNumber, { color: theme.text.primary }]}>{dayStreak}</Text>
            <Text style={[s.kpiLabel, { color: isDark ? '#819BB3' : '#64748B' }]}>
              Day Streak
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ============================================================== */}
        {/* 2.5 OMNI CAPTURE INTELLIGENCE BAR                              */}
        {/* ============================================================== */}
        <Animated.View entering={FadeInUp.duration(420).delay(110)} style={{ paddingHorizontal: spacing[5], marginTop: spacing[3] }}>
          <OmniCaptureBar onSuccess={() => qc.invalidateQueries()} />
        </Animated.View>

        {/* ============================================================== */}
        {/* 2.6 AUTONOMOUS DAILY BRIEF CARD                                */}
        {/* ============================================================== */}
        <Animated.View entering={FadeInUp.duration(420).delay(130)} style={{ paddingHorizontal: spacing[5], marginTop: spacing[3] }}>
          <DailyBriefCard />
        </Animated.View>

        {/* ============================================================== */}
        {/* 3. FEATURED GOAL / MOTIVATION BANNER ("KEEP GOING!")           */}
        {/* ============================================================== */}
        <Animated.View entering={FadeInUp.duration(420).delay(150)} style={s.bannerWrap}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/goals');
            }}
          >
            <LinearGradient
              colors={['#4338CA', '#4F46E5', '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.goalBanner}
            >
              {/* Subtle glowing mountain aura backdrop */}
              <View style={s.goalMountainAura} />

              <View style={s.goalHeaderRow}>
                <View style={s.goalTag}>
                  <Ionicons name="disc-outline" size={14} color="#FFFFFF" />
                  <Text style={s.goalTagText}>Today's Goal</Text>
                </View>

                {/* Circular white button with arrow */}
                <View style={s.goalArrowCircle}>
                  <Ionicons name="chevron-forward" size={16} color="#4338CA" />
                </View>
              </View>

              <Text style={s.goalHeadline}>
                {totalCount === 0
                  ? 'Plan Your Day'
                  : completedCount === totalCount
                  ? 'All Done!'
                  : progressPct >= 50
                  ? 'Keep Going!'
                  : 'Start Strong!'}
              </Text>
              <Text style={s.goalSubtitle}>
                {totalCount === 0
                  ? 'Add your first task for today to track your progress.'
                  : completedCount === totalCount
                  ? 'All tasks for today completed! Excellent work.'
                  : `You've completed ${completedCount} of ${totalCount} tasks (${progressPct}%).`}
              </Text>

              {/* White pill progress bar */}
              <View style={s.goalProgressRow}>
                <View style={s.goalProgressTrack}>
                  <View style={[s.goalProgressFill, { width: `${progressPct}%` }]} />
                </View>
                <Text style={s.goalPctText}>{progressPct}%</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* ============================================================== */}
        {/* 4. "MY TASKS" SECTION WITH GLOSSY WHITE CARDS                   */}
        {/* ============================================================== */}
        <View style={s.secHeaderRow}>
          <Text style={[s.secTitle, { color: theme.text.primary }]}>My Tasks</Text>
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              router.push('/tasks');
            }}
            activeOpacity={0.7}
            style={s.seeAllBtn}
          >
            <Text style={s.seeAllText}>See All</Text>
            <Ionicons name="chevron-forward" size={14} color="#6366F1" />
          </TouchableOpacity>
        </View>

        {tl ? (
          [1, 2, 3].map((i) => <SkeletonCard key={i} />)
        ) : !tasks?.length ? (
          <EmptyState
            icon="checkbox-outline"
            title="All caught up!"
            description="Nothing pending due today. Enjoy your day or add a new task."
            actionLabel="Add a Task"
            onAction={() => router.push('/(tabs)/create')}
            style={{ paddingVertical: spacing[6] }}
          />
        ) : (
          <View style={s.taskList}>
            {tasks.slice(0, 4).map((t, index) => {
              const isDone = t.status === 'completed';
              return (
                <Animated.View
                  key={t.id}
                  entering={FadeInUp.duration(380).delay(180 + index * 40)}
                >
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/tasks/${t.id}` as never);
                    }}
                    activeOpacity={0.8}
                    style={[
                      s.myTaskCard,
                      {
                        backgroundColor: isDark
                          ? 'rgba(10, 36, 56, 0.82)'
                          : 'rgba(255, 255, 255, 0.88)',
                        borderColor: isDark
                          ? 'rgba(168, 220, 244, 0.24)'
                          : 'rgba(255, 255, 255, 0.95)',
                        ...shadows.sm,
                      },
                    ]}
                  >
                    {/* Checkbox: Filled indigo circle if done, clean ring if pending */}
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        complete.mutate(t.id);
                      }}
                      style={[
                        s.taskCheckCircle,
                        isDone
                          ? s.taskCheckCircleDone
                          : { borderColor: isDark ? '#475569' : '#CBD5E1' },
                      ]}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isDone }}
                    >
                      {isDone && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                    </TouchableOpacity>

                    {/* Task Title & Time Meta */}
                    <View style={s.taskBody}>
                      <Text
                        style={[
                          s.taskTitle,
                          { color: theme.text.primary },
                          isDone && s.strikeText,
                        ]}
                        numberOfLines={1}
                      >
                        {t.title}
                      </Text>
                      <Text style={[s.taskMeta, { color: isDark ? '#819BB3' : '#94A3B8' }]}>
                        {t.due_time ? `Today, ${t.due_time}` : t.due_date ? `Due ${format(new Date(t.due_date), 'MMM d')}` : 'Today'}
                      </Text>
                    </View>

                    {/* Three-dots Menu Icon */}
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.selectionAsync();
                        router.push(`/tasks/${t.id}` as never);
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={s.taskDots}
                    >
                      <Ionicons
                        name="ellipsis-vertical"
                        size={17}
                        color={isDark ? '#819BB3' : '#94A3B8'}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* ============================================================== */}
        {/* 5. QUICK MODULE PILLS (NOTES, FINANCE, HABITS, AI)             */}
        {/* ============================================================== */}
        <Animated.View entering={FadeInUp.duration(400).delay(260)} style={s.qa}>
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
                  backgroundColor: isDark ? 'rgba(10, 36, 56, 0.85)' : 'rgba(255, 255, 255, 0.88)',
                  borderColor: isDark ? 'rgba(168, 220, 244, 0.22)' : 'rgba(255, 255, 255, 0.95)',
                  ...shadows.sm,
                },
              ]}
              accessibilityRole="button"
            >
              <View style={[s.qaIconBox, { backgroundColor: a.bg }]}>
                <Ionicons name={a.icon} size={20} color={a.color} />
              </View>
              <Text style={[s.qaLabel, { color: theme.text.primary }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* ============================================================== */}
        {/* 6. UPCOMING SCHEDULE EVENTS                                     */}
        {/* ============================================================== */}
        {events && events.length > 0 && (
          <Animated.View entering={FadeInUp.duration(400).delay(300)}>
            <View style={s.secHeaderRow}>
              <Text style={[s.secTitle, { color: theme.text.primary }]}>Upcoming Events</Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push('/(tabs)/calendar');
                }}
                activeOpacity={0.7}
                style={s.seeAllBtn}
              >
                <Text style={s.seeAllText}>Calendar</Text>
                <Ionicons name="chevron-forward" size={14} color="#6366F1" />
              </TouchableOpacity>
            </View>

            <View style={s.eventList}>
              {events.map((e, index) => {
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
                        {e.all_day
                          ? format(new Date(e.start_at), 'MMM d')
                          : `${format(new Date(e.start_at), 'MMM d · h:mm a')}`}
                        {e.location ? ` · ${e.location}` : ''}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={theme.text.tertiary} />
                  </TouchableCard>
                );
              })}
            </View>
          </Animated.View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Autonomous Hands-Free Voice Copilot Modal */}
      <VoiceAssistantModal
        visible={voiceModalVisible}
        onClose={() => setVoiceModalVisible(false)}
      />

      {/* In-App Frosted Notification Center & Activity Inbox */}
      <NotificationCenterModal
        visible={notifModalVisible}
        onClose={() => setNotifModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 0 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  brandHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  headerAppLogo: {
    width: 20,
    height: 20,
  },
  greetingSub: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  nameGreetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  mottoText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    maxWidth: 220,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  headerTopButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  topGlassBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366F1',
  },
  avatarWrapper: {
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarGlowAura: {
    position: 'absolute',
    width: 62,
    height: 62,
    borderRadius: 31,
    opacity: 0.45,
  },
  avatarInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 22,
    fontWeight: '800',
    color: '#6366F1',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 22,
    borderWidth: 1.2,
    alignItems: 'flex-start',
    gap: 6,
  },
  kpiIconBox: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  kpiNumber: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  bannerWrap: {
    marginBottom: 20,
  },
  goalBanner: {
    borderRadius: 26,
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  goalMountainAura: {
    position: 'absolute',
    right: -20,
    bottom: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  goalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  goalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  goalTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.95,
  },
  goalArrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalHeadline: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  goalSubtitle: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 3,
    marginBottom: 16,
  },
  goalProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  goalProgressTrack: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  goalPctText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  secHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  secTitle: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    color: '#6366F1',
    fontSize: 13,
    fontWeight: '700',
  },
  taskList: {
    gap: 10,
    marginBottom: 20,
  },
  myTaskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.2,
    gap: 14,
  },
  taskCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCheckCircleDone: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  taskBody: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  taskMeta: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  strikeText: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  taskDots: {
    padding: 4,
  },
  qa: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 20,
  },
  qaItem: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 2,
    borderRadius: 18,
    borderWidth: 1.2,
    alignItems: 'center',
    gap: 6,
  },
  qaIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  eventList: {
    gap: 8,
  },
  evCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  evAccent: {
    width: 4,
    height: 38,
    borderRadius: 2,
  },
  evTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  evTime: {
    fontSize: 12,
    marginTop: 2,
  },
});
