import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
} from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius, shadows } from '../../src/theme/tokens';
import { useEvents } from '../../src/features/calendar/hooks';
import { SkeletonCard, EmptyState } from '../../src/components/feedback';
import { TouchableCard } from '../../src/components/ui/Card';
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

  // Selected date and current view month
  const [sel, setSel] = useState(new Date());
  const [month, setMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');

  const calStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const calEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });

  const { data: events, isLoading } = useEvents(calStart.toISOString(), calEnd.toISOString());

  // 7 days of the selected week (starting on Monday)
  const weekDays = useMemo(() => {
    const start = startOfWeek(sel, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [sel]);

  // All days of the current month grid
  const monthDays = useMemo(() => {
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

  const handlePrev = () => {
    Haptics.selectionAsync();
    if (viewMode === 'weekly') {
      const prev = subWeeks(sel, 1);
      setSel(prev);
      setMonth(prev);
    } else {
      setMonth((m) => subMonths(m, 1));
    }
  };

  const handleNext = () => {
    Haptics.selectionAsync();
    if (viewMode === 'weekly') {
      const next = addWeeks(sel, 1);
      setSel(next);
      setMonth(next);
    } else {
      setMonth((m) => addMonths(m, 1));
    }
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg.primary }]} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* ============================================================== */}
        {/* FROSTED GLASS WIDGET CARD (EXACT MATCH TO REFERENCE IMAGE)      */}
        {/* ============================================================== */}
        <Animated.View entering={FadeInDown.duration(420)} style={s.cardWrapper}>
          <View
            style={[
              s.frostedCard,
              {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.75)',
                shadowColor: '#E11D48',
              },
            ]}
          >
            {/* Background Ambient Glowing Pink/Coral Orb */}
            <LinearGradient
              colors={['#FF1E6D', '#FF416C', '#FF7557', 'transparent']}
              start={{ x: 0.5, y: 0.35 }}
              end={{ x: 0.5, y: 0.95 }}
              style={s.glowOrb}
            />

            {/* Frosted Layer */}
            {Platform.OS === 'ios' && (
              <BlurView
                tint={isDark ? 'dark' : 'light'}
                intensity={50}
                style={StyleSheet.absoluteFill}
              />
            )}
            <LinearGradient
              colors={
                isDark
                  ? ['rgba(10, 36, 56, 0.72)', 'rgba(10, 36, 56, 0.30)', 'rgba(10, 36, 56, 0.78)']
                  : ['rgba(255, 255, 255, 0.82)', 'rgba(255, 255, 255, 0.32)', 'rgba(255, 255, 255, 0.86)']
              }
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Inner Content of the Card */}
            <View style={s.cardInner}>
              {/* 1. TOP CONTROLS ROW */}
              <View style={s.topRow}>
                {/* Segmented Weekly / Monthly Pill */}
                <View
                  style={[
                    s.segmentedPill,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.12)'
                        : 'rgba(0, 0, 0, 0.06)',
                    },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.selectionAsync();
                      setViewMode('weekly');
                    }}
                    style={[
                      s.segBtn,
                      viewMode === 'weekly' && [
                        s.segBtnActive,
                        { backgroundColor: '#FFFFFF', ...shadows.sm },
                      ],
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        s.segText,
                        viewMode === 'weekly'
                          ? s.segTextActive
                          : { color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(15, 23, 42, 0.5)' },
                      ]}
                    >
                      Weekly
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      Haptics.selectionAsync();
                      setViewMode('monthly');
                    }}
                    style={[
                      s.segBtn,
                      viewMode === 'monthly' && [
                        s.segBtnActive,
                        { backgroundColor: '#FFFFFF', ...shadows.sm },
                      ],
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        s.segText,
                        viewMode === 'monthly'
                          ? s.segTextActive
                          : { color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(15, 23, 42, 0.5)' },
                      ]}
                    >
                      Monthly
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Right Actions: Prev/Next Chevrons & Settings Button */}
                <View style={s.topRightActions}>
                  <TouchableOpacity
                    onPress={handlePrev}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={[
                      s.iconCircleBtn,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.14)'
                          : 'rgba(255, 255, 255, 0.85)',
                      },
                    ]}
                    accessibilityLabel="Previous"
                  >
                    <Ionicons
                      name="chevron-back"
                      size={18}
                      color={isDark ? '#FFFFFF' : '#1E293B'}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleNext}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={[
                      s.iconCircleBtn,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.14)'
                          : 'rgba(255, 255, 255, 0.85)',
                      },
                    ]}
                    accessibilityLabel="Next"
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={isDark ? '#FFFFFF' : '#1E293B'}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push('/settings/profile');
                    }}
                    style={[
                      s.iconCircleBtn,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.16)'
                          : 'rgba(255, 255, 255, 0.85)',
                      },
                    ]}
                    accessibilityLabel="Calendar Settings"
                  >
                    <Ionicons
                      name="settings-sharp"
                      size={18}
                      color={isDark ? '#FFFFFF' : '#1E293B'}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* 2. DATE DISPLAY HEADLINE (e.g. "August  23" or "November  21") */}
              <View style={s.headlineRow}>
                <Text
                  style={[
                    s.headlineMonth,
                    { color: isDark ? '#FFFFFF' : '#1E293B' },
                  ]}
                  numberOfLines={1}
                >
                  {format(sel, 'MMMM')}
                </Text>
                <Text
                  style={[
                    s.headlineDay,
                    { color: isDark ? '#FFFFFF' : '#1E293B' },
                  ]}
                >
                  {format(sel, 'd')}
                </Text>
              </View>

              {/* 3. CENTER: WEEKDAY ARCHED RIBBON or MONTHLY GRID */}
              {viewMode === 'weekly' ? (
                <View style={s.ribbonContainer}>
                  {/* Frosted Arched Ribbon Band */}
                  <View
                    style={[
                      s.archedBand,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(255, 255, 255, 0.28)',
                        borderColor: isDark
                          ? 'rgba(255, 255, 255, 0.24)'
                          : 'rgba(255, 255, 255, 0.55)',
                      },
                    ]}
                  >
                    {weekDays.map((day) => {
                      const selected = isSameDay(day, sel);
                      const today = isToday(day);
                      const k = format(day, 'yyyy-MM-dd');
                      const dayEvs = eventsByDate.get(k) ?? [];

                      return (
                        <TouchableOpacity
                          key={day.toISOString()}
                          onPress={() => {
                            Haptics.selectionAsync();
                            setSel(day);
                            setMonth(day);
                          }}
                          style={s.ribbonDayCol}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              s.ribbonDayName,
                              {
                                color: selected
                                  ? (isDark ? '#FFFFFF' : '#1E293B')
                                  : (isDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(30, 41, 59, 0.55)'),
                                fontWeight: selected ? '700' : '500',
                              },
                            ]}
                          >
                            {format(day, 'EEE')}
                          </Text>

                          {selected ? (
                            <LinearGradient
                              colors={['#D91B62', '#FB7185', '#F97316']}
                              start={{ x: 0.15, y: 0.15 }}
                              end={{ x: 0.85, y: 0.85 }}
                              style={s.activeBadge}
                            >
                              <Text style={s.activeBadgeText}>
                                {format(day, 'd')}
                              </Text>
                            </LinearGradient>
                          ) : (
                            <View
                              style={[
                                s.inactiveDayBox,
                                today && [
                                  s.todayDayBox,
                                  { borderColor: theme.brand.primary },
                                ],
                              ]}
                            >
                              <Text
                                style={[
                                  s.inactiveDayText,
                                  {
                                    color: today
                                      ? theme.brand.primary
                                      : isDark
                                      ? '#FFFFFF'
                                      : '#1E293B',
                                  },
                                ]}
                              >
                                {format(day, 'd')}
                              </Text>
                              {dayEvs.length > 0 && (
                                <View style={s.dotIndicator} />
                              )}
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ) : (
                /* MONTHLY GRID VIEW */
                <View style={s.monthGridWrap}>
                  {/* Weekday Names */}
                  <View style={s.monthDayLabels}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(
                      (d) => (
                        <Text
                          key={d}
                          style={[
                            s.monthDayLabelText,
                            {
                              color: isDark
                                ? 'rgba(255, 255, 255, 0.6)'
                                : 'rgba(15, 23, 42, 0.5)',
                            },
                          ]}
                        >
                          {d}
                        </Text>
                      )
                    )}
                  </View>

                  {/* Day Cells */}
                  <View style={s.monthGrid}>
                    {monthDays.map((day) => {
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
                          style={s.monthCell}
                          activeOpacity={0.7}
                        >
                          {selected ? (
                            <LinearGradient
                              colors={['#D91B62', '#FB7185', '#F97316']}
                              start={{ x: 0.15, y: 0.15 }}
                              end={{ x: 0.85, y: 0.85 }}
                              style={s.monthActiveBadge}
                            >
                              <Text style={s.monthActiveBadgeText}>
                                {format(day, 'd')}
                              </Text>
                            </LinearGradient>
                          ) : (
                            <View
                              style={[
                                s.monthInactiveBox,
                                today && [
                                  s.todayDayBox,
                                  { borderColor: theme.brand.primary },
                                ],
                              ]}
                            >
                              <Text
                                style={[
                                  s.monthCellText,
                                  {
                                    color: !inMonth
                                      ? (isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(15, 23, 42, 0.25)')
                                      : today
                                      ? theme.brand.primary
                                      : isDark
                                      ? '#FFFFFF'
                                      : '#1E293B',
                                  },
                                ]}
                              >
                                {format(day, 'd')}
                              </Text>
                              {de.length > 0 && inMonth && (
                                <View style={s.dotIndicator} />
                              )}
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* 4. BOTTOM ACTION ROW INSIDE THE CARD */}
              <View style={s.bottomRow}>
                {/* Left: Add a note... */}
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/notes/new');
                  }}
                  style={s.addNoteBtn}
                  activeOpacity={0.75}
                  accessibilityLabel="Add a note"
                >
                  <Ionicons
                    name="pencil-outline"
                    size={15}
                    color={isDark ? '#F1F5F9' : '#1E293B'}
                  />
                  <Text
                    style={[
                      s.addNoteText,
                      { color: isDark ? '#F1F5F9' : '#1E293B' },
                    ]}
                  >
                    Add a note...
                  </Text>
                </TouchableOpacity>

                {/* Right: + New Event Pill */}
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/calendar/new');
                  }}
                  style={[
                    s.newEventPill,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.90)'
                        : '#FFFFFF',
                    },
                  ]}
                  activeOpacity={0.85}
                  accessibilityLabel="Create New Event"
                >
                  <Ionicons name="add" size={16} color="#0F172A" />
                  <Text style={s.newEventText}>New Event</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ============================================================== */}
        {/* AGENDA SECTION FOR THE SELECTED DAY                            */}
        {/* ============================================================== */}
        <Animated.View entering={FadeInUp.duration(400).delay(100)} style={s.agendaContainer}>
          <View style={s.agendaHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={[
                  s.agendaIconCircle,
                  {
                    backgroundColor: isDark
                      ? 'rgba(56, 189, 248, 0.16)'
                      : 'rgba(2, 132, 199, 0.12)',
                    borderColor: isDark
                      ? 'rgba(168, 220, 244, 0.25)'
                      : 'transparent',
                  },
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={15}
                  color={theme.brand.primary}
                />
              </View>
              <Text style={[s.agendaTitle, { color: theme.text.primary }]}>
                {isToday(sel) ? 'Today · ' : ''}
                {format(sel, 'EEEE, MMMM d')}
              </Text>
            </View>
            <View
              style={[
                s.eventCountBadge,
                {
                  backgroundColor: isDark
                    ? 'rgba(56, 189, 248, 0.14)'
                    : 'rgba(2, 132, 199, 0.10)',
                },
              ]}
            >
              <Text
                style={[s.eventCountText, { color: theme.brand.primary }]}
              >
                {selEvents.length} {selEvents.length === 1 ? 'event' : 'events'}
              </Text>
            </View>
          </View>

          {isLoading ? (
            <SkeletonCard />
          ) : selEvents.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title="No events scheduled"
              description={`Nothing booked for ${format(sel, 'MMMM d')}. Tap + New Event to schedule.`}
              actionLabel="Add Event"
              onAction={() => router.push('/calendar/new')}
              style={{ paddingVertical: spacing[6] }}
            />
          ) : (
            <View style={s.eventList}>
              {selEvents.map((item, index) => (
                <TouchableCard
                  key={item.id}
                  index={index}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/calendar/${item.id}` as never);
                  }}
                  style={s.evRow}
                >
                  <View
                    style={[
                      s.evAccent,
                      { backgroundColor: EC[item.color] ?? theme.brand.primary },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[s.evTitle, { color: theme.text.primary }]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text style={[s.evTime, { color: theme.text.tertiary }]}>
                      {item.all_day
                        ? 'All day event'
                        : `${format(parseISO(item.start_at), 'h:mm a')} – ${format(parseISO(item.end_at), 'h:mm a')}`}
                      {item.location ? ` · ${item.location}` : ''}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={theme.text.tertiary}
                  />
                </TouchableCard>
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  cardWrapper: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
  },
  frostedCard: {
    borderRadius: 34,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 10,
  },
  glowOrb: {
    position: 'absolute',
    top: '15%',
    left: '10%',
    right: '10%',
    bottom: '0%',
    borderRadius: 999,
    opacity: 0.85,
  },
  cardInner: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 22,
    gap: 18,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  segmentedPill: {
    flexDirection: 'row',
    borderRadius: 18,
    padding: 3,
    alignItems: 'center',
  },
  segBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 15,
  },
  segBtnActive: {},
  segText: {
    fontSize: 13,
    fontWeight: '600',
  },
  segTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 4,
    marginTop: 4,
  },
  headlineMonth: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headlineDay: {
    fontSize: 44,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  ribbonContainer: {
    marginVertical: 4,
  },
  archedBand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 24,
    borderWidth: 1.2,
  },
  ribbonDayCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  ribbonDayName: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
  activeBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D91B62',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  inactiveDayBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  inactiveDayText: {
    fontSize: 15,
    fontWeight: '600',
  },
  todayDayBox: {
    borderWidth: 1.5,
  },
  dotIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    opacity: 0.8,
  },
  monthGridWrap: {
    marginVertical: 4,
  },
  monthDayLabels: {
    flexDirection: 'row',
    paddingBottom: 6,
  },
  monthDayLabelText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 3,
  },
  monthActiveBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthActiveBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  monthInactiveBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  monthCellText: {
    fontSize: 13,
    fontWeight: '500',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 6,
  },
  addNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  addNoteText: {
    fontSize: 14,
    fontWeight: '500',
  },
  newEventPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  newEventText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  agendaContainer: {
    paddingHorizontal: spacing[5],
    marginTop: spacing[4],
  },
  agendaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  agendaIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  agendaTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  eventCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  eventCountText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  eventList: {
    gap: spacing[2],
  },
  evRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  evAccent: {
    width: 4,
    height: 38,
    borderRadius: radius.full,
  },
  evTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  evTime: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
});
