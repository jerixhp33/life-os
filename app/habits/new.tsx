import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { ScreenLayout } from '../../src/components/layout/ScreenLayout';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius } from '../../src/theme/tokens';
import { createHabit } from '../../src/features/habits/api';
import { scheduleDailyHabitRoutine } from '../../src/lib/notifications/service';
import { useAuthStore } from '../../src/stores/authStore';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import type { HabitFrequency, HabitTimeOfDay } from '../../src/types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TIMES: Array<{ k: HabitTimeOfDay; l: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { k: 'morning', l: 'Morning', icon: 'sunny-outline' },
  { k: 'afternoon', l: 'Afternoon', icon: 'partly-sunny-outline' },
  { k: 'evening', l: 'Evening', icon: 'moon-outline' },
  { k: 'anytime', l: 'Anytime', icon: 'time-outline' }
];

const COLORS = ['#6957E8', '#3B82F6', '#23865A', '#F59E0B', '#C53B45', '#EC4899', '#8B5CF6'];

export default function NewHabitScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { theme } = useTheme();
  const uid = useAuthStore((s) => s.user?.id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetCount, setTargetCount] = useState('1');
  const [unit, setUnit] = useState('times');
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [timeOfDay, setTimeOfDay] = useState<HabitTimeOfDay>('anytime');
  const [color, setColor] = useState('#6957E8');

  const toggleDay = (idx: number) => {
    if (selectedDays.includes(idx)) {
      if (selectedDays.length === 1) return; // Keep at least one
      setSelectedDays((d) => d.filter((x) => x !== idx));
    } else {
      setSelectedDays((d) => [...d, idx].sort());
    }
  };

  const createMut = useMutation({
    mutationFn: () => {
      if (!title.trim()) throw new Error('Habit name is required.');
      const count = parseInt(targetCount, 10);
      if (isNaN(count) || count < 1) throw new Error('Target count must be at least 1.');
      return createHabit(uid!, {
        title: title.trim(),
        description: description.trim() || undefined,
        icon: 'repeat-outline',
        color,
        frequency,
        days_of_week: selectedDays,
        time_of_day: timeOfDay,
        target_count: count,
        unit: unit.trim() || undefined
      });
    },
    onSuccess: async (createdHabit) => {
      if (createdHabit?.id) {
        await scheduleDailyHabitRoutine(createdHabit.id, createdHabit.title, timeOfDay).catch(() => {});
      }
      qc.invalidateQueries({ queryKey: ['habits'] });
      qc.invalidateQueries({ queryKey: ['habit_logs'] });
      router.back();
    },
    onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'Could not create habit.')
  });

  return (
    <ScreenLayout
      title="Create Habit"
      showBack
      rightAction={
        <TouchableOpacity
          onPress={() => createMut.mutate()}
          disabled={createMut.isPending}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={{ color: theme.brand.primary, fontSize: fontSize.base, fontWeight: fontWeight.semibold }}>
            {createMut.isPending ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      }
      keyboardAvoid
    >
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Input label="Habit Name" value={title} onChangeText={setTitle} placeholder="e.g. Read 20 pages" autoFocus />

        {/* Description */}
        <Input label="Description (optional)" value={description} onChangeText={setDescription} placeholder="Why or how you will build this habit..." />

        {/* Target Count & Unit */}
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Input label="Target" value={targetCount} onChangeText={setTargetCount} keyboardType="number-pad" placeholder="1" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Unit" value={unit} onChangeText={setUnit} placeholder="times, pages, mins..." />
          </View>
        </View>

        {/* Frequency */}
        <View style={s.sec}>
          <Text style={[s.label, { color: theme.text.secondary }]}>Frequency</Text>
          <View style={s.freqRow}>
            {(['daily', 'weekly', 'custom'] as HabitFrequency[]).map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => {
                  setFrequency(f);
                  if (f === 'daily') setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
                }}
                style={[
                  s.freqChip,
                  {
                    backgroundColor: frequency === f ? theme.brand.primary : theme.surface.inset,
                    borderColor: frequency === f ? theme.brand.primary : theme.border.subtle
                  }
                ]}
              >
                <Text style={{ color: frequency === f ? '#ffffff' : theme.text.secondary, fontSize: fontSize.sm, fontWeight: fontWeight.medium }}>
                  {f[0].toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Day Selector */}
        <View style={s.sec}>
          <Text style={[s.label, { color: theme.text.secondary }]}>Active Days</Text>
          <View style={s.daysRow}>
            {DAYS.map((d, i) => {
              const active = selectedDays.includes(i);
              return (
                <TouchableOpacity
                  key={d}
                  onPress={() => toggleDay(i)}
                  style={[
                    s.dayCircle,
                    {
                      backgroundColor: active ? color : theme.surface.inset,
                      borderColor: active ? color : theme.border.default
                    }
                  ]}
                >
                  <Text style={{ color: active ? '#ffffff' : theme.text.secondary, fontSize: fontSize.xs, fontWeight: fontWeight.semibold }}>
                    {d[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Time of Day */}
        <View style={s.sec}>
          <Text style={[s.label, { color: theme.text.secondary }]}>Time of Day</Text>
          <View style={s.timesRow}>
            {TIMES.map((t) => {
              const selected = timeOfDay === t.k;
              return (
                <TouchableOpacity
                  key={t.k}
                  onPress={() => setTimeOfDay(t.k)}
                  style={[
                    s.timeChip,
                    {
                      backgroundColor: selected ? theme.brand.primaryBg : theme.surface.inset,
                      borderColor: selected ? theme.brand.primary : 'transparent'
                    }
                  ]}
                >
                  <Ionicons name={t.icon} size={16} color={selected ? theme.brand.primary : theme.text.tertiary} />
                  <Text style={{ color: selected ? theme.brand.primary : theme.text.secondary, fontSize: fontSize.xs, fontWeight: fontWeight.medium }}>
                    {t.l}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Color Accent */}
        <View style={s.sec}>
          <Text style={[s.label, { color: theme.text.secondary }]}>Color Accent</Text>
          <View style={s.colorRow}>
            {COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setColor(c)}
                style={[s.colorCircle, { backgroundColor: c }, color === c && s.colorActive]}
              >
                {color === c && <Ionicons name="checkmark" size={16} color="#ffffff" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          label="Create Habit"
          onPress={() => createMut.mutate()}
          loading={createMut.isPending}
          variant="primary"
          size="lg"
          fullWidth
          style={{ marginTop: spacing[4] }}
        />

        <View style={{ height: spacing[12] }} />
      </ScrollView>
    </ScreenLayout>
  );
}

const s = StyleSheet.create({
  content: { padding: spacing[5], gap: spacing[4] },
  row: { flexDirection: 'row', gap: spacing[3] },
  sec: { gap: spacing[2] },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  freqRow: { flexDirection: 'row', gap: spacing[2] },
  freqChip: { flex: 1, alignItems: 'center', paddingVertical: spacing[2], borderRadius: radius.md, borderWidth: 1 },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCircle: { width: 40, height: 40, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  timesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  timeChip: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.md, borderWidth: 1 },
  colorRow: { flexDirection: 'row', gap: spacing[3] },
  colorCircle: { width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  colorActive: { borderWidth: 3, borderColor: '#ffffff', elevation: 3 }
});
