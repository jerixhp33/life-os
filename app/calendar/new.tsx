import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Switch, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { format, addHours } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ScreenLayout } from '../../src/components/layout/ScreenLayout';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius } from '../../src/theme/tokens';
import { createEvent } from '../../src/features/calendar/api';
import { useAuthStore } from '../../src/stores/authStore';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import type { EventColor } from '../../src/types';

const COLORS: Array<{ k: EventColor; c: string; label: string }> = [
  { k: 'violet', c: '#818CF8', label: 'Indigo' },
  { k: 'blue', c: '#3B82F6', label: 'Azure' },
  { k: 'green', c: '#10B981', label: 'Emerald' },
  { k: 'yellow', c: '#38BDF8', label: 'Sky' },
  { k: 'red', c: '#EF4444', label: 'Red' },
  { k: 'pink', c: '#A5B4FC', label: 'Periwinkle' },
  { k: 'orange', c: '#60A5FA', label: 'Cobalt' }
];

const REMINDERS = [
  { label: 'None', value: null },
  { label: '15 minutes before', value: 15 },
  { label: '30 minutes before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '1 day before', value: 1440 }
];

export default function NewEventScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { theme } = useTheme();
  const uid = useAuthStore((s) => s.user?.id);
  const profile = useAuthStore((s) => s.profile);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [startAt, setStartAt] = useState<Date>(new Date());
  const [endAt, setEndAt] = useState<Date>(addHours(new Date(), 1));
  const [color, setColor] = useState<EventColor>('violet');
  const [reminder, setReminder] = useState<number | null>(30);

  const [dateMode, setDateMode] = useState<'start' | 'end' | null>(null);
  const [timeMode, setTimeMode] = useState<'start' | 'end' | null>(null);

  const createMut = useMutation({
    mutationFn: () => {
      if (!title.trim()) throw new Error('Event title is required.');
      if (!allDay && endAt <= startAt) throw new Error('End time must be after start time.');
      return createEvent(
        uid!,
        {
          title: title.trim(),
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          all_day: allDay,
          start_at: startAt.toISOString(),
          end_at: endAt.toISOString(),
          color,
          reminder_minutes: reminder
        },
        profile?.timezone ?? 'UTC'
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['events:upcoming'] });
      router.back();
    },
    onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'Could not create event.')
  });

  return (
    <ScreenLayout
      title="New Event"
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
        <Input label="Title" value={title} onChangeText={setTitle} placeholder="Event title" autoFocus />

        {/* Location & Description */}
        <Input label="Location (optional)" value={location} onChangeText={setLocation} placeholder="Office, Zoom, Home..." />
        <Input label="Description (optional)" value={description} onChangeText={setDescription} placeholder="Meeting agenda or details..." multiline numberOfLines={3} />

        {/* All Day Toggle */}
        <View style={[s.switchRow, { borderColor: theme.border.subtle }]}>
          <Text style={[s.switchLabel, { color: theme.text.primary }]}>All-day event</Text>
          <Switch value={allDay} onValueChange={setAllDay} trackColor={{ true: theme.brand.primary }} />
        </View>

        {/* Date / Time Pickers */}
        <View style={s.dateTimeSec}>
          {/* Start */}
          <Text style={[s.label, { color: theme.text.secondary }]}>Starts</Text>
          <View style={s.pickerRow}>
            <TouchableOpacity
              onPress={() => setDateMode('start')}
              style={[s.pickBtn, { backgroundColor: theme.surface.inset, borderColor: theme.border.default }]}
            >
              <Ionicons name="calendar-outline" size={16} color={theme.text.tertiary} />
              <Text style={{ color: theme.text.primary, fontSize: fontSize.sm }}>{format(startAt, 'EEE, MMM d, yyyy')}</Text>
            </TouchableOpacity>
            {!allDay && (
              <TouchableOpacity
                onPress={() => setTimeMode('start')}
                style={[s.pickBtn, { backgroundColor: theme.surface.inset, borderColor: theme.border.default }]}
              >
                <Ionicons name="time-outline" size={16} color={theme.text.tertiary} />
                <Text style={{ color: theme.text.primary, fontSize: fontSize.sm }}>{format(startAt, 'h:mm a')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* End */}
          <Text style={[s.label, { color: theme.text.secondary, marginTop: spacing[2] }]}>Ends</Text>
          <View style={s.pickerRow}>
            <TouchableOpacity
              onPress={() => setDateMode('end')}
              style={[s.pickBtn, { backgroundColor: theme.surface.inset, borderColor: theme.border.default }]}
            >
              <Ionicons name="calendar-outline" size={16} color={theme.text.tertiary} />
              <Text style={{ color: theme.text.primary, fontSize: fontSize.sm }}>{format(endAt, 'EEE, MMM d, yyyy')}</Text>
            </TouchableOpacity>
            {!allDay && (
              <TouchableOpacity
                onPress={() => setTimeMode('end')}
                style={[s.pickBtn, { backgroundColor: theme.surface.inset, borderColor: theme.border.default }]}
              >
                <Ionicons name="time-outline" size={16} color={theme.text.tertiary} />
                <Text style={{ color: theme.text.primary, fontSize: fontSize.sm }}>{format(endAt, 'h:mm a')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {dateMode && (
          <DateTimePicker
            value={dateMode === 'start' ? startAt : endAt}
            mode="date"
            onChange={(_, d) => {
              const cur = dateMode;
              setDateMode(null);
              if (d) {
                if (cur === 'start') {
                  const updated = new Date(startAt);
                  updated.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
                  setStartAt(updated);
                  if (endAt <= updated) setEndAt(addHours(updated, 1));
                } else {
                  const updated = new Date(endAt);
                  updated.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
                  setEndAt(updated);
                }
              }
            }}
          />
        )}

        {timeMode && (
          <DateTimePicker
            value={timeMode === 'start' ? startAt : endAt}
            mode="time"
            onChange={(_, d) => {
              const cur = timeMode;
              setTimeMode(null);
              if (d) {
                if (cur === 'start') {
                  const updated = new Date(startAt);
                  updated.setHours(d.getHours(), d.getMinutes());
                  setStartAt(updated);
                  if (endAt <= updated) setEndAt(addHours(updated, 1));
                } else {
                  const updated = new Date(endAt);
                  updated.setHours(d.getHours(), d.getMinutes());
                  setEndAt(updated);
                }
              }
            }}
          />
        )}

        {/* Color Accent Picker */}
        <View style={s.sec}>
          <Text style={[s.label, { color: theme.text.secondary }]}>Color Tag</Text>
          <View style={s.colorRow}>
            {COLORS.map((item) => (
              <TouchableOpacity
                key={item.k}
                onPress={() => setColor(item.k)}
                style={[
                  s.colorDot,
                  { backgroundColor: item.c },
                  color === item.k && s.colorDotActive
                ]}
                accessibilityLabel={item.label}
              >
                {color === item.k && <Ionicons name="checkmark" size={16} color="#ffffff" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Reminder Picker */}
        <View style={s.sec}>
          <Text style={[s.label, { color: theme.text.secondary }]}>Notification Reminder</Text>
          <View style={s.reminderWrap}>
            {REMINDERS.map((r) => (
              <TouchableOpacity
                key={String(r.value)}
                onPress={() => setReminder(r.value)}
                style={[
                  s.reminderChip,
                  {
                    backgroundColor: reminder === r.value ? theme.brand.primary : theme.surface.inset,
                    borderColor: reminder === r.value ? theme.brand.primary : theme.border.subtle
                  }
                ]}
              >
                <Text style={{ color: reminder === r.value ? '#ffffff' : theme.text.secondary, fontSize: fontSize.xs, fontWeight: fontWeight.medium }}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          label="Create Event"
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
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing[3], borderBottomWidth: 1 },
  switchLabel: { fontSize: fontSize.base, fontWeight: fontWeight.medium },
  dateTimeSec: { gap: spacing[2] },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  pickerRow: { flexDirection: 'row', gap: spacing[3] },
  pickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing[2], padding: spacing[3], borderRadius: radius.md, borderWidth: 1 },
  sec: { gap: spacing[2] },
  colorRow: { flexDirection: 'row', gap: spacing[3], alignItems: 'center' },
  colorDot: { width: 34, height: 34, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  colorDotActive: { borderWidth: 3, borderColor: '#ffffff', elevation: 4 },
  reminderWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  reminderChip: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.md, borderWidth: 1 }
});
