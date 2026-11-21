import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius, shadows } from '../../src/theme/tokens';
import { fetchGoals } from '../../src/features/goals/api';
import { useAuthStore } from '../../src/stores/authStore';
import { SkeletonCard, EmptyState } from '../../src/components/feedback';
import { Card, TouchableCard } from '../../src/components/ui/Card';
import type { Goal, GoalCategory } from '../../src/types';

const CM: Record<GoalCategory, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  health:        { icon: 'fitness-outline', color: '#10B981', bg: 'rgba(16, 185, 129, 0.16)' },
  career:        { icon: 'briefcase-outline', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.16)' },
  finance:       { icon: 'wallet-outline', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.16)' },
  learning:      { icon: 'book-outline', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.16)' },
  personal:      { icon: 'person-outline', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.16)' },
  relationships: { icon: 'heart-outline', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.16)' },
  other:         { icon: 'flag-outline', color: '#64748B', bg: 'rgba(100, 116, 139, 0.16)' },
};

export default function GoalsScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const uid = useAuthStore((s) => s.user?.id ?? s.profile?.id);
  const [filter, setFilter] = useState<'active' | 'completed' | 'all'>('active');

  const { data: goals, isLoading } = useQuery({
    queryKey: ['goals', uid],
    queryFn: () => fetchGoals(uid!),
    enabled: Boolean(uid),
    staleTime: 30_000,
  });

  const filtered = (goals ?? []).filter((g) => (filter === 'all' ? true : g.status === filter));
  const activeCount = (goals ?? []).filter((g) => g.status === 'active').length;
  const completedCount = (goals ?? []).filter((g) => g.status === 'completed').length;
  const avg = goals?.length ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length) : 0;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg.primary }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: theme.border.subtle }]}>
        <View>
          <Text style={[s.title, { color: theme.text.primary }]}>Goals & Targets</Text>
          <Text style={[s.subtitle, { color: theme.text.tertiary }]}>Track your life aspirations</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/goals/new');
          }}
          style={[s.addBtn, { backgroundColor: theme.brand.primaryBg }]}
          accessibilityLabel="Add goal"
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={22} color={theme.brand.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        {/* KPI Stats Cards */}
        <Animated.View entering={FadeInDown.duration(400)} style={s.stats}>
          {[
            { l: 'Active', v: activeCount, icon: 'flash-outline' as const, color: '#38BDF8' },
            { l: 'Completed', v: completedCount, icon: 'checkmark-done-circle-outline' as const, color: '#10B981' },
            { l: 'Avg Progress', v: `${avg}%`, icon: 'trending-up-outline' as const, color: '#F59E0B' },
          ].map((c) => (
            <Card key={c.l} style={s.statCard}>
              <View style={[s.kpiIconBox, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.14)' : 'rgba(2, 132, 199, 0.10)' }]}>
                <Ionicons name={c.icon} size={20} color={c.color} />
              </View>
              <Text style={[s.statVal, { color: theme.text.primary }]}>{c.v}</Text>
              <Text style={[s.statLbl, { color: theme.text.tertiary }]}>{c.l}</Text>
            </Card>
          ))}
        </Animated.View>

        {/* Filter Chips */}
        <Animated.View entering={FadeInUp.duration(400).delay(80)} style={s.filters}>
          {(['active', 'completed', 'all'] as const).map((f) => {
            const selected = filter === f;
            return (
              <TouchableOpacity
                key={f}
                onPress={() => {
                  Haptics.selectionAsync();
                  setFilter(f);
                }}
                activeOpacity={0.75}
                style={[
                  s.chip,
                  {
                    backgroundColor: selected ? theme.brand.primary : isDark ? 'rgba(10, 36, 56, 0.88)' : '#FFFFFF',
                    borderColor: selected ? theme.brand.primary : isDark ? 'rgba(168, 220, 244, 0.22)' : theme.border.subtle,
                  },
                ]}
              >
                <Text
                  style={{
                    color: selected ? '#ffffff' : theme.text.secondary,
                    fontSize: fontSize.sm,
                    fontWeight: selected ? fontWeight.bold : fontWeight.medium,
                  }}
                >
                  {f === 'active' ? 'Active' : f === 'completed' ? 'Completed' : 'All Goals'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* Goals List */}
        <View style={s.list}>
          {isLoading ? (
            [1, 2, 3].map((i) => <SkeletonCard key={i} />)
          ) : !filtered.length ? (
            <EmptyState
              icon="flag-outline"
              title="No goals found"
              description="Set a new goal and start making daily progress."
              actionLabel="Add a Goal"
              onAction={() => router.push('/goals/new')}
            />
          ) : (
            filtered.map((g, index) => (
              <GoalCard
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

function GoalCard({ goal, index, onPress }: { goal: Goal; index: number; onPress: () => void }) {
  const { theme, isDark } = useTheme();
  const m = CM[goal.category] ?? CM.other;
  const done = (goal.milestones ?? []).filter((ms) => ms.completed).length;
  const totalMs = (goal.milestones ?? []).length;

  return (
    <TouchableCard index={index} onPress={onPress} style={g.card}>
      <View style={g.head}>
        <View style={[g.iconBox, { backgroundColor: m.bg }]}>
          <Ionicons name={m.icon} size={22} color={m.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[g.title, { color: theme.text.primary }]} numberOfLines={1}>
            {goal.title}
          </Text>
          <Text style={[g.cat, { color: theme.text.tertiary }]}>
            {goal.category}
            {goal.target_date
              ? ` · Target ${new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
              : ''}
          </Text>
        </View>
        <View style={[g.pctPill, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.14)' : 'rgba(2, 132, 199, 0.10)' }]}>
          <Text style={[g.pctTxt, { color: theme.brand.primary }]}>{goal.progress}%</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={[g.barBg, { backgroundColor: theme.surface.inset }]}>
        <View style={[g.barFill, { width: `${goal.progress}%`, backgroundColor: m.color }]} />
      </View>

      {/* Milestones info */}
      {totalMs > 0 && (
        <View style={g.msRow}>
          <Ionicons name="checkbox-outline" size={13} color={theme.text.tertiary} />
          <Text style={[g.msTxt, { color: theme.text.tertiary }]}>
            {done} of {totalMs} milestones completed
          </Text>
        </View>
      )}
    </TouchableCard>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold },
  subtitle: { fontSize: fontSize.xs, marginTop: 2 },
  addBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', gap: spacing[3], paddingHorizontal: spacing[5], marginTop: spacing[4] },
  statCard: { flex: 1, alignItems: 'center', padding: spacing[3], gap: spacing[1] },
  kpiIconBox: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  statVal: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  statLbl: { fontSize: fontSize.xs },
  filters: { flexDirection: 'row', gap: spacing[2], paddingHorizontal: spacing[5], marginTop: spacing[4] },
  chip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    borderWidth: 1.2,
  },
  list: { paddingHorizontal: spacing[5], marginTop: spacing[4], gap: spacing[3] },
});

const g = StyleSheet.create({
  card: { gap: spacing[3] },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  iconBox: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  cat: { fontSize: fontSize.xs, textTransform: 'capitalize', marginTop: 2 },
  pctPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  pctTxt: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  barBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  msRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  msTxt: { fontSize: fontSize.xs },
});
