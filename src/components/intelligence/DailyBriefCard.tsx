import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius, shadows } from '../../theme/tokens';
import { generateDailyBrief } from '../../lib/intelligence/dailyBrief';
import { useTasks } from '../../features/tasks/hooks';
import { useHabits, useTodayHabitLogs } from '../../features/habits/hooks';
import { useAuthStore } from '../../stores/authStore';

export function DailyBriefCard() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const currency = profile?.currency ?? 'INR';
  const rawName = profile?.full_name?.trim();
  const emailName = profile?.email ? profile.email.split('@')[0] : '';
  const firstName = rawName ? rawName.split(' ')[0] : emailName || 'Friend';

  const { data: tasks } = useTasks();
  const { data: habits } = useHabits();
  const { data: habitLogs } = useTodayHabitLogs();

  const brief = useMemo(() => {
    return generateDailyBrief({
      tasks: tasks ?? [],
      habits: habits ?? [],
      habitLogs: habitLogs ?? [],
      transactions: [],
      userName: firstName,
      currency,
    });
  }, [tasks, habits, habitLogs, firstName, currency]);

  return (
    <Animated.View entering={FadeInDown.duration(420)} style={s.container}>
      <LinearGradient
        colors={
          isDark
            ? ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']
            : ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          s.card,
          {
            borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.95)',
            ...shadows.sm,
          },
        ]}
      >
        {/* Top Tag Row */}
        <View style={s.topRow}>
          <View
            style={[
              s.tagBadge,
              {
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.18)' : 'rgba(37, 99, 235, 0.12)',
              },
            ]}
          >
            <Ionicons name="sparkles" size={11} color={isDark ? '#60A5FA' : '#2563EB'} />
            <Text style={[s.tagText, { color: isDark ? '#60A5FA' : '#2563EB' }]}>
              Autonomous Life Brief
            </Text>
          </View>

          <Text style={[s.greetingText, { color: isDark ? '#E2E8F0' : '#7A6E60' }]}>
            {brief.greeting}
          </Text>
        </View>

        {/* Headline */}
        <Text style={[s.headline, { color: isDark ? '#FFFFFF' : '#1A1612' }]}>
          {brief.headline}
        </Text>

        {/* Bullet Points */}
        <View style={s.bulletsList}>
          {brief.bulletPoints.map((b, idx) => (
            <View key={idx} style={s.bulletRow}>
              <View style={[s.bulletDot, { backgroundColor: isDark ? '#38BDF8' : '#2563EB' }]} />
              <Text style={[s.bulletText, { color: isDark ? '#E2E8F0' : '#483E34' }]}>
                {b}
              </Text>
            </View>
          ))}
        </View>

        {/* Suggested Action - Clean button with white text inside and no border inside border */}
        {brief.suggestedAction && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(brief.suggestedAction!.route as never);
            }}
            style={[
              s.actionBtn,
              {
                backgroundColor: '#3B82F6',
                borderWidth: 0,
                ...shadows.sm,
              },
            ]}
          >
            <Text style={[s.actionBtnText, { color: '#FFFFFF' }]}>
              {brief.suggestedAction.label}
            </Text>
            <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  card: {
    padding: spacing[4],
    borderRadius: 22,
    borderWidth: 1.2,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  tagText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.3,
  },
  greetingText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
  },
  headline: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    lineHeight: 20,
    marginTop: 2,
  },
  bulletsList: {
    gap: 6,
    marginTop: 2,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 6,
  },
  bulletText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: fontWeight.medium,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    marginTop: 4,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
  },
});
