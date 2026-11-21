import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { format, differenceInDays, isPast, parseISO } from 'date-fns';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius, shadows } from '../../src/theme/tokens';
import {
  fetchGoals,
  updateGoalProgress,
  updateGoal,
  toggleMilestone,
} from '../../src/features/goals/api';
import { useAuthStore } from '../../src/stores/authStore';
import { SkeletonCard, EmptyState } from '../../src/components/feedback';
import { AppBackground } from '../../src/components/layout/AppBackground';
import type { Goal, GoalCategory, GoalMilestone } from '../../src/types';

// Category theme styling with rich gradients and vector icons
interface CategoryMeta {
  icon: keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
  accent: string;
  bgLight: string;
  label: string;
}

const CATEGORY_MAP: Record<GoalCategory, CategoryMeta> = {
  health: {
    icon: 'fitness',
    gradient: ['#059669', '#10B981'],
    accent: '#10B981',
    bgLight: 'rgba(16, 185, 129, 0.14)',
    label: 'Health & Fitness',
  },
  career: {
    icon: 'briefcase',
    gradient: ['#4F46E5', '#6366F1'],
    accent: '#6366F1',
    bgLight: 'rgba(99, 102, 241, 0.14)',
    label: 'Career & Work',
  },
  finance: {
    icon: 'wallet',
    gradient: ['#D97706', '#F59E0B'],
    accent: '#F59E0B',
    bgLight: 'rgba(245, 158, 11, 0.14)',
    label: 'Finance & Wealth',
  },
  learning: {
    icon: 'book',
    gradient: ['#7C3AED', '#8B5CF6'],
    accent: '#8B5CF6',
    bgLight: 'rgba(139, 92, 246, 0.14)',
    label: 'Learning & Skills',
  },
  personal: {
    icon: 'compass',
    gradient: ['#0891B2', '#06B6D4'],
    accent: '#06B6D4',
    bgLight: 'rgba(6, 182, 212, 0.14)',
    label: 'Personal Growth',
  },
  relationships: {
    icon: 'heart',
    gradient: ['#E11D48', '#F43F5E'],
    accent: '#F43F5E',
    bgLight: 'rgba(244, 63, 94, 0.14)',
    label: 'Relationships',
  },
  other: {
    icon: 'flag',
    gradient: ['#475569', '#64748B'],
    accent: '#64748B',
    bgLight: 'rgba(100, 116, 139, 0.14)',
    label: 'General Target',
  },
};

export default function GoalsScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const uid = useAuthStore((s) => s.user?.id ?? s.profile?.id);

  const [filter, setFilter] = useState<'active' | 'completed' | 'all'>('active');

  const { data: goals, isLoading, refetch } = useQuery({
    queryKey: ['goals', uid],
    queryFn: () => fetchGoals(uid!),
    enabled: Boolean(uid),
    staleTime: 30_000,
  });

  const allGoals = goals ?? [];
  const activeCount = allGoals.filter((g) => g.status === 'active').length;
  const completedCount = allGoals.filter((g) => g.status === 'completed').length;
  const totalCount = allGoals.length;
  const avg = totalCount > 0 ? Math.round(allGoals.reduce((s, g) => s + g.progress, 0) / totalCount) : 0;

  const filtered = useMemo(() => {
    return allGoals.filter((g) => {
      if (filter === 'all') return true;
      return g.status === filter;
    });
  }, [allGoals, filter]);

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
  };

  // Hero motivational copy calculation
  const heroCopy = useMemo(() => {
    if (totalCount === 0) {
      return {
        title: 'Define Your Vision',
        subtitle: 'Set meaningful targets and turn daily actions into milestones.',
        tag: 'New Journey',
      };
    }
    if (completedCount === totalCount && totalCount > 0) {
      return {
        title: 'Outstanding Achievement!',
        subtitle: 'All targeted goals have been conquered. Ready for the next summit?',
        tag: 'Peak Mastery',
      };
    }
    if (avg >= 70) {
      return {
        title: 'Almost At The Finish Line!',
        subtitle: `You are ${avg}% closer to completing your life milestones.`,
        tag: 'High Momentum',
      };
    }
    if (avg >= 40) {
      return {
        title: 'Keep Up The Momentum!',
        subtitle: `${completedCount} of ${totalCount} milestones reached. Stay persistent!`,
        tag: 'In Progress',
      };
    }
    return {
      title: 'Every Small Step Counts!',
      subtitle: `Build daily momentum towards ${activeCount} active aspirations.`,
      tag: 'Starting Strong',
    };
  }, [totalCount, completedCount, avg, activeCount]);

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      {/* 4K Blurred Organic U-Shape Wallpaper Background */}
      <AppBackground screenName="goals" />

      {/* ============================================================== */}
      {/* 1. TOP HEADER WITH GLOSSY ACTIONS                              */}
      {/* ============================================================== */}
      <Animated.View entering={FadeInDown.duration(420)} style={s.header}>
        <View style={{ flex: 1 }}>
          <View style={s.headerTagRow}>
            <View
              style={[
                s.headerBadge,
                {
                  backgroundColor: isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(2, 132, 199, 0.10)',
                  borderColor: isDark ? 'rgba(56, 189, 248, 0.30)' : 'rgba(2, 132, 199, 0.20)',
                },
              ]}
            >
              <Ionicons name="sparkles" size={11} color={isDark ? '#38BDF8' : '#0284C7'} />
              <Text style={[s.headerBadgeText, { color: isDark ? '#38BDF8' : '#0284C7' }]}>
                Aspirations & Milestones
              </Text>
            </View>
          </View>
          <Text style={[s.title, { color: theme.text.primary }]}>Goals & Targets</Text>
          <Text style={[s.subtitle, { color: isDark ? '#819BB3' : '#64748B' }]}>
            Track your life aspirations with precision
          </Text>
        </View>

        {/* Right Header Glass "+ New Goal" Button */}
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/goals/new');
          }}
          style={s.addBtnContainer}
          activeOpacity={0.85}
          accessibilityLabel="Add New Goal"
        >
          <LinearGradient
            colors={['#4338CA', '#4F46E5', '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.addBtnGradient}
          >
            <Ionicons name="add" size={19} color="#FFFFFF" />
            <Text style={s.addBtnText}>New Goal</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={theme.brand.primary} />}
      >
        {/* ============================================================== */}
        {/* 2. HERO JOURNEY BANNER (Like Home Motivation Banner)           */}
        {/* ============================================================== */}
        <Animated.View entering={FadeInUp.duration(420).delay(60)} style={s.heroWrap}>
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (filtered.length > 0) {
                router.push(`/goals/${filtered[0].id}` as never);
              } else {
                router.push('/goals/new');
              }
            }}
          >
            <LinearGradient
              colors={['#4338CA', '#4F46E5', '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.heroBanner}
            >
              {/* Subtle mountain aura glow in background */}
              <View style={s.heroMountainAura} />

              <View style={s.heroTopRow}>
                <View style={s.heroTag}>
                  <Ionicons name="compass-outline" size={13} color="#FFFFFF" />
                  <Text style={s.heroTagText}>{heroCopy.tag}</Text>
                </View>

                {/* Circular white button with arrow */}
                <View style={s.heroArrowCircle}>
                  <Ionicons name="chevron-forward" size={16} color="#4338CA" />
                </View>
              </View>

              <Text style={s.heroHeadline}>{heroCopy.title}</Text>
              <Text style={s.heroSubtitle}>{heroCopy.subtitle}</Text>

              {/* White pill progress bar */}
              <View style={s.heroProgressRow}>
                <View style={s.heroProgressTrack}>
                  <View style={[s.heroProgressFill, { width: `${Math.max(10, avg)}%` }]} />
                </View>
                <Text style={s.heroPctText}>{avg}%</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* ============================================================== */}
        {/* 3. THREE GLOSSY KPI CARDS (Matching Home Screen)              */}
        {/* ============================================================== */}
        <Animated.View entering={FadeInUp.duration(420).delay(120)} style={s.kpiRow}>
          {/* Card 1: Active Goals */}
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setFilter('active');
            }}
            activeOpacity={0.8}
            style={[
              s.kpiCard,
              {
                backgroundColor: isDark ? 'rgba(10, 36, 56, 0.85)' : 'rgba(255, 255, 255, 0.88)',
                borderColor: filter === 'active' ? '#0284C7' : isDark ? 'rgba(168, 220, 244, 0.28)' : 'rgba(255, 255, 255, 0.95)',
                ...shadows.sm,
              },
            ]}
          >
            <View style={[s.kpiIconBox, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.20)' : 'rgba(240, 249, 255, 0.95)' }]}>
              <Ionicons name="flash-outline" size={18} color="#0284C7" />
            </View>
            <Text style={[s.kpiNumber, { color: theme.text.primary }]}>{activeCount}</Text>
            <Text style={[s.kpiLabel, { color: isDark ? '#819BB3' : '#64748B' }]}>Active Goals</Text>
          </TouchableOpacity>

          {/* Card 2: Completed */}
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setFilter('completed');
            }}
            activeOpacity={0.8}
            style={[
              s.kpiCard,
              {
                backgroundColor: isDark ? 'rgba(10, 36, 56, 0.85)' : 'rgba(255, 255, 255, 0.88)',
                borderColor: filter === 'completed' ? '#10B981' : isDark ? 'rgba(168, 220, 244, 0.28)' : 'rgba(255, 255, 255, 0.95)',
                ...shadows.sm,
              },
            ]}
          >
            <View style={[s.kpiIconBox, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.20)' : 'rgba(236, 253, 245, 0.95)' }]}>
              <Ionicons name="trophy-outline" size={18} color="#10B981" />
            </View>
            <Text style={[s.kpiNumber, { color: theme.text.primary }]}>{completedCount}</Text>
            <Text style={[s.kpiLabel, { color: isDark ? '#819BB3' : '#64748B' }]}>Achieved</Text>
          </TouchableOpacity>

          {/* Card 3: Avg Velocity */}
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setFilter('all');
            }}
            activeOpacity={0.8}
            style={[
              s.kpiCard,
              {
                backgroundColor: isDark ? 'rgba(10, 36, 56, 0.85)' : 'rgba(255, 255, 255, 0.88)',
                borderColor: filter === 'all' ? '#EA580C' : isDark ? 'rgba(168, 220, 244, 0.28)' : 'rgba(255, 255, 255, 0.95)',
                ...shadows.sm,
              },
            ]}
          >
            <View style={[s.kpiIconBox, { backgroundColor: isDark ? 'rgba(249, 115, 22, 0.20)' : 'rgba(255, 247, 237, 0.95)' }]}>
              <Ionicons name="trending-up-outline" size={18} color="#EA580C" />
            </View>
            <Text style={[s.kpiNumber, { color: theme.text.primary }]}>{avg}%</Text>
            <Text style={[s.kpiLabel, { color: isDark ? '#819BB3' : '#64748B' }]}>Avg Velocity</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ============================================================== */}
        {/* 4. SEGMENTED FILTER PILL BAR (Like Calendar Switcher)          */}
        {/* ============================================================== */}
        <Animated.View entering={FadeInUp.duration(420).delay(180)} style={s.filterContainer}>
          <View
            style={[
              s.segmentBar,
              {
                backgroundColor: isDark ? 'rgba(10, 36, 56, 0.82)' : 'rgba(226, 232, 240, 0.65)',
                borderColor: isDark ? 'rgba(168, 220, 244, 0.25)' : 'rgba(255, 255, 255, 0.95)',
              },
            ]}
          >
            {(
              [
                { k: 'active', l: `Active (${activeCount})` },
                { k: 'completed', l: `Completed (${completedCount})` },
                { k: 'all', l: `All Goals (${totalCount})` },
              ] as const
            ).map((tab) => {
              const isSelected = filter === tab.k;
              return (
                <TouchableOpacity
                  key={tab.k}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setFilter(tab.k);
                  }}
                  activeOpacity={0.8}
                  style={[
                    s.segmentBtn,
                    isSelected && [
                      s.segmentBtnActive,
                      {
                        backgroundColor: isDark ? '#0284C7' : '#FFFFFF',
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
                    {tab.l}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* ============================================================== */}
        {/* 5. GOALS LIST WITH INTERACTIVE FROSTED CARDS                   */}
        {/* ============================================================== */}
        <View style={s.listContainer}>
          {isLoading ? (
            [1, 2, 3].map((i) => <SkeletonCard key={i} />)
          ) : !filtered.length ? (
            <EmptyState
              icon="flag-outline"
              title={
                filter === 'completed'
                  ? 'No completed goals yet'
                  : filter === 'active'
                  ? 'No active goals right now'
                  : 'No goals found'
              }
              description="Transform your ambitions into actionable milestones and build your legacy."
              actionLabel="+ Create A Goal"
              onAction={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/goals/new');
              }}
            />
          ) : (
            filtered.map((g, index) => (
              <GoalCardItem
                key={g.id}
                goal={g}
                index={index}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/goals/${g.id}` as never);
                }}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================================
// INDIVIDUAL GOAL CARD COMPONENT
// ============================================================================
function GoalCardItem({
  goal,
  index,
  onPress,
}: {
  goal: Goal;
  index: number;
  onPress: () => void;
}) {
  const { theme, isDark } = useTheme();
  const qc = useQueryClient();
  const meta = CATEGORY_MAP[goal.category] ?? CATEGORY_MAP.other;

  const milestones: GoalMilestone[] = goal.milestones ?? [];
  const completedMs = milestones.filter((m) => m.completed).length;
  const totalMs = milestones.length;

  // Compute countdown / target info
  const targetInfo = useMemo(() => {
    if (goal.status === 'completed') return { text: 'Achieved', isOverdue: false, isDone: true };
    if (!goal.target_date) return null;
    try {
      const d = parseISO(goal.target_date);
      const days = differenceInDays(d, new Date());
      if (isPast(d) && days < 0) {
        return { text: `Overdue by ${Math.abs(days)}d`, isOverdue: true, isDone: false };
      }
      if (days === 0) return { text: 'Due today', isOverdue: false, isDone: false };
      if (days === 1) return { text: '1 day left', isOverdue: false, isDone: false };
      return { text: `${days} days left`, isOverdue: false, isDone: false };
    } catch {
      return null;
    }
  }, [goal.target_date, goal.status]);

  // Quick bump progress mutation (+10%)
  const bumpMutation = useMutation({
    mutationFn: async (increment: number) => {
      const next = Math.min(100, goal.progress + increment);
      return updateGoalProgress(goal.id, next);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      qc.invalidateQueries({ queryKey: ['goal', goal.id] });
    },
  });

  // Toggle milestone mutation
  const toggleMilestoneMutation = useMutation({
    mutationFn: async ({ mId, nextStatus }: { mId: string; nextStatus: boolean }) => {
      return toggleMilestone(mId, goal.id, nextStatus);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      qc.invalidateQueries({ queryKey: ['goal', goal.id] });
    },
  });

  // Mark 100% complete
  const markCompleteMutation = useMutation({
    mutationFn: async () => {
      return updateGoal(goal.id, { progress: 100, status: 'completed' });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      qc.invalidateQueries({ queryKey: ['goal', goal.id] });
    },
  });

  return (
    <Animated.View entering={FadeInUp.duration(380).delay(index * 60)}>
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onPress}
        style={[
          c.card,
          {
            backgroundColor: isDark ? 'rgba(10, 36, 56, 0.88)' : 'rgba(255, 255, 255, 0.92)',
            borderColor: isDark ? 'rgba(168, 220, 244, 0.28)' : 'rgba(255, 255, 255, 0.95)',
            ...shadows.sm,
          },
        ]}
      >
        {/* Top Header Row */}
        <View style={c.topRow}>
          {/* Category Icon Squircle with Category Gradient */}
          <LinearGradient
            colors={meta.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={c.iconSquircle}
          >
            <Ionicons name={meta.icon} size={20} color="#FFFFFF" />
          </LinearGradient>

          {/* Goal Category & Target Info */}
          <View style={c.titleCol}>
            <View style={c.categoryRow}>
              <View style={[c.categoryPill, { backgroundColor: meta.bgLight }]}>
                <Text style={[c.categoryPillText, { color: meta.accent }]}>
                  {meta.label}
                </Text>
              </View>

              {targetInfo && (
                <View
                  style={[
                    c.targetPill,
                    {
                      backgroundColor: targetInfo.isDone
                        ? 'rgba(16, 185, 129, 0.12)'
                        : targetInfo.isOverdue
                        ? 'rgba(239, 68, 68, 0.12)'
                        : isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(15, 23, 42, 0.05)',
                    },
                  ]}
                >
                  <Ionicons
                    name={targetInfo.isDone ? 'checkmark-circle' : 'time-outline'}
                    size={11}
                    color={
                      targetInfo.isDone
                        ? '#10B981'
                        : targetInfo.isOverdue
                        ? '#EF4444'
                        : isDark
                        ? '#94A3B8'
                        : '#64748B'
                    }
                  />
                  <Text
                    style={[
                      c.targetPillText,
                      {
                        color: targetInfo.isDone
                          ? '#10B981'
                          : targetInfo.isOverdue
                          ? '#EF4444'
                          : isDark
                          ? '#94A3B8'
                          : '#64748B',
                      },
                    ]}
                  >
                    {targetInfo.text}
                  </Text>
                </View>
              )}
            </View>

            <Text style={[c.goalTitle, { color: theme.text.primary }]} numberOfLines={2}>
              {goal.title}
            </Text>
          </View>

          {/* Percentage Badge */}
          <View
            style={[
              c.percentPill,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : meta.bgLight,
                borderColor: meta.accent,
              },
            ]}
          >
            <Text style={[c.percentText, { color: meta.accent }]}>{goal.progress}%</Text>
          </View>
        </View>

        {/* Description snippet if present */}
        {goal.description ? (
          <Text style={[c.descText, { color: isDark ? '#819BB3' : '#64748B' }]} numberOfLines={2}>
            {goal.description}
          </Text>
        ) : null}

        {/* Multi-stop Gradient Progress Bar */}
        <View style={c.progressSection}>
          <View style={[c.progressTrack, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0' }]}>
            <LinearGradient
              colors={meta.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[c.progressFill, { width: `${Math.max(6, Math.min(100, goal.progress))}%` }]}
            />
          </View>
        </View>

        {/* Milestones Mini-Checklist Section */}
        {totalMs > 0 && (
          <View style={[c.milestoneBox, { backgroundColor: isDark ? 'rgba(15, 23, 42, 0.40)' : 'rgba(248, 250, 252, 0.85)' }]}>
            <View style={c.msSummaryRow}>
              <View style={c.msLabelRow}>
                <Ionicons name="git-commit-outline" size={13} color={meta.accent} />
                <Text style={[c.msSummaryTitle, { color: theme.text.primary }]}>
                  Milestones ({completedMs}/{totalMs})
                </Text>
              </View>
              <Text style={[c.msSummaryPct, { color: meta.accent }]}>
                {Math.round((completedMs / totalMs) * 100)}%
              </Text>
            </View>

            {/* List up to 3 milestones with interactive tap */}
            <View style={c.msList}>
              {milestones.slice(0, 3).map((ms) => (
                <TouchableOpacity
                  key={ms.id}
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    toggleMilestoneMutation.mutate({ mId: ms.id, nextStatus: !ms.completed });
                  }}
                  style={c.msRowItem}
                >
                  <View
                    style={[
                      c.msCheckbox,
                      {
                        borderColor: ms.completed ? meta.accent : isDark ? 'rgba(255, 255, 255, 0.25)' : '#CBD5E1',
                        backgroundColor: ms.completed ? meta.accent : 'transparent',
                      },
                    ]}
                  >
                    {ms.completed && <Ionicons name="checkmark" size={11} color="#FFFFFF" />}
                  </View>
                  <Text
                    style={[
                      c.msItemText,
                      {
                        color: ms.completed ? (isDark ? '#64748B' : '#94A3B8') : theme.text.secondary,
                        textDecorationLine: ms.completed ? 'line-through' : 'none',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {ms.title}
                  </Text>
                </TouchableOpacity>
              ))}

              {totalMs > 3 && (
                <Text style={[c.moreMsText, { color: isDark ? '#819BB3' : '#64748B' }]}>
                  +{totalMs - 3} more milestones...
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Quick Action Footer */}
        <View style={c.cardFooter}>
          <View style={c.quickActions}>
            {goal.progress < 100 && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  bumpMutation.mutate(10);
                }}
                disabled={bumpMutation.isPending}
                style={[
                  c.quickActionBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(241, 245, 249, 0.95)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#E2E8F0',
                  },
                ]}
              >
                <Ionicons name="flash" size={13} color={meta.accent} />
                <Text style={[c.quickActionText, { color: theme.text.primary }]}>+10%</Text>
              </TouchableOpacity>
            )}

            {goal.progress < 100 && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  markCompleteMutation.mutate();
                }}
                disabled={markCompleteMutation.isPending}
                style={[
                  c.quickActionBtn,
                  {
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(236, 253, 245, 0.95)',
                    borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.30)',
                  },
                ]}
              >
                <Ionicons name="checkmark-done" size={13} color="#10B981" />
                <Text style={[c.quickActionText, { color: '#10B981' }]}>Complete</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* View Details Link with Chevron */}
          <View style={c.viewDetailsRow}>
            <Text style={[c.viewDetailsText, { color: meta.accent }]}>Details</Text>
            <Ionicons name="chevron-forward" size={14} color={meta.accent} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================================================
// STYLES
// ============================================================================
const s = StyleSheet.create({
  safe: {
    flex: 1,
  },
  ambientGlowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 380,
    overflow: 'hidden',
  },
  ambientGlow: {
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
  },
  headerTagRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.3,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: fontSize.xs,
    marginTop: 2,
    fontWeight: fontWeight.medium,
  },
  addBtnContainer: {
    borderRadius: radius.full,
    overflow: 'hidden',
    ...shadows.sm,
  },
  addBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.full,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  scrollContent: {
    paddingBottom: 130, // Safe clearance for bottom floating navigation dock
  },

  // Hero Journey Banner
  heroWrap: {
    paddingHorizontal: spacing[5],
    marginTop: spacing[2],
  },
  heroBanner: {
    borderRadius: 24,
    padding: spacing[5],
    position: 'relative',
    overflow: 'hidden',
    ...shadows.md,
  },
  heroMountainAura: {
    position: 'absolute',
    right: -25,
    bottom: -35,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  heroTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.2,
  },
  heroArrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  heroHeadline: {
    color: '#FFFFFF',
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginTop: 2,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: fontSize.xs,
    marginTop: 4,
    lineHeight: 18,
  },
  heroProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: spacing[3],
  },
  heroProgressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
    overflow: 'hidden',
  },
  heroProgressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  heroPctText: {
    color: '#FFFFFF',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },

  // KPI Row
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: spacing[5],
    marginTop: spacing[4],
  },
  kpiCard: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1.2,
  },
  kpiIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  kpiNumber: {
    fontSize: 18,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.3,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },

  // Segmented Filter Bar
  filterContainer: {
    paddingHorizontal: spacing[5],
    marginTop: spacing[4],
  },
  segmentBar: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  segmentBtnActive: {
    borderRadius: radius.full,
  },
  segmentBtnText: {
    fontSize: 12,
  },

  // Goals List
  listContainer: {
    paddingHorizontal: spacing[5],
    marginTop: spacing[4],
    gap: spacing[3],
  },
});

const c = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: spacing[4],
    borderWidth: 1.2,
    gap: spacing[3],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconSquircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  titleCol: {
    flex: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  categoryPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  targetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  targetPillText: {
    fontSize: 10,
    fontWeight: fontWeight.medium,
  },
  goalTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    lineHeight: 21,
  },
  percentPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  descText: {
    fontSize: fontSize.xs,
    lineHeight: 18,
  },

  // Progress
  progressSection: {
    gap: 4,
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Milestones
  milestoneBox: {
    borderRadius: 14,
    padding: 10,
    gap: 8,
  },
  msSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  msLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  msSummaryTitle: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
  },
  msSummaryPct: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
  },
  msList: {
    gap: 6,
  },
  msRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  msCheckbox: {
    width: 17,
    height: 17,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msItemText: {
    fontSize: 12,
    flex: 1,
  },
  moreMsText: {
    fontSize: 10,
    fontWeight: fontWeight.medium,
    fontStyle: 'italic',
    paddingLeft: 25,
  },

  // Footer Actions
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
  },
  quickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailsText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
  },
});
