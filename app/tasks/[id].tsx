import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ScreenLayout } from '../../src/components/layout/ScreenLayout';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius } from '../../src/theme/tokens';
import { fetchTask, updateTask, completeTask, deleteTask, createSubtask, toggleSubtask, deleteSubtask } from '../../src/features/tasks/api';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { SkeletonCard, ErrorState } from '../../src/components/feedback';
import type { TaskPriority, TaskStatus } from '../../src/types';

const PRIORITIES: Array<{ k: TaskPriority; l: string; c: string }> = [
  { k: 'low', l: 'Low', c: '#3B82F6' },
  { k: 'medium', l: 'Medium', c: '#F59E0B' },
  { k: 'high', l: 'High', c: '#F97316' },
  { k: 'urgent', l: 'Urgent', c: '#EF4444' }
];

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { theme } = useTheme();

  const { data: task, isLoading, error, refetch } = useQuery({
    queryKey: ['task', id],
    queryFn: () => fetchTask(id!),
    enabled: Boolean(id)
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState<string | undefined>(undefined);
  const [category, setCategory] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setPriority(task.priority);
      setDueDate(task.due_date ?? undefined);
      setCategory(task.category ?? '');
    }
  }, [task]);

  const updateMut = useMutation({
    mutationFn: () =>
      updateTask(id!, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        due_date: dueDate,
        category: category.trim() || undefined
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task', id] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
      Alert.alert('Saved', 'Task details updated.');
    },
    onError: (e) => Alert.alert('Error', e instanceof Error ? e.message : 'Failed to update task.')
  });

  const completeMut = useMutation({
    mutationFn: () => completeTask(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task', id] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteTask(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      router.back();
    }
  });

  const addSubtaskMut = useMutation({
    mutationFn: (t: string) => createSubtask(id!, t),
    onSuccess: () => {
      setNewSubtask('');
      qc.invalidateQueries({ queryKey: ['task', id] });
    }
  });

  const toggleSubtaskMut = useMutation({
    mutationFn: ({ sid, done }: { sid: string; done: boolean }) => toggleSubtask(sid, done),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task', id] })
  });

  const deleteSubtaskMut = useMutation({
    mutationFn: (sid: string) => deleteSubtask(sid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task', id] })
  });

  const handleDelete = () => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMut.mutate() }
    ]);
  };

  const isCompleted = task?.status === 'completed';

  return (
    <ScreenLayout
      title="Task Details"
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
      ) : error || !task ? (
        <ErrorState message="Could not load task details." onRetry={refetch} />
      ) : (
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Status banner */}
          <View style={[s.statusBar, { backgroundColor: isCompleted ? theme.successBg : theme.surface.inset }]}>
            <TouchableOpacity
              onPress={() => completeMut.mutate()}
              style={[s.checkBtn, { borderColor: isCompleted ? theme.success : theme.border.default, backgroundColor: isCompleted ? theme.success : 'transparent' }]}
              accessibilityRole="checkbox"
            >
              {isCompleted && <Ionicons name="checkmark" size={16} color="#ffffff" />}
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[s.statusTxt, { color: isCompleted ? theme.success : theme.text.secondary }]}>
                {isCompleted ? 'Completed' : 'Pending'}
              </Text>
              {task.completed_at && (
                <Text style={{ color: theme.text.tertiary, fontSize: fontSize.xs }}>
                  {format(new Date(task.completed_at), 'MMM d, yyyy · h:mm a')}
                </Text>
              )}
            </View>
          </View>

          {/* Title & Description */}
          <Input label="Title" value={title} onChangeText={setTitle} placeholder="Task title" />
          <Input label="Description" value={description} onChangeText={setDescription} placeholder="Add notes or details..." multiline numberOfLines={3} />

          {/* Priority */}
          <View>
            <Text style={[s.label, { color: theme.text.secondary }]}>Priority</Text>
            <View style={s.prioRow}>
              {PRIORITIES.map((p) => (
                <TouchableOpacity
                  key={p.k}
                  onPress={() => setPriority(p.k)}
                  style={[
                    s.prioChip,
                    {
                      backgroundColor: priority === p.k ? p.c + '25' : theme.surface.inset,
                      borderColor: priority === p.k ? p.c : 'transparent'
                    }
                  ]}
                >
                  <View style={[s.prioDot, { backgroundColor: p.c }]} />
                  <Text style={{ color: priority === p.k ? p.c : theme.text.secondary, fontSize: fontSize.sm, fontWeight: fontWeight.medium }}>
                    {p.l}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Due date */}
          <View>
            <Text style={[s.label, { color: theme.text.secondary }]}>Due Date</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={[s.dateBtn, { backgroundColor: theme.surface.inset, borderColor: theme.border.default }]}
            >
              <Ionicons name="calendar-outline" size={18} color={theme.text.tertiary} />
              <Text style={{ color: dueDate ? theme.text.primary : theme.text.placeholder, flex: 1 }}>
                {dueDate ? format(new Date(dueDate), 'EEEE, MMMM d, yyyy') : 'No due date set'}
              </Text>
              {dueDate && (
                <TouchableOpacity onPress={() => setDueDate(undefined)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={18} color={theme.text.tertiary} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>
          {showDatePicker && (
            <DateTimePicker
              value={dueDate ? new Date(dueDate) : new Date()}
              mode="date"
              onChange={(_, date) => {
                setShowDatePicker(false);
                if (date) setDueDate(date.toISOString().split('T')[0]);
              }}
            />
          )}

          {/* Category */}
          <Input label="Category" value={category} onChangeText={setCategory} placeholder="Work, Personal, Health..." />

          {/* Subtasks checklist */}
          <View style={s.subSec}>
            <Text style={[s.secTitle, { color: theme.text.primary }]}>
              Subtasks ({(task.subtasks ?? []).filter((st) => st.completed).length}/{(task.subtasks ?? []).length})
            </Text>
            {(task.subtasks ?? []).map((st) => (
              <View key={st.id} style={[s.subRow, { backgroundColor: theme.surface.default, borderColor: theme.border.subtle }]}>
                <TouchableOpacity
                  onPress={() => toggleSubtaskMut.mutate({ sid: st.id, done: !st.completed })}
                  style={[s.subCheck, { borderColor: st.completed ? theme.brand.primary : theme.border.default, backgroundColor: st.completed ? theme.brand.primary : 'transparent' }]}
                >
                  {st.completed && <Ionicons name="checkmark" size={13} color="#ffffff" />}
                </TouchableOpacity>
                <Text style={[s.subTxt, { color: st.completed ? theme.text.tertiary : theme.text.primary, textDecorationLine: st.completed ? 'line-through' : 'none' }]}>
                  {st.title}
                </Text>
                <TouchableOpacity onPress={() => deleteSubtaskMut.mutate(st.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-outline" size={18} color={theme.text.tertiary} />
                </TouchableOpacity>
              </View>
            ))}

            {/* Add subtask */}
            <View style={[s.addSubRow, { backgroundColor: theme.surface.inset }]}>
              <TextInput
                value={newSubtask}
                onChangeText={setNewSubtask}
                placeholder="Add a subtask..."
                placeholderTextColor={theme.text.placeholder}
                style={[s.subIn, { color: theme.text.primary }]}
                onSubmitEditing={() => {
                  if (newSubtask.trim()) addSubtaskMut.mutate(newSubtask.trim());
                }}
              />
              <TouchableOpacity
                onPress={() => {
                  if (newSubtask.trim()) addSubtaskMut.mutate(newSubtask.trim());
                }}
                disabled={!newSubtask.trim() || addSubtaskMut.isPending}
                style={[s.addBtn, { backgroundColor: newSubtask.trim() ? theme.brand.primary : theme.surface.inset }]}
              >
                <Ionicons name="arrow-up" size={16} color={newSubtask.trim() ? '#ffffff' : theme.text.disabled} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Delete action */}
          <Button
            label="Delete task"
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
  statusBar: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[3], borderRadius: radius.lg },
  checkBtn: { width: 26, height: 26, borderRadius: radius.full, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  statusTxt: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, marginBottom: spacing[2] },
  prioRow: { flexDirection: 'row', gap: spacing[2] },
  prioChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[1], paddingVertical: spacing[2], borderRadius: radius.md, borderWidth: 1.5 },
  prioDot: { width: 8, height: 8, borderRadius: radius.full },
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[3], borderRadius: radius.md, borderWidth: 1 },
  subSec: { gap: spacing[2], marginTop: spacing[2] },
  secTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, marginBottom: spacing[1] },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[3], borderRadius: radius.md, borderWidth: 1 },
  subCheck: { width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  subTxt: { flex: 1, fontSize: fontSize.sm },
  addSubRow: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, paddingHorizontal: spacing[3], paddingVertical: spacing[1] },
  subIn: { flex: 1, fontSize: fontSize.sm, paddingVertical: spacing[2] },
  addBtn: { width: 28, height: 28, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' }
});
