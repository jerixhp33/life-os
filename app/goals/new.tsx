import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ScreenLayout } from '../../src/components/layout/ScreenLayout';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius, shadows } from '../../src/theme/tokens';
import { createGoal, createMilestone } from '../../src/features/goals/api';
import { useAuthStore } from '../../src/stores/authStore';
import { Input } from '../../src/components/ui/Input';
import type { GoalCategory } from '../../src/types';

const CATEGORIES: Array<{
  k: GoalCategory;
  l: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
  color: string;
}> = [
  { k: 'health', l: 'Health', icon: 'fitness', gradient: ['#059669', '#10B981'], color: '#10B981' },
  { k: 'career', l: 'Career', icon: 'briefcase', gradient: ['#4F46E5', '#6366F1'], color: '#6366F1' },
  { k: 'finance', l: 'Finance', icon: 'wallet', gradient: ['#2563EB', '#38BDF8'], color: '#38BDF8' },
  { k: 'learning', l: 'Learning', icon: 'book', gradient: ['#7C3AED', '#8B5CF6'], color: '#8B5CF6' },
  { k: 'personal', l: 'Personal', icon: 'compass', gradient: ['#0891B2', '#06B6D4'], color: '#06B6D4' },
  { k: 'relationships', l: 'Relationships', icon: 'heart', gradient: ['#E11D48', '#F43F5E'], color: '#F43F5E' },
  { k: 'other', l: 'Other', icon: 'flag', gradient: ['#475569', '#64748B'], color: '#64748B' },
];

export default function NewGoalScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { theme, isDark } = useTheme();
  const uid = useAuthStore((s) => s.user?.id ?? s.profile?.id);

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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setMilestones((p) => [...p, t]);
      setMilestoneInput('');
    }
  };

  const removeMilestone = (idx: number) => {
    Haptics.selectionAsync();
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
        color: selectedCat?.color,
      });

      // Add initial milestones if any
      for (const mTitle of milestones) {
        await createMilestone(newGoal.id, { title: mTitle });
      }

      return newGoal;
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['goals'] });
      router.back();
    },
    onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'Could not create goal.'),
  });

  const selectedCat = CATEGORIES.find((c) => c.k === category) ?? CATEGORIES[4];

  return (
    <ScreenLayout
      title="Set a New Goal"
      showBack
      rightAction={
        <TouchableOpacity
          onPress={() => createMut.mutate()}
          disabled={createMut.isPending || !title.trim()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text
            style={{
              color: title.trim() ? theme.brand.primary : isDark ? '#64748B' : '#94A3B8',
              fontSize: fontSize.base,
              fontWeight: fontWeight.bold,
            }}
          >
            {createMut.isPending ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      }
      keyboardAvoid
    >
      {/* Ambient background light */}
      <View pointerEvents="none" style={s.ambientGlowContainer}>
        <LinearGradient
          colors={
            isDark
              ? ['rgba(99, 102, 241, 0.20)', 'rgba(168, 85, 247, 0.12)', 'transparent']
              : ['rgba(199, 210, 254, 0.40)', 'rgba(233, 213, 255, 0.25)', 'transparent']
          }
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 0.8 }}
          style={s.ambientGlow}
        />
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title Input */}
        <Input
          label="Goal Title"
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Master React Native & Launch App"
          autoFocus
        />

        {/* Description Input */}
        <Input
          label="Why is this important? (optional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Define your vision, motivations, and definition of success..."
          multiline
          numberOfLines={3}
        />

        {/* Category Picker */}
        <View style={s.sec}>
          <Text style={[s.label, { color: theme.text.primary }]}>Category</Text>
          <View style={s.catWrap}>
            {CATEGORIES.map((c) => {
              const selected = category === c.k;
              return (
                <TouchableOpacity
                  key={c.k}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setCategory(c.k);
                  }}
                  activeOpacity={0.8}
                  style={[
                    s.catChip,
                    {
                      backgroundColor: selected
                        ? isDark
                          ? 'rgba(255, 255, 255, 0.12)'
                          : '#FFFFFF'
                        : isDark
                        ? 'rgba(10, 36, 56, 0.82)'
                        : 'rgba(241, 245, 249, 0.95)',
                      borderColor: selected
                        ? c.color
                        : isDark
                        ? 'rgba(168, 220, 244, 0.20)'
                        : '#E2E8F0',
                      ...shadows.sm,
                    },
                  ]}
                >
                  <Ionicons name={c.icon} size={15} color={selected ? c.color : isDark ? '#819BB3' : '#64748B'} />
                  <Text
                    style={{
                      color: selected ? c.color : theme.text.secondary,
                      fontSize: fontSize.xs,
                      fontWeight: selected ? fontWeight.bold : fontWeight.medium,
                    }}
                  >
                    {c.l}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Target Date */}
        <View style={s.sec}>
          <Text style={[s.label, { color: theme.text.primary }]}>Target Completion Date</Text>
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setShowDatePicker(true);
            }}
            activeOpacity={0.8}
            style={[
              s.dateBtn,
              {
                backgroundColor: isDark ? 'rgba(10, 36, 56, 0.85)' : 'rgba(255, 255, 255, 0.90)',
                borderColor: isDark ? 'rgba(168, 220, 244, 0.25)' : 'rgba(255, 255, 255, 0.95)',
                ...shadows.sm,
              },
            ]}
          >
            <Ionicons name="calendar-outline" size={18} color={selectedCat.color} />
            <Text style={{ color: targetDate ? theme.text.primary : theme.text.placeholder, flex: 1, fontSize: fontSize.sm }}>
              {targetDate ? format(new Date(targetDate), 'MMMM d, yyyy') : 'No target date set (tap to select)'}
            </Text>
            {targetDate && (
              <TouchableOpacity
                onPress={() => setTargetDate(undefined)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color={isDark ? '#819BB3' : '#94A3B8'} />
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

        {/* Milestones to achieve */}
        <View style={s.sec}>
          <Text style={[s.label, { color: theme.text.primary }]}>Milestones to achieve</Text>
          {milestones.map((m, idx) => (
            <View
              key={idx}
              style={[
                s.msRow,
                {
                  backgroundColor: isDark ? 'rgba(10, 36, 56, 0.85)' : 'rgba(255, 255, 255, 0.90)',
                  borderColor: isDark ? 'rgba(168, 220, 244, 0.25)' : 'rgba(255, 255, 255, 0.95)',
                  ...shadows.sm,
                },
              ]}
            >
              <Ionicons name="git-commit-outline" size={16} color={selectedCat.color} />
              <Text style={[s.msTxt, { color: theme.text.primary }]}>{m}</Text>
              <TouchableOpacity onPress={() => removeMilestone(idx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-outline" size={18} color={isDark ? '#819BB3' : '#94A3B8'} />
              </TouchableOpacity>
            </View>
          ))}

          {/* Add milestone row */}
          <View
            style={[
              s.addMsRow,
              {
                backgroundColor: isDark ? 'rgba(10, 36, 56, 0.70)' : 'rgba(241, 245, 249, 0.95)',
                borderColor: isDark ? 'rgba(168, 220, 244, 0.20)' : '#E2E8F0',
              },
            ]}
          >
            <Ionicons name="add-circle-outline" size={18} color={selectedCat.color} />
            <Input
              value={milestoneInput}
              onChangeText={setMilestoneInput}
              placeholder="Add key milestone..."
              containerStyle={{ flex: 1, marginBottom: 0 }}
              onSubmitEditing={addMilestone}
            />
            {milestoneInput.trim().length > 0 && (
              <TouchableOpacity onPress={addMilestone} style={s.msAddBtn}>
                <Ionicons name="arrow-up" size={16} color={selectedCat.color} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            createMut.mutate();
          }}
          disabled={createMut.isPending || !title.trim()}
          activeOpacity={0.88}
          style={[s.createBtnContainer, { opacity: title.trim() ? 1 : 0.6 }]}
        >
          <LinearGradient
            colors={['#4338CA', '#4F46E5', '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.createBtnGradient}
          >
            <Ionicons name="sparkles" size={18} color="#FFFFFF" />
            <Text style={s.createBtnText}>
              {createMut.isPending ? 'Creating Goal...' : 'Create Goal'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </ScreenLayout>
  );
}

const s = StyleSheet.create({
  ambientGlowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
    overflow: 'hidden',
  },
  ambientGlow: {
    width: '100%',
    height: '100%',
  },
  content: { padding: spacing[5], gap: spacing[4] },
  sec: { gap: spacing[2] },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, letterSpacing: -0.2 },
  catWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1.2,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3] + 2,
    borderRadius: 16,
    borderWidth: 1.2,
  },
  msRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: 16,
    borderWidth: 1.2,
  },
  msTxt: { flex: 1, fontSize: fontSize.sm },
  addMsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    borderRadius: 16,
    paddingHorizontal: spacing[3],
    borderWidth: 1,
  },
  msAddBtn: { padding: 4 },
  createBtnContainer: {
    borderRadius: radius.full,
    overflow: 'hidden',
    marginTop: spacing[3],
    ...shadows.md,
  },
  createBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.full,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
});
