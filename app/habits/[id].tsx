import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { format, subDays, isSameDay, parseISO } from 'date-fns';
import { ScreenLayout } from '../../src/components/layout/ScreenLayout';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius, shadows } from '../../src/theme/tokens';
import { supabase } from '../../src/lib/supabase/client';
import { fetchHabitLogs, logHabit, unlogHabit, archiveHabit, calculateStreak, calculateCompletionRate } from '../../src/features/habits/api';
import { useAuthStore } from '../../src/stores/authStore';
import { SkeletonCard, ErrorState } from '../../src/components/feedback';
import { Button } from '../../src/components/ui/Button';
import type { Habit, HabitLog } from '../../src/types';

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { theme } = useTheme();
  const uid = useAuthStore((s) => s.user?.id);

  const { data: habit, isLoading: habitLoading, error: habitError, refetch: refetchHabit } = useQuery<Habit>({
    queryKey: ['habit', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('habits').select('*').eq('id', id).single();
      if (error) throw new Error(error.message);
      return data as Habit;
    },
    enabled: Boolean(id)
  });

  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = useQuery<HabitLog[]>({
    queryKey: ['habit_logs', id],
    queryFn: () => fetchHabitLogs(uid!, id!, 30),
    enabled: Boolean(uid && id)
  });

  const streak = useMemo(() => (logs ? calculateStreak(logs) : 0), [logs]);
  const rate = useMemo(() => (logs && habit ? calculateCompletionRate(logs, habit, 14) : 0), [logs, habit]);

  const historyDays = useMemo(() => {
    const list: Array<{ date: Date; key: string; completed: boolean }> = [];
    const logSet = new Set((logs ?? []).map((l) => l.date));
    for (let i = 13; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const k = format(d, 'yyyy-MM-dd');
      list.push({ date: d, key: k, completed: logSet.has(k) });
    }
    return list;
  }, [logs]);

  const toggleDayMut = useMutation({
    mutationFn: async ({ dateKey, completed }: { dateKey: string; completed: boolean }) => {
      if (completed) {
        await supabase.from('habit_logs').delete().eq('user_id', uid!).eq('habit_id', id!).eq('date', dateKey);
      } else {
        await supabase.from('habit_logs').upsert({ user_id: uid!, habit_id: id!, date: dateKey, count: habit?.target_count ?? 1 }, { onConflict: 'user_id,habit_id,date' });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habit_logs'] });
      qc.invalidateQueries({ queryKey: ['habits'] });
    }
  });

  const archiveMut = useMutation({
    mutationFn: () => archiveHabit(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits'] });
      router.back();
    }
  });

  const handleArchive = () => {
    Alert.alert('Archive Habit', 'Are you sure you want to archive this habit?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Archive', style: 'destructive', onPress: () => archiveMut.mutate() }
    ]);
  };

  const isLoading = habitLoading || logsLoading;

  return (
    <ScreenLayout title="Habit Details" showBack>
      {isLoading ? (
        <View style={s.pad}><SkeletonCard /><SkeletonCard /></View>
      ) : habitError || !habit ? (
        <ErrorState message="Could not load habit." onRetry={() => { refetchHabit(); refetchLogs(); }} />
      ) : (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {/* Hero Banner */}
          <View style={[s.hero, { backgroundColor: habit.color + '15', borderColor: habit.color }]}>
            <View style={[s.iconBox, { backgroundColor: habit.color }]}>
              <Ionicons name="repeat-outline" size={28} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.title, { color: theme.text.primary }]}>{habit.title}</Text>
              <Text style={[s.sub, { color: theme.text.tertiary }]}>
                {habit.target_count} {habit.unit ?? 'times'} · {habit.frequency} ({habit.time_of_day})
              </Text>
            </View>
          </View>

          {habit.description && (
            <Text style={[s.desc, { color: theme.text.secondary }]}>{habit.description}</Text>
          )}

          {/* Stats Row: Streak & Rate */}
          <View style={s.statsRow}>
            <View style={[s.statCard, { backgroundColor: theme.surface.default, ...shadows.sm }]}>
              <Ionicons name="flame-outline" size={26} color={habit.color} />
              <Text style={[s.statVal, { color: theme.text.primary }]}>{streak} {streak === 1 ? 'day' : 'days'}</Text>
              <Text style={[s.statLbl, { color: theme.text.tertiary }]}>Current Streak</Text>
            </View>
            <View style={[s.statCard, { backgroundColor: theme.surface.default, ...shadows.sm }]}>
              <Ionicons name="pie-chart-outline" size={26} color={habit.color} />
              <Text style={[s.statVal, { color: theme.text.primary }]}>{rate}%</Text>
              <Text style={[s.statLbl, { color: theme.text.tertiary }]}>14-Day Consistency</Text>
            </View>
          </View>

          {/* 14-Day Visual Activity Grid */}
          <View style={[s.historySec, { backgroundColor: theme.surface.default, ...shadows.sm }]}>
            <Text style={[s.secTitle, { color: theme.text.primary }]}>Past 14 Days Activity</Text>
            <Text style={[s.secSub, { color: theme.text.tertiary }]}>Tap any day to toggle completion</Text>

            <View style={s.gridRow}>
              {historyDays.map((hd) => (
                <TouchableOpacity
                  key={hd.key}
                  onPress={() => toggleDayMut.mutate({ dateKey: hd.key, completed: hd.completed })}
                  style={s.gridItem}
                  accessibilityLabel={`${format(hd.date, 'MMM d')}: ${hd.completed ? 'Completed' : 'Not completed'}`}
                >
                  <View
                    style={[
                      s.dotBox,
                      {
                        backgroundColor: hd.completed ? habit.color : theme.surface.inset,
                        borderColor: isSameDay(hd.date, new Date()) ? habit.color : 'transparent'
                      }
                    ]}
                  >
                    {hd.completed && <Ionicons name="checkmark" size={14} color="#ffffff" />}
                  </View>
                  <Text style={[s.dayLabel, { color: isSameDay(hd.date, new Date()) ? habit.color : theme.text.tertiary }]}>
                    {format(hd.date, 'd')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Archive / Delete habit */}
          <Button
            label="Archive habit"
            onPress={handleArchive}
            variant="destructive"
            size="md"
            style={{ marginTop: spacing[4] }}
          />

          <View style={{ height: spacing[12] }} />
        </ScrollView>
      )}
    </ScreenLayout>
  );
}

const s = StyleSheet.create({
  pad: { padding: spacing[5] },
  content: { padding: spacing[5], gap: spacing[4] },
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing[4], padding: spacing[4], borderRadius: radius.xl, borderWidth: 1.5 },
  iconBox: { width: 52, height: 52, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  sub: { fontSize: fontSize.xs, marginTop: 2 },
  desc: { fontSize: fontSize.sm, lineHeight: 20 },
  statsRow: { flexDirection: 'row', gap: spacing[3] },
  statCard: { flex: 1, alignItems: 'center', padding: spacing[4], borderRadius: radius.lg, gap: spacing[1] },
  statVal: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  statLbl: { fontSize: fontSize.xs },
  historySec: { padding: spacing[4], borderRadius: radius.xl, gap: spacing[2] },
  secTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  secSub: { fontSize: fontSize.xs, marginBottom: spacing[2] },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing[2] },
  gridItem: { alignItems: 'center', gap: 4, width: '12%' },
  dotBox: { width: 34, height: 34, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  dayLabel: { fontSize: 10, fontWeight: fontWeight.medium }
});
