import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { format, parseISO } from 'date-fns';
import { useTheme } from '../../theme/ThemeContext';
import { useTodayTasks } from '../../features/tasks/hooks';
import { useTodayHabitLogs } from '../../features/habits/hooks';
import { useFocusStore } from '../../stores/focusStore';
import {
  generateContributionMatrix,
  ActivityRecord,
  DayContribution,
} from '../../lib/analytics/matrixCalculations';
import { fontSize, fontWeight, radius, shadows, spacing } from '../../theme/tokens';

const DAYS_HEADER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function ContributionMatrix() {
  const { theme, isDark } = useTheme();

  const { data: tasks } = useTodayTasks();
  const { data: habitLogs } = useTodayHabitLogs();
  const completedFocusSessions = useFocusStore((s) => s.completedSessions);

  const [selectedDay, setSelectedDay] = useState<DayContribution | null>(null);

  // Synthesize real user activity records
  const activities: ActivityRecord[] = useMemo(() => {
    const list: ActivityRecord[] = [];
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    // Completed tasks today
    const completedTasks = (tasks ?? []).filter((t) => t.status === 'completed');
    for (const _ of completedTasks) {
      list.push({ date: todayStr, type: 'task' });
    }

    // Habit logs today
    for (const log of habitLogs ?? []) {
      const d = log.date ? log.date.slice(0, 10) : todayStr;
      list.push({ date: d, type: 'habit' });
    }

    // Focus sessions
    for (let i = 0; i < completedFocusSessions; i++) {
      list.push({ date: todayStr, type: 'focus' });
    }

    return list;
  }, [tasks, habitLogs, completedFocusSessions]);

  const matrixWeeks = useMemo(() => {
    return generateContributionMatrix(112, activities);
  }, [activities]);

  const totalActions = activities.length;

  const getCellColor = (level: number) => {
    if (level === 0) {
      return isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.06)';
    }
    if (level === 1) return isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(2, 132, 199, 0.3)';
    if (level === 2) return isDark ? 'rgba(56, 189, 248, 0.55)' : 'rgba(2, 132, 199, 0.55)';
    if (level === 3) return isDark ? 'rgba(56, 189, 248, 0.8)' : 'rgba(2, 132, 199, 0.8)';
    return isDark ? '#38BDF8' : '#0284C7';
  };

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
        <View>
          <View style={s.titleRow}>
            <Ionicons name="grid-outline" size={15} color={isDark ? '#38BDF8' : '#0284C7'} />
            <Text style={[s.title, { color: theme.text.primary }]}>Productivity Matrix</Text>
          </View>
          <Text style={[s.sub, { color: isDark ? '#819BB3' : '#64748B' }]}>
            16-week contribution consistency
          </Text>
        </View>

        <View
          style={[
            s.badge,
            {
              backgroundColor: isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(2, 132, 199, 0.1)',
              borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(2, 132, 199, 0.2)',
            },
          ]}
        >
          <Text style={[s.badgeNumber, { color: isDark ? '#38BDF8' : '#0284C7' }]}>
            {totalActions}
          </Text>
          <Text style={[s.badgeLabel, { color: isDark ? '#819BB3' : '#64748B' }]}> logged</Text>
        </View>
      </View>

      {/* Selected Day Status Bar */}
      {selectedDay && (
        <View
          style={[
            s.selectedDayBar,
            {
              backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(2, 132, 199, 0.08)',
              borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(2, 132, 199, 0.15)',
            },
          ]}
        >
          <Ionicons name="calendar-outline" size={13} color={isDark ? '#38BDF8' : '#0284C7'} />
          <Text style={[s.selectedDayText, { color: theme.text.primary }]}>
            {format(parseISO(selectedDay.date), 'MMM d, yyyy')}:{' '}
            <Text style={{ fontWeight: '700', color: isDark ? '#38BDF8' : '#0284C7' }}>
              {selectedDay.count} {selectedDay.count === 1 ? 'action' : 'actions'}
            </Text>
          </Text>
        </View>
      )}

      {/* Grid: Day-of-week labels + Horizontally scrollable weeks */}
      <View style={s.matrixContainer}>
        {/* Left Day of Week Column */}
        <View style={s.daysColumn}>
          {DAYS_HEADER.map((d, i) => (
            <Text key={i} style={[s.dayLabel, { color: isDark ? '#819BB3' : '#64748B' }]}>
              {d}
            </Text>
          ))}
        </View>

        {/* Scrollable Weeks */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.weeksScroll}>
          {matrixWeeks.map((week, wIndex) => (
            <View key={wIndex} style={s.weekCol}>
              {week.map((day) => {
                const isSelected = selectedDay?.date === day.date;
                return (
                  <TouchableOpacity
                    key={day.date}
                    activeOpacity={0.7}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedDay(day);
                    }}
                    style={[
                      s.dot,
                      {
                        backgroundColor: getCellColor(day.level),
                        borderColor: isSelected
                          ? isDark
                            ? '#FFFFFF'
                            : '#0F172A'
                          : 'transparent',
                        borderWidth: isSelected ? 1.5 : 0,
                      },
                    ]}
                  />
                );
              })}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Legend */}
      <View style={s.legendRow}>
        <Text style={[s.legendText, { color: isDark ? '#819BB3' : '#64748B' }]}>Less</Text>
        {[0, 1, 2, 3, 4].map((lvl) => (
          <View
            key={lvl}
            style={[
              s.legendDot,
              {
                backgroundColor: getCellColor(lvl),
              },
            ]}
          />
        ))}
        <Text style={[s.legendText, { color: isDark ? '#819BB3' : '#64748B' }]}>More</Text>
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
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeNumber: {
    fontSize: 14,
    fontWeight: '800',
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  selectedDayBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  selectedDayText: {
    fontSize: 12,
  },
  matrixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  daysColumn: {
    gap: 3.5,
    marginRight: 6,
  },
  dayLabel: {
    fontSize: 9,
    fontWeight: '700',
    width: 10,
    height: 12,
    lineHeight: 12,
    textAlign: 'center',
  },
  weeksScroll: {
    gap: 3.5,
    paddingRight: 10,
  },
  weekCol: {
    gap: 3.5,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 2.5,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 12,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '500',
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 2,
  },
});
