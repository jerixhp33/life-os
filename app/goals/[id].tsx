import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';
import { ScreenLayout } from '../../src/components/layout/ScreenLayout';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius, shadows } from '../../src/theme/tokens';
import {
  fetchGoal,
  updateGoal,
  updateGoalProgress,
  deleteGoal,
  createMilestone,
  toggleMilestone,
  deleteMilestone,
} from '../../src/features/goals/api';
import { SkeletonCard, ErrorState } from '../../src/components/feedback';
import type { GoalStatus, GoalMilestone, GoalCategory } from '../../src/types';

const CATEGORY_MAP: Record<
  GoalCategory,
  { icon: keyof typeof Ionicons.glyphMap; gradient: [string, string]; accent: string }
> = {
  health: { icon: 'fitness', gradient: ['#059669', '#10B981'], accent: '#10B981' },
  career: { icon: 'briefcase', gradient: ['#4F46E5', '#6366F1'], accent: '#6366F1' },
  finance: { icon: 'wallet', gradient: ['#2563EB', '#38BDF8'], accent: '#38BDF8' },
  learning: { icon: 'book', gradient: ['#7C3AED', '#8B5CF6'], accent: '#8B5CF6' },
  personal: { icon: 'compass', gradient: ['#0891B2', '#06B6D4'], accent: '#06B6D4' },
  relationships: { icon: 'heart', gradient: ['#E11D48', '#F43F5E'], accent: '#F43F5E' },
  other: { icon: 'flag', gradient: ['#475569', '#64748B'], accent: '#64748B' },
};

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { theme, isDark } = useTheme();

  const [newMsTitle, setNewMsTitle] = useState('');

  const { data: goal, isLoading, error, refetch } = useQuery({
    queryKey: ['goal', id],
    queryFn: () => fetchGoal(id!),
    enabled: Boolean(id),
  });

  const catMeta = goal ? CATEGORY_MAP[goal.category] ?? CATEGORY_MAP.other : CATEGORY_MAP.other;

  const toggleMsMut = useMutation({
    mutationFn: ({ mId, nextStatus }: { mId: string; nextStatus: boolean }) =>
      toggleMilestone(mId, id!, nextStatus),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goal', id] });
      qc.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const addMsMut = useMutation({
    mutationFn: (t: string) => createMilestone(id!, { title: t }),
    onSuccess: () => {
      setNewMsTitle('');
      qc.invalidateQueries({ queryKey: ['goal', id] });
      qc.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const deleteMsMut = useMutation({
    mutationFn: (mId: string) => deleteMilestone(mId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goal', id] });
      qc.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const updateProgressMut = useMutation({
    mutationFn: (prog: number) => updateGoalProgress(id!, prog),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goal', id] });
      qc.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const updateStatusMut = useMutation({
    mutationFn: (status: GoalStatus) =>
      updateGoal(id!, {
        status,
        progress: status === 'completed' ? 100 : goal?.progress ?? 0,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goal', id] });
      qc.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const deleteGoalMut = useMutation({
    mutationFn: () => deleteGoal(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      router.back();
    },
  });

  const handleDelete = () => {
    Alert.alert('Delete Goal', 'Are you sure you want to delete this goal and all its milestones?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteGoalMut.mutate();
        },
      },
    ]);
  };

  const milestones: GoalMilestone[] = goal?.milestones ?? [];
  const completedCount = milestones.filter((m) => m.completed).length;

  return (
    <ScreenLayout title="Goal Details" showBack keyboardAvoid>
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

      {isLoading ? (
        <View style={s.pad}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : error || !goal ? (
        <ErrorState message="Could not load goal details." onRetry={refetch} />
      ) : (
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Main Frosted Card */}
          <View
            style={[
              s.card,
              {
                backgroundColor: isDark ? 'rgba(10, 36, 56, 0.88)' : 'rgba(255, 255, 255, 0.92)',
                borderColor: isDark ? 'rgba(168, 220, 244, 0.28)' : 'rgba(255, 255, 255, 0.95)',
                ...shadows.sm,
              },
            ]}
          >
            <View style={s.topRow}>
              {/* Category Squircle */}
              <LinearGradient
                colors={catMeta.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.catSquircle}
              >
                <Ionicons name={catMeta.icon} size={22} color="#FFFFFF" />
              </LinearGradient>

              <View style={{ flex: 1 }}>
                <View style={s.catPillRow}>
                  <View style={[s.catPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)' }]}>
                    <Text style={[s.catBadge, { color: catMeta.accent }]}>
                      {goal.category.toUpperCase()}
                    </Text>
                  </View>
                  {goal.target_date && (
                    <Text style={[s.dateTxt, { color: isDark ? '#819BB3' : '#64748B' }]}>
                      Target: {format(new Date(goal.target_date), 'MMM d, yyyy')}
                    </Text>
                  )}
                </View>

                <Text style={[s.title, { color: theme.text.primary }]}>{goal.title}</Text>
              </View>

              {/* Progress Percentage Badge */}
              <View style={[s.pctBadge, { borderColor: catMeta.accent }]}>
                <Text style={[s.pctTxt, { color: catMeta.accent }]}>{goal.progress}%</Text>
              </View>
            </View>

            {/* Gradient Progress Bar */}
            <View style={[s.barBg, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0' }]}>
              <LinearGradient
                colors={catMeta.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[s.barFill, { width: `${Math.max(6, Math.min(100, goal.progress))}%` }]}
              />
            </View>

            {/* Description */}
            {goal.description && (
              <Text style={[s.descTxt, { color: isDark ? '#94A3B8' : '#475569' }]}>
                {goal.description}
              </Text>
            )}

            {/* Quick Progress Buttons */}
            <View style={s.quickProgRow}>
              {[
                { label: '+10%', add: 10 },
                { label: '+25%', add: 25 },
                { label: '100% Done', set: 100 },
              ].map((item) => (
                <TouchableOpacity
                  key={item.label}
                  activeOpacity={0.8}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    const val = item.set !== undefined ? item.set : goal.progress + (item.add ?? 0);
                    updateProgressMut.mutate(val);
                  }}
                  style={[
                    s.quickProgBtn,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(241, 245, 249, 0.95)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1',
                    },
                  ]}
                >
                  <Ionicons name="flash-outline" size={13} color={catMeta.accent} />
                  <Text style={[s.quickProgText, { color: theme.text.primary }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Status Control */}
          <View style={s.sec}>
            <Text style={[s.secTitle, { color: theme.text.primary }]}>Goal Status</Text>
            <View
              style={[
                s.statusRow,
                {
                  backgroundColor: isDark ? 'rgba(10, 36, 56, 0.82)' : 'rgba(226, 232, 240, 0.65)',
                  borderColor: isDark ? 'rgba(168, 220, 244, 0.25)' : 'rgba(255, 255, 255, 0.95)',
                },
              ]}
            >
              {(['active', 'completed', 'paused'] as GoalStatus[]).map((st) => {
                const isSelected = goal.status === st;
                return (
                  <TouchableOpacity
                    key={st}
                    onPress={() => {
                      Haptics.selectionAsync();
                      updateStatusMut.mutate(st);
                    }}
                    activeOpacity={0.8}
                    style={[
                      s.statusChip,
                      isSelected && [
                        s.statusChipActive,
                        { backgroundColor: isDark ? '#0284C7' : '#FFFFFF', ...shadows.sm },
                      ],
                    ]}
                  >
                    <Text
                      style={{
                        color: isSelected
                          ? isDark
                            ? '#FFFFFF'
                            : '#0F172A'
                          : isDark
                          ? '#819BB3'
                          : '#64748B',
                        fontSize: fontSize.xs,
                        fontWeight: isSelected ? fontWeight.bold : fontWeight.medium,
                      }}
                    >
                      {st[0].toUpperCase() + st.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Milestones Checklist */}
          <View style={s.sec}>
            <View style={s.msHeader}>
              <Text style={[s.secTitle, { color: theme.text.primary }]}>Milestones</Text>
              <Text style={{ color: catMeta.accent, fontSize: fontSize.xs, fontWeight: fontWeight.bold }}>
                {completedCount}/{milestones.length} completed
              </Text>
            </View>

            {milestones.map((m) => (
              <View
                key={m.id}
                style={[
                  s.msItem,
                  {
                    backgroundColor: isDark ? 'rgba(10, 36, 56, 0.85)' : 'rgba(255, 255, 255, 0.90)',
                    borderColor: isDark ? 'rgba(168, 220, 244, 0.25)' : 'rgba(255, 255, 255, 0.95)',
                    ...shadows.sm,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    toggleMsMut.mutate({ mId: m.id, nextStatus: !m.completed });
                  }}
                  style={[
                    s.checkSquare,
                    {
                      borderColor: m.completed ? catMeta.accent : isDark ? 'rgba(255, 255, 255, 0.3)' : '#CBD5E1',
                      backgroundColor: m.completed ? catMeta.accent : 'transparent',
                    },
                  ]}
                >
                  {m.completed && <Ionicons name="checkmark" size={13} color="#ffffff" />}
                </TouchableOpacity>

                <Text
                  style={[
                    s.msLabel,
                    {
                      color: m.completed ? (isDark ? '#64748B' : '#94A3B8') : theme.text.primary,
                      textDecorationLine: m.completed ? 'line-through' : 'none',
                    },
                  ]}
                >
                  {m.title}
                </Text>

                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    deleteMsMut.mutate(m.id);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={16} color={isDark ? '#819BB3' : '#94A3B8'} />
                </TouchableOpacity>
              </View>
            ))}

            {/* Add Next Milestone Box */}
            <View
              style={[
                s.addMsBox,
                {
                  backgroundColor: isDark ? 'rgba(10, 36, 56, 0.70)' : 'rgba(241, 245, 249, 0.95)',
                  borderColor: isDark ? 'rgba(168, 220, 244, 0.20)' : '#E2E8F0',
                },
              ]}
            >
              <TextInput
                value={newMsTitle}
                onChangeText={setNewMsTitle}
                placeholder="Add next milestone..."
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                style={[s.msIn, { color: theme.text.primary }]}
                onSubmitEditing={() => {
                  if (newMsTitle.trim()) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    addMsMut.mutate(newMsTitle.trim());
                  }
                }}
              />
              <TouchableOpacity
                onPress={() => {
                  if (newMsTitle.trim()) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    addMsMut.mutate(newMsTitle.trim());
                  }
                }}
                disabled={!newMsTitle.trim() || addMsMut.isPending}
                style={[
                  s.msAddBtn,
                  {
                    backgroundColor: newMsTitle.trim() ? catMeta.accent : isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                  },
                ]}
              >
                <Ionicons
                  name="arrow-up"
                  size={15}
                  color={newMsTitle.trim() ? '#ffffff' : isDark ? '#64748B' : '#94A3B8'}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Delete Goal Button */}
          <TouchableOpacity
            onPress={handleDelete}
            style={[
              s.deleteBtn,
              {
                borderColor: isDark ? 'rgba(239, 68, 68, 0.40)' : 'rgba(239, 68, 68, 0.30)',
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(254, 242, 242, 0.95)',
              },
            ]}
          >
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
            <Text style={s.deleteBtnText}>Delete Goal</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
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
  pad: { padding: spacing[5] },
  content: { padding: spacing[5], gap: spacing[4] },
  card: { padding: spacing[5], borderRadius: 24, borderWidth: 1.2, gap: spacing[3] },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  catSquircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  catPillRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  catPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.full },
  catBadge: { fontSize: 10, fontWeight: fontWeight.bold, letterSpacing: 0.5 },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, lineHeight: 24 },
  dateTxt: { fontSize: 11, fontWeight: fontWeight.medium },
  pctBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pctTxt: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  barBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  descTxt: { fontSize: fontSize.sm, lineHeight: 20 },
  quickProgRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  quickProgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  quickProgText: { fontSize: 11, fontWeight: fontWeight.semibold },
  sec: { gap: spacing[2] },
  secTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, letterSpacing: -0.2 },
  statusRow: { flexDirection: 'row', padding: 4, borderRadius: radius.full, borderWidth: 1 },
  statusChip: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  statusChipActive: { borderRadius: radius.full },
  msHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 2 },
  msItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: 16,
    borderWidth: 1.2,
  },
  checkSquare: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msLabel: { flex: 1, fontSize: fontSize.sm },
  addMsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderWidth: 1,
  },
  msIn: { flex: 1, fontSize: fontSize.sm, paddingVertical: spacing[2] },
  msAddBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.2,
    marginTop: spacing[2],
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
