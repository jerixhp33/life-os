import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format, isToday, parseISO, isPast } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius, shadows } from '../../src/theme/tokens';
import { SkeletonCard, EmptyState, ErrorState } from '../../src/components/feedback';
import {
  useTasks,
  useCompleteTask,
  useDeleteTask,
} from '../../src/features/tasks/hooks';
import { OmniCaptureBar } from '../../src/components/intelligence/OmniCaptureBar';
import type { Task, TaskPriority } from '../../src/types';

const PRIORITY_META: Record<
  TaskPriority,
  { label: string; color: string; gradient: [string, string]; bg: string }
> = {
  urgent: { label: 'Urgent', color: '#EF4444', gradient: ['#DC2626', '#EF4444'], bg: 'rgba(239, 68, 68, 0.14)' },
  high:   { label: 'High',   color: '#F97316', gradient: ['#EA580C', '#F97316'], bg: 'rgba(249, 115, 22, 0.14)' },
  medium: { label: 'Medium', color: '#F59E0B', gradient: ['#D97706', '#F59E0B'], bg: 'rgba(245, 158, 11, 0.14)' },
  low:    { label: 'Low',    color: '#0284C7', gradient: ['#0369A1', '#0284C7'], bg: 'rgba(2, 132, 199, 0.14)' },
};

const CATEGORY_COLORS: Record<string, string> = {
  Work: '#6366F1',
  Personal: '#06B6D4',
  Health: '#10B981',
  Learning: '#8B5CF6',
  Finance: '#F59E0B',
};

const FILTERS = [
  { k: 'all', l: 'All' },
  { k: 'today', l: 'Today' },
  { k: 'pending', l: 'Pending' },
  { k: 'completed', l: 'Done' },
] as const;

export default function TasksScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'today' | 'pending' | 'completed'>('all');

  const { data: tasks, isLoading, error, refetch } = useTasks();
  const complete = useCompleteTask();
  const del = useDeleteTask();

  const allTasks = tasks ?? [];
  const pendingCount = allTasks.filter((t) => t.status !== 'completed').length;
  const completedCount = allTasks.filter((t) => t.status === 'completed').length;
  const urgentCount = allTasks.filter(
    (t) => (t.priority === 'urgent' || t.priority === 'high') && t.status !== 'completed'
  ).length;

  const filtered = useMemo(() => {
    return allTasks.filter((t) => {
      // Search match
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesCat = t.category?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCat) return false;
      }

      // Filter match
      if (filter === 'all') return true;
      if (filter === 'completed') return t.status === 'completed';
      if (filter === 'pending') return t.status !== 'completed';
      if (filter === 'today') {
        if (!t.due_date) return false;
        try {
          return isToday(parseISO(t.due_date));
        } catch {
          return false;
        }
      }
      return true;
    });
  }, [allTasks, search, filter]);

  const handleDelete = (t: Task) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Delete Task', `Delete "${t.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => del.mutate(t.id),
      },
    ]);
  };

  const handleToggle = (t: Task) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    complete.mutate(t.id);
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg.primary }]} edges={['top', 'left', 'right']}>
      {/* Radiant Glowing Background Light */}
      <View pointerEvents="none" style={s.ambientGlowContainer}>
        <LinearGradient
          colors={
            isDark
              ? ['rgba(99, 102, 241, 0.25)', 'rgba(56, 189, 248, 0.16)', 'transparent']
              : ['rgba(199, 210, 254, 0.50)', 'rgba(224, 242, 254, 0.35)', 'transparent']
          }
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 0.8 }}
          style={s.ambientGlow}
        />
      </View>

      {/* ============================================================== */}
      {/* 1. TOP HEADER WITH GLOSSY "+ NEW TASK" BUTTON                  */}
      {/* ============================================================== */}
      <Animated.View entering={FadeInDown.duration(400)} style={s.header}>
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
              <Ionicons name="checkbox" size={11} color={isDark ? '#38BDF8' : '#0284C7'} />
              <Text style={[s.headerBadgeText, { color: isDark ? '#38BDF8' : '#0284C7' }]}>
                Daily Execution & Tasks
              </Text>
            </View>
          </View>
          <Text style={[s.title, { color: theme.text.primary }]}>My Tasks</Text>
          <Text style={[s.subtitle, { color: isDark ? '#819BB3' : '#64748B' }]}>
            Organize priorities with intelligent capture
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/tasks/new');
          }}
          style={s.addBtnContainer}
          activeOpacity={0.85}
          accessibilityLabel="Add New Task"
        >
          <LinearGradient
            colors={['#4338CA', '#4F46E5', '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.addBtnGradient}
          >
            <Ionicons name="add" size={19} color="#FFFFFF" />
            <Text style={s.addBtnText}>New Task</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* ============================================================== */}
      {/* 2. UNIVERSAL OMNI-BOX (AI FAST CAPTURE)                        */}
      {/* ============================================================== */}
      <Animated.View entering={FadeInUp.duration(400).delay(60)} style={s.omniWrap}>
        <OmniCaptureBar
          placeholder="e.g. Call client tomorrow 4pm #work !urgent"
          onSuccess={() => refetch()}
        />
      </Animated.View>

      {/* ============================================================== */}
      {/* 3. THREE GLOSSY KPI CARDS                                      */}
      {/* ============================================================== */}
      <Animated.View entering={FadeInUp.duration(400).delay(100)} style={s.kpiRow}>
        {/* Card 1: Pending */}
        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            setFilter('pending');
          }}
          activeOpacity={0.8}
          style={[
            s.kpiCard,
            {
              backgroundColor: isDark ? 'rgba(10, 36, 56, 0.85)' : 'rgba(255, 255, 255, 0.88)',
              borderColor: filter === 'pending' ? '#0284C7' : isDark ? 'rgba(168, 220, 244, 0.28)' : 'rgba(255, 255, 255, 0.95)',
              ...shadows.sm,
            },
          ]}
        >
          <View style={[s.kpiIconBox, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.20)' : 'rgba(240, 249, 255, 0.95)' }]}>
            <Ionicons name="time-outline" size={17} color="#0284C7" />
          </View>
          <Text style={[s.kpiNumber, { color: theme.text.primary }]}>{pendingCount}</Text>
          <Text style={[s.kpiLabel, { color: isDark ? '#819BB3' : '#64748B' }]}>Pending</Text>
        </TouchableOpacity>

        {/* Card 2: Urgent / Priority */}
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
              borderColor: isDark ? 'rgba(168, 220, 244, 0.28)' : 'rgba(255, 255, 255, 0.95)',
              ...shadows.sm,
            },
          ]}
        >
          <View style={[s.kpiIconBox, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.20)' : 'rgba(254, 242, 242, 0.95)' }]}>
            <Ionicons name="flame" size={17} color="#EF4444" />
          </View>
          <Text style={[s.kpiNumber, { color: theme.text.primary }]}>{urgentCount}</Text>
          <Text style={[s.kpiLabel, { color: isDark ? '#819BB3' : '#64748B' }]}>Urgent</Text>
        </TouchableOpacity>

        {/* Card 3: Completed */}
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
            <Ionicons name="checkmark-done" size={17} color="#10B981" />
          </View>
          <Text style={[s.kpiNumber, { color: theme.text.primary }]}>{completedCount}</Text>
          <Text style={[s.kpiLabel, { color: isDark ? '#819BB3' : '#64748B' }]}>Done</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ============================================================== */}
      {/* 4. SEGMENTED FILTER PILL BAR                                    */}
      {/* ============================================================== */}
      <Animated.View entering={FadeInUp.duration(400).delay(140)} style={s.filterWrap}>
        <View
          style={[
            s.segmentBar,
            {
              backgroundColor: isDark ? 'rgba(10, 36, 56, 0.82)' : 'rgba(226, 232, 240, 0.65)',
              borderColor: isDark ? 'rgba(168, 220, 244, 0.25)' : 'rgba(255, 255, 255, 0.95)',
            },
          ]}
        >
          {FILTERS.map((f) => {
            const isSelected = filter === f.k;
            return (
              <TouchableOpacity
                key={f.k}
                onPress={() => {
                  Haptics.selectionAsync();
                  setFilter(f.k);
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
                  {f.l}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>

      {/* ============================================================== */}
      {/* 5. TASKS LIST WITH FROSTED GLASS CARDS                         */}
      {/* ============================================================== */}
      {error ? (
        <ErrorState message="Could not load tasks." onRetry={refetch} />
      ) : isLoading ? (
        <View style={s.listContent}>
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : !filtered.length ? (
        <EmptyState
          icon="checkbox-outline"
          title={search ? 'No matching tasks' : 'All caught up!'}
          description={
            search
              ? 'Try adjusting your search terms or filter.'
              : 'Add a new task using the smart input above.'
          }
          actionLabel="+ New Task"
          onAction={() => router.push('/tasks/new')}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(t) => t.id}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: t, index }) => {
            const pMeta = PRIORITY_META[t.priority] ?? PRIORITY_META.medium;
            const isDone = t.status === 'completed';
            const catColor = (t.category && CATEGORY_COLORS[t.category]) || '#6366F1';

            // Due date status
            let dueText = '';
            let isOverdue = false;
            if (t.due_date) {
              try {
                const parsed = parseISO(t.due_date);
                if (isToday(parsed)) {
                  dueText = `Today${t.due_time ? ' ' + t.due_time : ''}`;
                } else {
                  dueText = format(parsed, 'MMM d');
                }
                if (isPast(parsed) && !isToday(parsed) && !isDone) {
                  isOverdue = true;
                }
              } catch {}
            }

            return (
              <Animated.View entering={FadeInUp.duration(380).delay(index * 40)}>
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => router.push(`/tasks/${t.id}` as never)}
                  style={[
                    s.taskCard,
                    {
                      backgroundColor: isDark ? 'rgba(10, 36, 56, 0.88)' : 'rgba(255, 255, 255, 0.92)',
                      borderColor: isDark ? 'rgba(168, 220, 244, 0.28)' : 'rgba(255, 255, 255, 0.95)',
                      ...shadows.sm,
                    },
                  ]}
                >
                  <View style={s.cardMainRow}>
                    {/* Circular Checkbox matching Home design */}
                    <TouchableOpacity
                      onPress={() => handleToggle(t)}
                      style={[
                        s.circularCheck,
                        {
                          borderColor: isDone
                            ? '#6366F1'
                            : isDark
                            ? 'rgba(255, 255, 255, 0.35)'
                            : '#CBD5E1',
                          backgroundColor: isDone ? '#6366F1' : 'transparent',
                        },
                      ]}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      accessibilityRole="checkbox"
                    >
                      {isDone && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                    </TouchableOpacity>

                    {/* Task Title & Metadata */}
                    <View style={s.taskBody}>
                      <Text
                        style={[
                          s.taskTitle,
                          {
                            color: isDone
                              ? isDark
                                ? '#64748B'
                                : '#94A3B8'
                              : theme.text.primary,
                            textDecorationLine: isDone ? 'line-through' : 'none',
                          },
                        ]}
                        numberOfLines={2}
                      >
                        {t.title}
                      </Text>

                      {/* Meta chips row */}
                      <View style={s.metaRow}>
                        {t.category ? (
                          <View
                            style={[
                              s.catChip,
                              { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)' },
                            ]}
                          >
                            <View style={[s.catDot, { backgroundColor: catColor }]} />
                            <Text style={[s.catText, { color: theme.text.secondary }]}>
                              {t.category}
                            </Text>
                          </View>
                        ) : null}

                        {dueText ? (
                          <View
                            style={[
                              s.dateChip,
                              {
                                backgroundColor: isOverdue
                                  ? 'rgba(239, 68, 68, 0.12)'
                                  : isDark
                                  ? 'rgba(255,255,255,0.06)'
                                  : 'rgba(15,23,42,0.05)',
                              },
                            ]}
                          >
                            <Ionicons
                              name="time-outline"
                              size={11}
                              color={isOverdue ? '#EF4444' : isDark ? '#94A3B8' : '#64748B'}
                            />
                            <Text
                              style={[
                                s.dateText,
                                {
                                  color: isOverdue
                                    ? '#EF4444'
                                    : isDark
                                    ? '#94A3B8'
                                    : '#64748B',
                                },
                              ]}
                            >
                              {dueText}
                            </Text>
                          </View>
                        ) : null}

                        {/* Priority Pill */}
                        <View style={[s.priorityPill, { backgroundColor: pMeta.bg }]}>
                          <Text style={[s.priorityText, { color: pMeta.color }]}>
                            {pMeta.label}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Delete action */}
                    <TouchableOpacity
                      onPress={() => handleDelete(t)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={s.trashBtn}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color={isDark ? '#64748B' : '#94A3B8'}
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          }}
        />
      )}
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
  omniWrap: { paddingHorizontal: spacing[5], marginTop: spacing[2] },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: spacing[5],
    marginTop: spacing[3],
  },
  kpiCard: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1.2,
  },
  kpiIconBox: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  kpiNumber: { fontSize: 17, fontWeight: fontWeight.bold, letterSpacing: -0.3 },
  kpiLabel: { fontSize: 10, fontWeight: fontWeight.medium, marginTop: 1 },
  filterWrap: { paddingHorizontal: spacing[5], marginTop: spacing[3] },
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
  listContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    paddingBottom: 130, // Clearance for bottom dock
    gap: spacing[2] + 2,
  },
  taskCard: {
    borderRadius: 20,
    padding: spacing[4],
    borderWidth: 1.2,
  },
  cardMainRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  circularCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  taskBody: { flex: 1, gap: 6 },
  taskTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, lineHeight: 21 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  catDot: { width: 6, height: 6, borderRadius: 3 },
  catText: { fontSize: 10, fontWeight: fontWeight.medium },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  dateText: { fontSize: 10, fontWeight: fontWeight.medium },
  priorityPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.full },
  priorityText: { fontSize: 9, fontWeight: fontWeight.bold, textTransform: 'uppercase' },
  trashBtn: { padding: 4, marginTop: 1 },
});
