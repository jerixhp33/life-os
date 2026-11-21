import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, addDays, isSameDay, isSameMonth, isToday, parseISO } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius, shadows } from '../../src/theme/tokens';
import { useEvents } from '../../src/features/calendar/hooks';
import { SkeletonCard, EmptyState } from '../../src/components/feedback';
import { Card, TouchableCard } from '../../src/components/ui/Card';
import type { CalendarEvent } from '../../src/types';

const EC: Record<string, string> = {
  violet: '#0284C7',
  blue:   '#38BDF8',
  green:  '#10B981',
  yellow: '#F59E0B',
  red:    '#EF4444',
  pink:   '#EC4899',
  orange: '#F97316',
};

export default function CalendarScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const [month, setMonth] = useState(new Date());
  const [sel, setSel] = useState(new Date());

  const calStart = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const calEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });

  const { data: events, isLoading } = useEvents(calStart.toISOString(), calEnd.toISOString());

  const days = useMemo(() => {
    const r: Date[] = [];
    let d = calStart;
    while (d <= calEnd) {
      r.push(d);
      d = addDays(d, 1);
    }
    return r;
  }, [month]);

  const eventsByDate = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    (events ?? []).forEach((e) => {
      const k = format(parseISO(e.start_at), 'yyyy-MM-dd');
      m.set(k, [...(m.get(k) ?? []), e]);
    });
    return m;
  }, [events]);

  const selEvents = useMemo(
    () => (events ?? []).filter((e) => isSameDay(parseISO(e.start_at), sel)),
    [events, sel]
  );

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg.primary }]} edges={['top', 'left', 'right']}>
      {/* Month Navigation Header */}
      <Animated.View entering={FadeInDown.duration(380)} style={[s.mHead, { borderBottomColor: theme.border.subtle }]}>
        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            setMonth((m) => subMonths(m, 1));
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Previous month"
        >
          <Ionicons name="chevron-back" size={24} color={theme.text.primary} />
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text style={[s.mTitle, { color: theme.text.primary }]}>{format(month, 'MMMM yyyy')}</Text>
          <Text style={{ fontSize: 11, color: theme.text.tertiary, marginTop: 1 }}>
            {events?.length ?? 0} scheduled events
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            setMonth((m) => addMonths(m, 1));
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Next month"
        >
          <Ionicons name="chevron-forward" size={24} color={theme.text.primary} />
        </TouchableOpacity>
      </Animated.View>

      {/* Weekday Labels */}
      <View style={s.dayLabels}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <Text key={d} style={[s.dayLabel, { color: theme.text.tertiary }]}>
            {d}
          </Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <Animated.View entering={FadeInDown.duration(400).delay(60)} style={s.grid}>
        {days.map((day) => {
          const k = format(day, 'yyyy-MM-dd');
          const de = eventsByDate.get(k) ?? [];
          const selected = isSameDay(day, sel);
          const today = isToday(day);
          const inMonth = isSameMonth(day, month);

          return (
            <TouchableOpacity
              key={k}
              onPress={() => {
                Haptics.selectionAsync();
                setSel(day);
              }}
              style={s.dayCell}
              activeOpacity={0.7}
              accessibilityLabel={format(day, 'EEEE, MMMM d')}
            >
              <View
                style={[
                  s.dayNum,
                  selected && { backgroundColor: theme.brand.primary, ...shadows.sm },
                  today && !selected && { borderWidth: 1.5, borderColor: theme.brand.primary },
                ]}
              >
                <Text
                  style={[
                    s.dayTxt,
                    {
                      color: !inMonth
                        ? theme.text.disabled
                        : selected
                        ? '#FFFFFF'
                        : today
                        ? theme.brand.primary
                        : theme.text.primary,
                      fontWeight: selected || today ? fontWeight.bold : fontWeight.medium,
                    },
                  ]}
                >
                  {format(day, 'd')}
                </Text>
              </View>
              <View style={s.evDots}>
                {de.slice(0, 3).map((e, i) => (
                  <View key={i} style={[s.evDot, { backgroundColor: EC[e.color] ?? theme.brand.primary }]} />
                ))}
              </View>
            </TouchableOpacity>
          );
        })}
      </Animated.View>

      {/* Selected Day Agenda */}
      <Animated.View entering={FadeInUp.duration(400).delay(120)} style={[s.detail, { backgroundColor: theme.bg.secondary, borderTopColor: theme.border.subtle }]}>
        <View style={s.detHead}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(2, 132, 199, 0.12)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Ionicons name="calendar-outline" size={16} color={theme.brand.primary} />
            </View>
            <Text style={[s.detTitle, { color: theme.text.primary }]}>
              {isToday(sel) ? 'Today · ' : ''}
              {format(sel, 'EEEE, MMMM d')}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/calendar/new');
            }}
            style={[s.addBtn, { backgroundColor: theme.brand.primaryBg }]}
            accessibilityLabel="Add event"
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color={theme.brand.primary} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <SkeletonCard />
        ) : selEvents.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="No events scheduled"
            description="Tap + to schedule an appointment or reminder for this day."
            style={{ paddingVertical: spacing[8] }}
          />
        ) : (
          <FlatList
            data={selEvents}
            keyExtractor={(e) => e.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing[2], padding: spacing[4], paddingTop: 0, paddingBottom: 120 }}
            renderItem={({ item, index }) => (
              <TouchableCard
                index={index}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/calendar/${item.id}` as never);
                }}
                style={s.evRow}
              >
                <View style={[s.evAccent, { backgroundColor: EC[item.color] ?? theme.brand.primary }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.evTitle, { color: theme.text.primary }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[s.evTime, { color: theme.text.tertiary }]}>
                    {item.all_day
                      ? 'All day event'
                      : `${format(parseISO(item.start_at), 'h:mm a')} – ${format(parseISO(item.end_at), 'h:mm a')}`}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.text.tertiary} />
              </TouchableCard>
            )}
          />
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  mHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  mTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  dayLabels: { flexDirection: 'row', paddingHorizontal: spacing[3], paddingVertical: spacing[2] },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: fontSize.xs, fontWeight: fontWeight.bold, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing[3], paddingBottom: spacing[2] },
  dayCell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: spacing[1] },
  dayNum: { width: 34, height: 34, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  dayTxt: { fontSize: fontSize.sm },
  evDots: { flexDirection: 'row', gap: 2, marginTop: 2, height: 6, alignItems: 'center' },
  evDot: { width: 5, height: 5, borderRadius: radius.full },
  detail: { flex: 1, borderTopWidth: 1, marginTop: spacing[1] },
  detHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing[4] },
  detTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  addBtn: { width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  evRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], borderRadius: radius.xl },
  evAccent: { width: 4, height: 38, borderRadius: radius.full },
  evTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
  evTime: { fontSize: fontSize.xs, marginTop: 2 },
});
