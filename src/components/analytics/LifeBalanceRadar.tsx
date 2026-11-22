import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../stores/authStore';
import { useTodayTasks } from '../../features/tasks/hooks';
import { useHabits, useTodayHabitLogs } from '../../features/habits/hooks';
import { useNotes } from '../../features/notes/hooks';
import { fetchMonthlyTransactions, buildSpendingSummary } from '../../features/finance/api';
import { useFocusStore } from '../../stores/focusStore';
import {
  calculatePolygonPoints,
  computeEquilibriumIndex,
  AXES_COUNT,
} from '../../lib/analytics/radarCalculations';
import { fontSize, fontWeight, radius, shadows, spacing } from '../../theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_SIZE = Math.min(SCREEN_WIDTH - 64, 300);
const CENTER = CHART_SIZE / 2;
const MAX_RADIUS = CENTER - 36;

export interface LifeDimensionScore {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  score: number; // 0 to 100
  color: string;
  detail?: string;
}

export function LifeBalanceRadar() {
  const { theme, isDark } = useTheme();
  const uid = useAuthStore((s) => s.user?.id);
  const profile = useAuthStore((s) => s.profile);
  const currency = profile?.currency ?? 'INR';

  // Real Database Hooks
  const { data: tasks } = useTodayTasks();
  const { data: habits } = useHabits();
  const { data: habitLogs } = useTodayHabitLogs();
  const { data: notes } = useNotes();
  const completedFocusSessions = useFocusStore((s) => s.completedSessions);

  const { data: transactions } = useQuery({
    queryKey: ['transactions', uid, 0],
    queryFn: () => fetchMonthlyTransactions(uid!, 0),
    enabled: Boolean(uid),
    staleTime: 30_000,
  });

  // Compute 100% authentic scores from real database records
  const dimensions: LifeDimensionScore[] = useMemo(() => {
    // 1. Productivity: Real today task completion rate
    const allTasks = tasks ?? [];
    const completedTasks = allTasks.filter((t) => t.status === 'completed');
    const prodScore =
      allTasks.length > 0
        ? Math.min(100, Math.round((completedTasks.length / allTasks.length) * 100))
        : 0;

    // 2. Consistency: Real today habit completion rate
    const totalHabits = habits?.length ?? 0;
    const completedHabitCount = habitLogs?.length ?? 0;
    const habitScore =
      totalHabits > 0
        ? Math.min(100, Math.round((completedHabitCount / totalHabits) * 100))
        : 0;

    // 3. Deep Focus: Real completed pomodoro sessions (daily target: 4 sessions = 100%)
    const focusScore = Math.min(100, completedFocusSessions * 25);

    // 4. Financial Health: Real monthly transactions & savings ratio
    let financeScore = 0;
    const txList = transactions ?? [];
    if (txList.length > 0) {
      const summary = buildSpendingSummary(txList, currency);
      if (summary.total_income > 0) {
        if (summary.total_income >= summary.total_expenses) {
          financeScore = Math.min(
            100,
            Math.max(30, Math.round(((summary.total_income - summary.total_expenses) / summary.total_income) * 100))
          );
        } else {
          financeScore = Math.max(10, Math.round((summary.total_income / summary.total_expenses) * 50));
        }
      } else {
        financeScore = Math.min(90, Math.max(25, txList.length * 20));
      }
    }

    // 5. Mindfulness: Real notes logged & daily reflections recorded
    let mindScore = 0;
    const allNotes = notes ?? [];
    if (allNotes.length > 0) {
      const today = new Date().toISOString().slice(0, 10);
      const hasRecentNote = allNotes.some((n) => {
        const createdDate = (n.created_at || '').slice(0, 10);
        const updatedDate = (n.updated_at || '').slice(0, 10);
        return createdDate === today || updatedDate === today;
      });
      if (hasRecentNote) {
        mindScore = 100;
      } else {
        mindScore = Math.min(80, allNotes.length * 20);
      }
    }

    return [
      {
        key: 'productivity',
        label: 'Productivity',
        icon: 'checkbox-outline',
        score: prodScore,
        color: '#38BDF8',
        detail: allTasks.length > 0 ? `${completedTasks.length}/${allTasks.length} tasks done` : 'No tasks logged',
      },
      {
        key: 'consistency',
        label: 'Consistency',
        icon: 'flame-outline',
        score: habitScore,
        color: '#F59E0B',
        detail: totalHabits > 0 ? `${completedHabitCount}/${totalHabits} habits logged` : 'No habits logged',
      },
      {
        key: 'focus',
        label: 'Deep Focus',
        icon: 'timer-outline',
        score: focusScore,
        color: '#A855F7',
        detail: `${completedFocusSessions} sessions completed`,
      },
      {
        key: 'finance',
        label: 'Finance',
        icon: 'wallet-outline',
        score: financeScore,
        color: '#10B981',
        detail: `${txList.length} transactions tracked`,
      },
      {
        key: 'mindfulness',
        label: 'Mindfulness',
        icon: 'journal-outline',
        score: mindScore,
        color: '#EC4899',
        detail: `${allNotes.length} notes in vault`,
      },
    ];
  }, [tasks, habits, habitLogs, completedFocusSessions, transactions, notes, currency]);

  const scores = dimensions.map((d) => d.score);
  const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  // Concentric grid polygons
  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  // Ensure minimum 4% visual radius so points don't collapse to 0 width while preserving accurate text numbers
  const visualScores = scores.map((s) => Math.max(4, s));
  const dataPoints = calculatePolygonPoints(visualScores, MAX_RADIUS, CENTER);

  const statusHeadline =
    averageScore >= 80
      ? 'Optimal Equilibrium'
      : averageScore >= 50
      ? 'Balanced Momentum'
      : averageScore > 0
      ? 'Building Habits'
      : 'Awaiting Today Activity';

  return (
    <View
      style={[
        s.container,
        {
          backgroundColor: isDark ? 'rgba(10, 36, 56, 0.85)' : 'rgba(255, 255, 255, 0.88)',
          borderColor: isDark ? 'rgba(168, 220, 244, 0.28)' : 'rgba(255, 255, 255, 0.95)',
        },
      ]}
    >
      {/* Header */}
      <View style={s.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, { color: theme.text.primary }]}>Life Balance Equilibrium</Text>
          <Text style={[s.sub, { color: isDark ? '#819BB3' : '#64748B' }]}>
            {statusHeadline} • Live Data
          </Text>
        </View>
        <View
          style={[
            s.badge,
            {
              backgroundColor: isDark ? 'rgba(56, 189, 248, 0.18)' : 'rgba(2, 132, 199, 0.1)',
              borderColor: isDark ? 'rgba(56, 189, 248, 0.35)' : 'rgba(2, 132, 199, 0.2)',
            },
          ]}
        >
          <Text style={[s.badgeNumber, { color: isDark ? '#38BDF8' : '#0284C7' }]}>
            {averageScore}
          </Text>
          <Text style={[s.badgeLabel, { color: isDark ? '#819BB3' : '#64748B' }]}>/100</Text>
        </View>
      </View>

      {/* SVG Radar Chart */}
      <View style={s.chartWrapper}>
        <Svg width={CHART_SIZE} height={CHART_SIZE}>
          <Defs>
            <LinearGradient id="radarFill" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#38BDF8" stopOpacity={0.45} />
              <Stop offset="100%" stopColor="#6366F1" stopOpacity={0.25} />
            </LinearGradient>
          </Defs>

          {/* Concentric Web Grid */}
          {gridLevels.map((lvl) => {
            const gridPts = calculatePolygonPoints(
              Array(AXES_COUNT).fill(100),
              MAX_RADIUS * lvl,
              CENTER
            );
            return (
              <Polygon
                key={lvl}
                points={gridPts}
                stroke={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.08)'}
                strokeWidth={1}
                fill="none"
              />
            );
          })}

          {/* Radial Spokes */}
          {dimensions.map((_, i) => {
            const angle = -Math.PI / 2 + (i * 2 * Math.PI) / AXES_COUNT;
            const x = CENTER + MAX_RADIUS * Math.cos(angle);
            const y = CENTER + MAX_RADIUS * Math.sin(angle);
            return (
              <Line
                key={i}
                x1={CENTER}
                y1={CENTER}
                x2={x}
                y2={y}
                stroke={isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.1)'}
                strokeWidth={1}
              />
            );
          })}

          {/* User Data Polygon */}
          <Polygon
            points={dataPoints}
            fill="url(#radarFill)"
            stroke="#38BDF8"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />

          {/* Data Vertices */}
          {visualScores.map((score, index) => {
            const angle = -Math.PI / 2 + (index * 2 * Math.PI) / AXES_COUNT;
            const r = (score / 100) * MAX_RADIUS;
            const x = CENTER + r * Math.cos(angle);
            const y = CENTER + r * Math.sin(angle);
            return (
              <Circle
                key={index}
                cx={x}
                cy={y}
                r={4}
                fill="#38BDF8"
                stroke={isDark ? '#0A2438' : '#FFFFFF'}
                strokeWidth={1.5}
              />
            );
          })}
        </Svg>
      </View>

      {/* Metric Breakdown Grid with Real Data Metrics */}
      <View style={s.metricsGrid}>
        {dimensions.map((dim) => (
          <View key={dim.key} style={s.metricItem}>
            <View style={[s.metricDot, { backgroundColor: dim.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={[s.metricLabel, { color: isDark ? '#E2E8F0' : '#1E293B' }]}>
                {dim.label}
              </Text>
              {dim.detail && (
                <Text style={[s.metricDetail, { color: isDark ? '#819BB3' : '#64748B' }]}>
                  {dim.detail}
                </Text>
              )}
            </View>
            <Text style={[s.metricVal, { color: dim.color }]}>{dim.score}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    marginVertical: 10,
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  badgeNumber: {
    fontSize: 17,
    fontWeight: '800',
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '48%',
    paddingVertical: 2,
  },
  metricDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricDetail: {
    fontSize: 10,
    fontWeight: '400',
    marginTop: 1,
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '800',
  },
});
