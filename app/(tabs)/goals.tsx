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

const CM: Record<GoalCategory, { emoji: string; color: string; bg: string }> = {
  health:        { emoji: '💪', color: '#10B981', bg: 'rgba(16, 185, 129, 0.16)' },
  career:        { emoji: '💼', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.16)' },
  finance:       { emoji: '💰', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.16)' },
  learning:      { emoji: '📚', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.16)' },
  personal:      { emoji: '🌱', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.16)' },
  relationships: { emoji: '❤️', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.16)' },
  other:         { emoji: '🎯', color: '#64748B', bg: 'rgba(100, 116, 139, 0.16)' },
};

export default function GoalsScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const uid = useAuthStore((s) => s.user?.id);
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing[16] }}>
        {/* KPI Stats Cards */}
        <Animated.View entering={FadeInDown.duration(400)} style={s.stats}>
          {[
            { l: 'Active', v: activeCount, emoji: '🎯', color: '#38BDF8' },
            { l: 'Completed', v: completedCount, emoji: '🏆', color: '#10B981' },
            { l: 'Avg Progress', v: `${avg}%`, emoji: '📈', color: '#F59E0B' },
          ].map((c) => (
            <Card key={c.l} style={s.statCard}>
              <Text style={{ fontSize: 20 }}>{c.emoji}</Text>
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
                    backgroundColor: selected ? theme.brand.primary : isDark ? 'rgba(14, 38, 64, 0.85)' : '#FFFFFF',
                    borderColor: selected ? theme.brand.primary : theme.border.subtle,
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
                  {f === 'active' ? '⚡ Active' : f === 'completed' ? '✓ Completed' : '🌐 All'}
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
          <Text style={g.emoji}>{m.emoji}</Text>
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
          <Text style={[g.pct, { color: m.color }]}>{goal.progress}%</Text>
        </View>
      </View>

      {/* Progress Bar inside Card */}
      <View style={[g.barBg, { backgroundColor: theme.surface.inset }]}>
        <View style={[g.fill, { width: `${goal.progress}%`, backgroundColor: m.color }]} />
      </View>

      <View style={g.footer}>
        {totalMs > 0 ? (
          <Text style={[g.ms, { color: theme.text.tertiary }]}>
            {done}/{totalMs} milestones finished
          </Text>
        ) : (
          <Text style={[g.ms, { color: theme.text.tertiary }]}>
            Status: {goal.status === 'completed' ? 'Completed' : 'In Progress'}
          </Text>
        )}
        <Ionicons name="chevron-forward" size={14} color={theme.text.tertiary} />
      </View>
    </TouchableCard>
  );
}

const g = StyleSheet.create({
  card: { gap: spacing[3], marginBottom: spacing[2] },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  iconBox: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 20 },
  title: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
  cat: { fontSize: fontSize.xs, marginTop: 2, textTransform: 'capitalize' },
  pctPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full },
  pct: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  barBg: { height: 7, borderRadius: radius.full, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.full },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ms: { fontSize: fontSize.xs, fontWeight: '500' },
});

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold },
  subtitle: { fontSize: fontSize.xs, marginTop: 1 },
  addBtn: { width: 40, height: 40, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', gap: spacing[3], padding: spacing[5], paddingBottom: 0 },
  statCard: { flex: 1, alignItems: 'center', padding: spacing[3], gap: 2 },
  statVal: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, marginTop: 2 },
  statLbl: { fontSize: fontSize.xs, textAlign: 'center' },
  filters: { flexDirection: 'row', gap: spacing[2], paddingHorizontal: spacing[5], paddingTop: spacing[4] },
  chip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    borderWidth: 1,
  },
  list: { padding: spacing[5], gap: spacing[2] },
});
