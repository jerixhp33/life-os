import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useTodayTasks } from '../../features/tasks/hooks';
import { useTodayHabitLogs, useHabits } from '../../features/habits/hooks';
import { useUpcomingEvents } from '../../features/calendar/hooks';
import { useFocusStore } from '../../stores/focusStore';
import { fontSize, fontWeight, shadows, spacing } from '../../theme/tokens';
import type { Task, Habit } from '../../types';

interface ActionPill {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  actionText: string;
  gradient: [string, string];
  onPress: () => void;
}

export function SmartActionPills() {
  const { theme, isDark } = useTheme();
  const router = useRouter();

  const { data: tasks } = useTodayTasks();
  const { data: habits } = useHabits();
  const { data: habitLogs } = useTodayHabitLogs();
  const { data: upcomingEvents } = useUpcomingEvents(3);

  const startFocus = useFocusStore((s) => s.start);

  const pills: ActionPill[] = useMemo(() => {
    const list: ActionPill[] = [];
    const hour = new Date().getHours();

    const pendingTasks = (tasks ?? []).filter((t) => t.status !== 'completed');
    const urgentTask = pendingTasks.find((t) => t.priority === 'urgent' || t.priority === 'high');

    const completedHabitIds = new Set((habitLogs ?? []).map((l) => l.habit_id));
    const pendingHabits = (habits ?? []).filter((h) => !completedHabitIds.has(h.id));

    // 1. Time-of-day predictive action
    if (hour >= 5 && hour < 12) {
      list.push({
        id: 'morning-brief',
        icon: 'sunny-outline',
        label: 'Morning Focus',
        actionText: 'Plan Daily Priorities',
        gradient: ['#F59E0B', '#F97316'],
        onPress: () => router.push('/tasks'),
      });
    } else if (hour >= 12 && hour < 17) {
      if (urgentTask) {
        list.push({
          id: 'focus-urgent',
          icon: 'timer-outline',
          label: 'Deep Work',
          actionText: `Focus on ${urgentTask.title.slice(0, 18)}...`,
          gradient: ['#F59E0B', '#EA580C'],
          onPress: () => {
            startFocus({ id: urgentTask.id, title: urgentTask.title }, 25);
            router.push('/focus');
          },
        });
      } else {
        list.push({
          id: 'quick-focus',
          icon: 'timer-outline',
          label: 'Sprint',
          actionText: 'Start 25m Focus Block',
          gradient: ['#F59E0B', '#D97706'],
          onPress: () => {
            startFocus(undefined, 25);
            router.push('/focus');
          },
        });
      }
    } else {
      list.push({
        id: 'evening-habits',
        icon: 'moon-outline',
        label: 'Evening Wrap',
        actionText: pendingHabits.length > 0 ? `Check ${pendingHabits.length} Habits` : 'Reflect on Day',
        gradient: ['#7C3AED', '#A855F7'],
        onPress: () => router.push(pendingHabits.length > 0 ? '/habits' : '/notes/new'),
      });
    }

    // 2. Next Upcoming Meeting / Event
    if (upcomingEvents && upcomingEvents.length > 0) {
      const nextEv = upcomingEvents[0];
      list.push({
        id: `ev-${nextEv.id}`,
        icon: 'calendar-outline',
        label: 'Up Next',
        actionText: nextEv.title.slice(0, 20),
        gradient: ['#E11D48', '#FB7185'],
        onPress: () => router.push(`/calendar/${nextEv.id}`),
      });
    }

    // 3. Quick Expense Logger
    list.push({
      id: 'quick-expense',
      icon: 'receipt-outline',
      label: 'Finance',
      actionText: 'Scan Bill or Log',
      gradient: ['#059669', '#10B981'],
      onPress: () => router.push('/finance'),
    });

    // 4. Quick Idea / Meeting Note
    list.push({
      id: 'quick-note',
      icon: 'sparkles-outline',
      label: 'Idea',
      actionText: 'Capture Thought',
      gradient: ['#4F46E5', '#6366F1'],
      onPress: () => router.push('/notes/new'),
    });

    return list;
  }, [tasks, habits, habitLogs, upcomingEvents, router, startFocus]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Ionicons
            name="flash-outline"
            size={13}
            color={isDark ? '#38BDF8' : '#0284C7'}
          />
          <Text style={[styles.title, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            Smart Actions
          </Text>
        </View>
        <Text style={[styles.proactiveHint, { color: isDark ? '#64748B' : '#94A3B8' }]}>
          Context Aware
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {pills.map((pill) => (
          <TouchableOpacity
            key={pill.id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              pill.onPress();
            }}
            activeOpacity={0.8}
            style={[
              styles.pillCard,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.06)'
                  : 'rgba(255, 255, 255, 0.85)',
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.16)'
                  : 'rgba(15, 23, 42, 0.08)',
              },
            ]}
          >
            {/* Top Specular Hairline */}
            <View
              style={[
                styles.specularShine,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.35)'
                    : 'rgba(255, 255, 255, 0.95)',
                },
              ]}
            />

            <LinearGradient
              colors={pill.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconSquircle}
            >
              <Ionicons name={pill.icon} size={14} color="#FFFFFF" />
            </LinearGradient>

            <View style={styles.pillTextWrap}>
              <Text
                style={[
                  styles.pillLabel,
                  { color: isDark ? '#A89F91' : '#64748B' },
                ]}
              >
                {pill.label}
              </Text>
              <Text
                style={[
                  styles.pillAction,
                  { color: theme.text.primary },
                ]}
                numberOfLines={1}
              >
                {pill.actionText}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={12}
              color={isDark ? '#64748B' : '#94A3B8'}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  proactiveHint: {
    fontSize: 10,
    fontWeight: '500',
  },
  scrollList: {
    gap: 10,
    paddingRight: 16,
  },
  pillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 16,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
    ...shadows.sm,
  },
  specularShine: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: 1,
  },
  iconSquircle: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillTextWrap: {
    maxWidth: 150,
  },
  pillLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  pillAction: {
    fontSize: 12,
    fontWeight: '700',
  },
});
