import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ScreenLayout } from '../../src/components/layout/ScreenLayout';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius } from '../../src/theme/tokens';
import { createGoal, createMilestone } from '../../src/features/goals/api';
import { useAuthStore } from '../../src/stores/authStore';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import type { GoalCategory } from '../../src/types';

const CATEGORIES: Array<{ k: GoalCategory; l: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = [
  { k: 'health', l: 'Health', icon: 'fitness-outline', color: '#23865A' },
  { k: 'career', l: 'Career', icon: 'briefcase-outline', color: '#6957E8' },
  { k: 'finance', l: 'Finance', icon: 'wallet-outline', color: '#3B82F6' },
  { k: 'learning', l: 'Learning', icon: 'book-outline', color: '#8B5CF6' },
  { k: 'personal', l: 'Personal', icon: 'person-outline', color: '#F59E0B' },
  { k: 'relationships', l: 'Relationships', icon: 'people-outline', color: '#EC4899' },
  { k: 'other', l: 'Other', icon: 'flag-outline', color: '#6B7280' }
];

export default function NewGoalScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { theme } = useTheme();
  const uid = useAuthStore((s) => s.user?.id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GoalCategory>('personal');
  const [targetDate, setTargetDate] = useState<string | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [milestones, setMilestones] = useState<string[]>([]);
  const [milestoneInput, setMilestoneInput] = useState('');

  const addMilestone = () => {
    const t = milestoneInput.trim();
    if (t) {
      setMilestones((p) => [...p, t]);
      setMilestoneInput('');
    }
  };

  const removeMilestone = (idx: number) => {
    setMilestones((p) => p.filter((_, i) => i !== idx));
  };

  const createMut = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error('Goal title is required.');
      const selectedCat = CATEGORIES.find((c) => c.k === category);
      const newGoal = await createGoal(uid!, {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        target_date: targetDate,
        color: selectedCat?.color
      });

      // Add initial milestones if any
      for (const mTitle of milestones) {
        await createMilestone(newGoal.id, { title: mTitle });
      }

      return newGoal;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      router.back();
    },
    onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'Could not create goal.')
  });

  return (
    <ScreenLayout
      title="Set a New Goal"
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
        <Input label="Goal Title" value={title} onChangeText={setTitle} placeholder="e.g. Run a half marathon" autoFocus />

        {/* Description */}
        <Input label="Why is this important? (optional)" value={description} onChangeText={setDescription} placeholder="Define your motivation and definition of success..." multiline numberOfLines={3} />

        {/* Category Picker */}
        <View style={s.sec}>
          <Text style={[s.label, { color: theme.text.secondary }]}>Category</Text>
          <View style={s.catWrap}>
            {CATEGORIES.map((c) => {
              const selected = category === c.k;
              return (
                <TouchableOpacity
                  key={c.k}
                  onPress={() => setCategory(c.k)}
                  style={[
                    s.catChip,
                    {
                      backgroundColor: selected ? c.color + '20' : theme.surface.inset,
                      borderColor: selected ? c.color : 'transparent'
                    }
                  ]}
                >
                  <Ionicons name={c.icon} size={16} color={selected ? c.color : theme.text.tertiary} />
                  <Text style={{ color: selected ? c.color : theme.text.secondary, fontSize: fontSize.sm, fontWeight: fontWeight.medium }}>
                    {c.l}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Target Date */}
        <View style={s.sec}>
          <Text style={[s.label, { color: theme.text.secondary }]}>Target Completion Date</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={[s.dateBtn, { backgroundColor: theme.surface.inset, borderColor: theme.border.default }]}
          >
            <Ionicons name="calendar-outline" size={18} color={theme.text.tertiary} />
            <Text style={{ color: targetDate ? theme.text.primary : theme.text.placeholder, flex: 1 }}>
              {targetDate ? format(new Date(targetDate), 'MMMM d, yyyy') : 'No target date set'}
            </Text>
            {targetDate && (
              <TouchableOpacity onPress={() => setTargetDate(undefined)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color={theme.text.tertiary} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>
        {showDatePicker && (
          <DateTimePicker
            value={targetDate ? new Date(targetDate) : new Date()}
            mode="date"
            onChange={(_, d) => {
              setShowDatePicker(false);
              if (d) setTargetDate(d.toISOString().split('T')[0]);
            }}
          />
        )}

        {/* Initial Milestones */}
        <View style={s.sec}>
          <Text style={[s.label, { color: theme.text.secondary }]}>Milestones to achieve</Text>
          {milestones.map((m, idx) => (
            <View key={idx} style={[s.msRow, { backgroundColor: theme.surface.default, borderColor: theme.border.subtle }]}>
              <Ionicons name="flag-outline" size={16} color={theme.brand.primary} />
              <Text style={[s.msTxt, { color: theme.text.primary }]}>{m}</Text>
              <TouchableOpacity onPress={() => removeMilestone(idx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-outline" size={18} color={theme.text.tertiary} />
              </TouchableOpacity>
            </View>
          ))}

          <View style={[s.addMsRow, { backgroundColor: theme.surface.inset }]}>
            <Ionicons name="add-circle-outline" size={18} color={theme.text.tertiary} />
            <Input
              value={milestoneInput}
              onChangeText={setMilestoneInput}
              placeholder="Add key milestone..."
              containerStyle={{ flex: 1, marginBottom: 0 }}
              onSubmitEditing={addMilestone}
            />
            {milestoneInput.trim().length > 0 && (
              <TouchableOpacity onPress={addMilestone} style={s.msAddBtn}>
                <Ionicons name="arrow-up" size={16} color={theme.brand.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Button
          label="Create Goal"
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
  sec: { gap: spacing[2] },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  catWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.full, borderWidth: 1.5 },
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[3], borderRadius: radius.md, borderWidth: 1 },
  msRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[3], borderRadius: radius.md, borderWidth: 1 },
  msTxt: { flex: 1, fontSize: fontSize.sm },
  addMsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], borderRadius: radius.md, paddingHorizontal: spacing[3] },
  msAddBtn: { padding: 4 }
});
