import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { ScreenLayout } from '../../src/components/layout/ScreenLayout';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius } from '../../src/theme/tokens';
import { supabase } from '../../src/lib/supabase/client';
import { updateEvent, deleteEvent } from '../../src/features/calendar/api';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { SkeletonCard, ErrorState } from '../../src/components/feedback';
import type { CalendarEvent, EventColor } from '../../src/types';

const COLORS: Record<EventColor, string> = {
  violet: '#818CF8',
  blue: '#3B82F6',
  green: '#10B981',
  yellow: '#38BDF8',
  red: '#EF4444',
  pink: '#A5B4FC',
  orange: '#60A5FA'
};

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { theme } = useTheme();

  const { data: event, isLoading, error, refetch } = useQuery<CalendarEvent>({
    queryKey: ['event', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select('*').eq('id', id).single();
      if (error) throw new Error(error.message);
      return data as CalendarEvent;
    },
    enabled: Boolean(id)
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [color, setColor] = useState<EventColor>('violet');

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description ?? '');
      setLocation(event.location ?? '');
      setColor(event.color);
    }
  }, [event]);

  const updateMut = useMutation({
    mutationFn: () =>
      updateEvent(id!, {
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        color
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event', id] });
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['events:upcoming'] });
      Alert.alert('Saved', 'Event updated successfully.');
    },
    onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'Could not update event.')
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteEvent(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['events:upcoming'] });
      router.back();
    }
  });

  const handleDelete = () => {
    Alert.alert('Delete Event', 'Are you sure you want to remove this event from your calendar?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMut.mutate() }
    ]);
  };

  return (
    <ScreenLayout
      title="Event Details"
      showBack
      rightAction={
        <TouchableOpacity
          onPress={() => updateMut.mutate()}
          disabled={updateMut.isPending}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={{ color: theme.brand.primary, fontSize: fontSize.base, fontWeight: fontWeight.semibold }}>
            {updateMut.isPending ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      }
      keyboardAvoid
    >
      {isLoading ? (
        <View style={s.pad}><SkeletonCard /><SkeletonCard /></View>
      ) : error || !event ? (
        <ErrorState message="Could not load event." onRetry={refetch} />
      ) : (
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Header Card with Color Stripe */}
          <View style={[s.heroCard, { backgroundColor: theme.surface.default, borderLeftColor: COLORS[color] }]}>
            <Text style={[s.timeTxt, { color: COLORS[color] }]}>
              {event.all_day
                ? format(parseISO(event.start_at), 'EEEE, MMMM d, yyyy') + ' (All Day)'
                : `${format(parseISO(event.start_at), 'EEEE, MMM d · h:mm a')} – ${format(parseISO(event.end_at), 'h:mm a')}`}
            </Text>
            {event.location && (
              <View style={s.locRow}>
                <Ionicons name="location-outline" size={16} color={theme.text.tertiary} />
                <Text style={[s.locTxt, { color: theme.text.secondary }]}>{event.location}</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Input label="Title" value={title} onChangeText={setTitle} placeholder="Event title" />

          {/* Location */}
          <Input label="Location" value={location} onChangeText={setLocation} placeholder="Office, Room, Address..." />

          {/* Description */}
          <Input label="Description" value={description} onChangeText={setDescription} placeholder="Meeting notes or agenda..." multiline numberOfLines={3} />

          {/* Color Selector */}
          <View style={s.sec}>
            <Text style={[s.label, { color: theme.text.secondary }]}>Color</Text>
            <View style={s.colorRow}>
              {(Object.keys(COLORS) as EventColor[]).map((cKey) => (
                <TouchableOpacity
                  key={cKey}
                  onPress={() => setColor(cKey)}
                  style={[s.colorDot, { backgroundColor: COLORS[cKey] }, color === cKey && s.colorDotActive]}
                >
                  {color === cKey && <Ionicons name="checkmark" size={16} color="#ffffff" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Reminder info */}
          <View style={[s.infoRow, { backgroundColor: theme.surface.inset }]}>
            <Ionicons name="notifications-outline" size={18} color={theme.text.tertiary} />
            <Text style={[s.infoTxt, { color: theme.text.secondary }]}>
              {event.reminder_minutes != null ? `Notification set for ${event.reminder_minutes} minutes before` : 'No reminder scheduled'}
            </Text>
          </View>

          {/* Delete action */}
          <Button
            label="Delete event"
            onPress={handleDelete}
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
  heroCard: { padding: spacing[4], borderRadius: radius.lg, borderLeftWidth: 5, gap: spacing[2] },
  timeTxt: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  locTxt: { fontSize: fontSize.sm },
  sec: { gap: spacing[2] },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  colorRow: { flexDirection: 'row', gap: spacing[3], alignItems: 'center' },
  colorDot: { width: 34, height: 34, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  colorDotActive: { borderWidth: 3, borderColor: '#ffffff', elevation: 3 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4], borderRadius: radius.md },
  infoTxt: { fontSize: fontSize.sm },
});
