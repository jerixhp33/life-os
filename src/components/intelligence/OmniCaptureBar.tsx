import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius, shadows } from '../../theme/tokens';
import { parseOmniInput, type ParsedOmniResult } from '../../lib/intelligence/omniParser';
import { useCreateTask } from '../../features/tasks/hooks';
import { useCreateNote } from '../../features/notes/hooks';
import { createTransaction } from '../../features/finance/api';
import { useAuthStore } from '../../stores/authStore';
import { useQueryClient } from '@tanstack/react-query';

export function OmniCaptureBar({
  placeholder = 'Add task, note, or expense in plain text...',
  onSuccess,
}: {
  placeholder?: string;
  onSuccess?: (type: 'task' | 'finance' | 'note', title: string) => void;
}) {
  const { theme, isDark } = useTheme();
  const uid = useAuthStore((s) => s.user?.id ?? s.profile?.id);
  const userCurrency = useAuthStore((s) => s.profile?.currency ?? 'INR');
  const qc = useQueryClient();

  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const parsed: ParsedOmniResult = useMemo(
    () => parseOmniInput(input, userCurrency),
    [input, userCurrency]
  );

  const createTaskMut = useCreateTask();
  const createNoteMut = useCreateNote();

  const handleSubmit = async () => {
    if (!input.trim() || !uid || isSubmitting) return;
    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (parsed.type === 'finance' && parsed.amount) {
        await createTransaction(uid, {
          type: parsed.transactionType ?? 'expense',
          amount: parsed.amount,
          currency: parsed.currency ?? userCurrency,
          category: parsed.category ?? 'General',
          description: parsed.title,
          date: new Date().toISOString().split('T')[0],
          is_recurring: false,
        });
        qc.invalidateQueries({ queryKey: ['transactions'] });
        qc.invalidateQueries({ queryKey: ['spending_summary'] });
        setSuccessMsg(`Logged ${parsed.currency ?? userCurrency} ${parsed.amount} expense!`);
      } else if (parsed.type === 'note') {
        await createNoteMut.mutateAsync({
          title: parsed.title,
          content: parsed.content || parsed.title,
          content_type: 'text',
          tags: parsed.tags,
        });
        setSuccessMsg('Saved note to LifeOS!');
      } else {
        // Task
        await createTaskMut.mutateAsync({
          title: parsed.title,
          priority: parsed.priority ?? 'medium',
          due_date: parsed.dueDate,
          due_time: parsed.dueTime,
          category: parsed.category,
          tags: parsed.tags,
        });
        setSuccessMsg('Created task!');
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess?.(parsed.type, parsed.title);
      setInput('');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasContent = input.trim().length > 0;

  return (
    <View style={s.container}>
      {/* Frosted Input Box */}
      <View
        style={[
          s.inputCard,
          {
            backgroundColor: isDark ? 'rgba(10, 36, 56, 0.88)' : 'rgba(255, 255, 255, 0.92)',
            borderColor: hasContent
              ? isDark
                ? '#38BDF8'
                : '#0284C7'
              : isDark
              ? 'rgba(168, 220, 244, 0.28)'
              : 'rgba(255, 255, 255, 0.95)',
            ...shadows.sm,
          },
        ]}
      >
        <LinearGradient
          colors={['#4F46E5', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.sparkleBox}
        >
          <Ionicons name="sparkles" size={13} color="#FFFFFF" />
        </LinearGradient>

        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#819BB3' : '#94A3B8'}
          style={[s.textInput, { color: theme.text.primary }]}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />

        {hasContent && (
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
            style={s.submitBtn}
          >
            <LinearGradient
              colors={['#4338CA', '#4F46E5', '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.submitGradient}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="arrow-up" size={16} color="#FFFFFF" />
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Real-time Parsed Preview Chips */}
      {hasContent && (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={s.chipsRow}>
          {/* Intent Chip */}
          <View
            style={[
              s.chip,
              {
                backgroundColor:
                  parsed.type === 'finance'
                    ? 'rgba(245, 158, 11, 0.16)'
                    : parsed.type === 'note'
                    ? 'rgba(16, 185, 129, 0.16)'
                    : 'rgba(56, 189, 248, 0.16)',
              },
            ]}
          >
            <Ionicons
              name={
                parsed.type === 'finance'
                  ? 'wallet-outline'
                  : parsed.type === 'note'
                  ? 'document-text-outline'
                  : 'checkbox-outline'
              }
              size={11}
              color={
                parsed.type === 'finance'
                  ? '#F59E0B'
                  : parsed.type === 'note'
                  ? '#10B981'
                  : '#0284C7'
              }
            />
            <Text
              style={[
                s.chipText,
                {
                  color:
                    parsed.type === 'finance'
                      ? '#F59E0B'
                      : parsed.type === 'note'
                      ? '#10B981'
                      : '#0284C7',
                },
              ]}
            >
              {parsed.type.toUpperCase()}
            </Text>
          </View>

          {/* Amount Chip for Finance */}
          {parsed.amount ? (
            <View style={[s.chip, { backgroundColor: 'rgba(245, 158, 11, 0.16)' }]}>
              <Text style={[s.chipText, { color: '#F59E0B' }]}>
                {parsed.currency ?? userCurrency} {parsed.amount}
              </Text>
            </View>
          ) : null}

          {/* Due Date Chip for Task */}
          {parsed.dueDate ? (
            <View style={[s.chip, { backgroundColor: 'rgba(99, 102, 241, 0.14)' }]}>
              <Ionicons name="calendar-outline" size={11} color="#6366F1" />
              <Text style={[s.chipText, { color: '#6366F1' }]}>
                {parsed.dueDate} {parsed.dueTime ?? ''}
              </Text>
            </View>
          ) : null}

          {/* Priority Chip */}
          {parsed.priority && parsed.priority !== 'medium' ? (
            <View
              style={[
                s.chip,
                {
                  backgroundColor:
                    parsed.priority === 'urgent'
                      ? 'rgba(239, 68, 68, 0.16)'
                      : parsed.priority === 'high'
                      ? 'rgba(249, 115, 22, 0.16)'
                      : 'rgba(59, 130, 246, 0.16)',
                },
              ]}
            >
              <Text
                style={[
                  s.chipText,
                  {
                    color:
                      parsed.priority === 'urgent'
                        ? '#EF4444'
                        : parsed.priority === 'high'
                        ? '#F97316'
                        : '#3B82F6',
                  },
                ]}
              >
                {parsed.priority.toUpperCase()}
              </Text>
            </View>
          ) : null}

          {/* Category Chip */}
          {parsed.category ? (
            <View style={[s.chip, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)' }]}>
              <Text style={[s.chipText, { color: theme.text.secondary }]}>
                {parsed.category}
              </Text>
            </View>
          ) : null}
        </Animated.View>
      )}

      {/* Success Notification Pill */}
      {successMsg && (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={s.successBox}>
          <Ionicons name="checkmark-circle" size={14} color="#10B981" />
          <Text style={s.successText}>{successMsg}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    gap: 6,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1.2,
  },
  sparkleBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: fontSize.sm,
    paddingVertical: 4,
  },
  submitBtn: {
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  submitGradient: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: radius.full,
  },
  chipText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  successText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    color: '#10B981',
  },
});
