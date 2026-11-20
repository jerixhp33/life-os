import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ScreenLayout } from '../../src/components/layout/ScreenLayout';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius } from '../../src/theme/tokens';
import { fetchGoal, updateGoal, deleteGoal, createMilestone, completeMilestone, deleteMilestone } from '../../src/features/goals/api';
import { SkeletonCard, ErrorState } from '../../src/components/feedback';
import { Button } from '../../src/components/ui/Button';
import type { GoalStatus, GoalMilestone } from '../../src/types';

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { theme } = useTheme();

  const [newMsTitle, setNewMsTitle] = useState('');

  const { data: goal, isLoading, error, refetch } = useQuery({
    queryKey: ['goal', id],
    queryFn: () => fetchGoal(id!),
    enabled: Boolean(id)
  });

  const completeMsMut = useMutation({
    mutationFn: (mId: string) => completeMilestone(mId, id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goal', id] });
      qc.invalidateQueries({ queryKey: ['goals'] });
    }
  });

  const addMsMut = useMutation({
    mutationFn: (t: string) => createMilestone(id!, { title: t }),
    onSuccess: () => {
      setNewMsTitle('');
      qc.invalidateQueries({ queryKey: ['goal', id] });
      qc.invalidateQueries({ queryKey: ['goals'] });
    }
  });

  const deleteMsMut = useMutation({
    mutationFn: (mId: string) => deleteMilestone(mId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goal', id] });
      qc.invalidateQueries({ queryKey: ['goals'] });
    }
  });

  const updateStatusMut = useMutation({
    mutationFn: (status: GoalStatus) => updateGoal(id!, { status, progress: status === 'completed' ? 100 : goal?.progress ?? 0 }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goal', id] });
      qc.invalidateQueries({ queryKey: ['goals'] });
    }
  });

  const deleteGoalMut = useMutation({
    mutationFn: () => deleteGoal(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      router.back();
    }
  });

  const handleDelete = () => {
    Alert.alert('Delete Goal', 'Are you sure you want to delete this goal and all associated milestones?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteGoalMut.mutate() }
    ]);
  };

  const milestones: GoalMilestone[] = goal?.milestones ?? [];
  const completedCount = milestones.filter((m) => m.completed).length;

  return (
    <ScreenLayout title="Goal Details" showBack keyboardAvoid>
      {isLoading ? (
        <View style={s.pad}><SkeletonCard /><SkeletonCard /></View>
      ) : error || !goal ? (
        <ErrorState message="Could not load goal details." onRetry={refetch} />
      ) : (
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Progress Card */}
          <View style={[s.card, { backgroundColor: theme.surface.default, borderColor: theme.border.subtle }]}>
            <View style={s.topRow}>
              <View style={{ flex: 1 }}>
                <Text style={[s.catBadge, { color: goal.color ?? theme.brand.primary }]}>{goal.category.toUpperCase()}</Text>
                <Text style={[s.title, { color: theme.text.primary }]}>{goal.title}</Text>
                {goal.target_date && (
                  <Text style={[s.dateTxt, { color: theme.text.tertiary }]}>
                    Target: {format(new Date(goal.target_date), 'MMMM d, yyyy')}
                  </Text>
                )}
              </View>
              <Text style={[s.pctTxt, { color: goal.color ?? theme.brand.primary }]}>{goal.progress}%</Text>
            </View>

            {/* Progress bar */}
            <View style={[s.barBg, { backgroundColor: theme.surface.inset }]}>
              <View style={[s.barFill, { width: `${goal.progress}%`, backgroundColor: goal.color ?? theme.brand.primary }]} />
            </View>

            {goal.description && (
              <Text style={[s.descTxt, { color: theme.text.secondary }]}>{goal.description}</Text>
            )}
          </View>

          {/* Status control */}
          <View style={s.sec}>
            <Text style={[s.secTitle, { color: theme.text.secondary }]}>Status</Text>
            <View style={s.statusRow}>
              {(['active', 'completed', 'paused'] as GoalStatus[]).map((st) => (
                <TouchableOpacity
                  key={st}
                  onPress={() => updateStatusMut.mutate(st)}
                  style={[
                    s.statusChip,
                    {
                      backgroundColor: goal.status === st ? theme.brand.primary : theme.surface.inset,
                      borderColor: goal.status === st ? theme.brand.primary : theme.border.subtle
                    }
                  ]}
                >
                  <Text style={{ color: goal.status === st ? '#ffffff' : theme.text.secondary, fontSize: fontSize.xs, fontWeight: fontWeight.medium }}>
                    {st[0].toUpperCase() + st.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Milestones Checklist */}
          <View style={s.sec}>
            <View style={s.msHeader}>
              <Text style={[s.secTitle, { color: theme.text.primary }]}>Milestones</Text>
              <Text style={{ color: theme.text.tertiary, fontSize: fontSize.xs }}>
                {completedCount}/{milestones.length} completed
              </Text>
            </View>

            {milestones.map((m) => (
              <View key={m.id} style={[s.msItem, { backgroundColor: theme.surface.default, borderColor: theme.border.subtle }]}>
                <TouchableOpacity
                  onPress={() => !m.completed && completeMsMut.mutate(m.id)}
                  style={[
                    s.checkSquare,
                    {
                      borderColor: m.completed ? theme.brand.primary : theme.border.default,
                      backgroundColor: m.completed ? theme.brand.primary : 'transparent'
                    }
                  ]}
                  disabled={m.completed}
                >
                  {m.completed && <Ionicons name="checkmark" size={14} color="#ffffff" />}
                </TouchableOpacity>
                <Text style={[s.msLabel, { color: m.completed ? theme.text.tertiary : theme.text.primary, textDecorationLine: m.completed ? 'line-through' : 'none' }]}>
                  {m.title}
                </Text>
                <TouchableOpacity onPress={() => deleteMsMut.mutate(m.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-outline" size={18} color={theme.text.tertiary} />
                </TouchableOpacity>
              </View>
            ))}

            {/* Add milestone */}
            <View style={[s.addMsBox, { backgroundColor: theme.surface.inset }]}>
              <TextInput
                value={newMsTitle}
                onChangeText={setNewMsTitle}
                placeholder="Add next milestone..."
                placeholderTextColor={theme.text.placeholder}
                style={[s.msIn, { color: theme.text.primary }]}
                onSubmitEditing={() => {
                  if (newMsTitle.trim()) addMsMut.mutate(newMsTitle.trim());
                }}
              />
              <TouchableOpacity
                onPress={() => {
                  if (newMsTitle.trim()) addMsMut.mutate(newMsTitle.trim());
                }}
                disabled={!newMsTitle.trim() || addMsMut.isPending}
                style={[s.msAddBtn, { backgroundColor: newMsTitle.trim() ? theme.brand.primary : theme.surface.inset }]}
              >
                <Ionicons name="arrow-up" size={16} color={newMsTitle.trim() ? '#ffffff' : theme.text.disabled} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Delete goal action */}
          <Button
            label="Delete goal"
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
  card: { padding: spacing[4], borderRadius: radius.xl, borderWidth: 1, gap: spacing[3] },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  catBadge: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, letterSpacing: 0.5, marginBottom: 4 },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  dateTxt: { fontSize: fontSize.xs, marginTop: 4 },
  pctTxt: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold },
  barBg: { height: 8, borderRadius: radius.full, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: radius.full },
  descTxt: { fontSize: fontSize.sm, lineHeight: 20 },
  sec: { gap: spacing[2] },
  secTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  statusRow: { flexDirection: 'row', gap: spacing[2] },
  statusChip: { paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderRadius: radius.full, borderWidth: 1 },
  msHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  msItem: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[3], borderRadius: radius.md, borderWidth: 1 },
  checkSquare: { width: 22, height: 22, borderRadius: 5, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  msLabel: { flex: 1, fontSize: fontSize.sm },
  addMsBox: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, paddingHorizontal: spacing[3], paddingVertical: spacing[1] },
  msIn: { flex: 1, fontSize: fontSize.sm, paddingVertical: spacing[2] },
  msAddBtn: { width: 28, height: 28, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' }
});
