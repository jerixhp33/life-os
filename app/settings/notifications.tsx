import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../src/theme/ThemeContext';
import { AppBackground } from '../../src/components/layout/AppBackground';
import {
  scheduleDailyMorningBriefing,
  scheduleEveningStreakGuard,
} from '../../src/lib/notifications/scheduler';
import { fontSize, fontWeight, radius, shadows, spacing } from '../../src/theme/tokens';

const PREFS_KEY = 'lifeos_notification_preferences_v1';

export default function NotificationSettingsScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();

  const [masterEnabled, setMasterEnabled] = useState(true);
  const [morningBriefing, setMorningBriefing] = useState(true);
  const [morningHour, setMorningHour] = useState(7);
  const [morningMinute, setMorningMinute] = useState(30);

  const [eveningStreakGuard, setEveningStreakGuard] = useState(true);
  const [eveningHour, setEveningHour] = useState(20);
  const [eveningMinute, setEveningMinute] = useState(30);

  const [meetingAlerts, setMeetingAlerts] = useState(true);
  const [budgetWarnings, setBudgetWarnings] = useState(true);
  const [quietHours, setQuietHours] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(PREFS_KEY).then((raw) => {
      if (raw) {
        try {
          const p = JSON.parse(raw);
          if (p.masterEnabled !== undefined) setMasterEnabled(p.masterEnabled);
          if (p.morningBriefing !== undefined) setMorningBriefing(p.morningBriefing);
          if (p.morningHour !== undefined) setMorningHour(p.morningHour);
          if (p.morningMinute !== undefined) setMorningMinute(p.morningMinute);
          if (p.eveningStreakGuard !== undefined) setEveningStreakGuard(p.eveningStreakGuard);
          if (p.eveningHour !== undefined) setEveningHour(p.eveningHour);
          if (p.eveningMinute !== undefined) setEveningMinute(p.eveningMinute);
          if (p.meetingAlerts !== undefined) setMeetingAlerts(p.meetingAlerts);
          if (p.budgetWarnings !== undefined) setBudgetWarnings(p.budgetWarnings);
          if (p.quietHours !== undefined) setQuietHours(p.quietHours);
        } catch {}
      }
    });
  }, []);

  const savePreferences = async (updates: Record<string, any>) => {
    const current = {
      masterEnabled,
      morningBriefing,
      morningHour,
      morningMinute,
      eveningStreakGuard,
      eveningHour,
      eveningMinute,
      meetingAlerts,
      budgetWarnings,
      quietHours,
      ...updates,
    };
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(current));
  };

  const handleToggleMorning = async (val: boolean) => {
    Haptics.selectionAsync();
    setMorningBriefing(val);
    await savePreferences({ morningBriefing: val });
    if (val && masterEnabled) {
      await scheduleDailyMorningBriefing(morningHour, morningMinute);
    }
  };

  const handleToggleEvening = async (val: boolean) => {
    Haptics.selectionAsync();
    setEveningStreakGuard(val);
    await savePreferences({ eveningStreakGuard: val });
    if (val && masterEnabled) {
      await scheduleEveningStreakGuard(eveningHour, eveningMinute);
    }
  };

  return (
    <View style={s.container}>
      <AppBackground screenName="notifications" />

      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(350)} style={s.header}>
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              router.back();
            }}
            style={[
              s.iconBtn,
              {
                backgroundColor: isDark ? 'rgba(10, 36, 56, 0.75)' : 'rgba(255, 255, 255, 0.85)',
                borderColor: isDark ? 'rgba(168, 220, 244, 0.28)' : 'rgba(15, 23, 42, 0.12)',
              },
            ]}
          >
            <Ionicons name="chevron-back" size={22} color={theme.text.primary} />
          </TouchableOpacity>

          <View style={s.headerTitleBox}>
            <Text style={[s.headerTitle, { color: theme.text.primary }]}>
              Notifications
            </Text>
            <Text style={[s.headerSubtitle, { color: isDark ? '#819BB3' : '#64748B' }]}>
              Proactive alerts & routines
            </Text>
          </View>

          <View style={{ width: 42 }} />
        </Animated.View>

        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Master Switch Card */}
          <View
            style={[
              s.card,
              {
                backgroundColor: isDark ? 'rgba(10, 36, 56, 0.85)' : 'rgba(255, 255, 255, 0.88)',
                borderColor: isDark ? 'rgba(168, 220, 244, 0.28)' : 'rgba(255, 255, 255, 0.95)',
              },
            ]}
          >
            <View style={s.switchRow}>
              <View style={s.switchInfo}>
                <Text style={[s.cardTitle, { color: theme.text.primary }]}>
                  Allow Push Notifications
                </Text>
                <Text style={[s.cardDesc, { color: isDark ? '#819BB3' : '#64748B' }]}>
                  Master switch for all schedule and proactive alerts
                </Text>
              </View>
              <Switch
                value={masterEnabled}
                onValueChange={(val) => {
                  Haptics.selectionAsync();
                  setMasterEnabled(val);
                  savePreferences({ masterEnabled: val });
                }}
                trackColor={{ false: '#64748B', true: '#38BDF8' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Section: Autonomous Daily Briefings */}
          <Text style={[s.sectionHeader, { color: isDark ? '#819BB3' : '#64748B' }]}>
            SCHEDULED ROUTINES
          </Text>

          <View
            style={[
              s.card,
              {
                backgroundColor: isDark ? 'rgba(10, 36, 56, 0.85)' : 'rgba(255, 255, 255, 0.88)',
                borderColor: isDark ? 'rgba(168, 220, 244, 0.28)' : 'rgba(255, 255, 255, 0.95)',
              },
            ]}
          >
            {/* Morning Briefing */}
            <View style={s.switchRow}>
              <View style={s.switchInfo}>
                <Text style={[s.cardTitle, { color: theme.text.primary }]}>
                  Morning Briefing
                </Text>
                <Text style={[s.cardDesc, { color: isDark ? '#819BB3' : '#64748B' }]}>
                  Synthesizes daily priorities, meetings & agenda at 07:30 AM
                </Text>
              </View>
              <Switch
                disabled={!masterEnabled}
                value={morningBriefing && masterEnabled}
                onValueChange={handleToggleMorning}
                trackColor={{ false: '#64748B', true: '#38BDF8' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[s.divider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' }]} />

            {/* Evening Streak Guard */}
            <View style={s.switchRow}>
              <View style={s.switchInfo}>
                <Text style={[s.cardTitle, { color: theme.text.primary }]}>
                  Evening Streak Guard
                </Text>
                <Text style={[s.cardDesc, { color: isDark ? '#819BB3' : '#64748B' }]}>
                  Gentle alert at 20:30 PM if habits remain uncompleted
                </Text>
              </View>
              <Switch
                disabled={!masterEnabled}
                value={eveningStreakGuard && masterEnabled}
                onValueChange={handleToggleEvening}
                trackColor={{ false: '#64748B', true: '#38BDF8' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Section: Contextual Reminders */}
          <Text style={[s.sectionHeader, { color: isDark ? '#819BB3' : '#64748B' }]}>
            INTELLIGENCE ALERTS
          </Text>

          <View
            style={[
              s.card,
              {
                backgroundColor: isDark ? 'rgba(10, 36, 56, 0.85)' : 'rgba(255, 255, 255, 0.88)',
                borderColor: isDark ? 'rgba(168, 220, 244, 0.28)' : 'rgba(255, 255, 255, 0.95)',
              },
            ]}
          >
            {/* Meeting Prep Warnings */}
            <View style={s.switchRow}>
              <View style={s.switchInfo}>
                <Text style={[s.cardTitle, { color: theme.text.primary }]}>
                  Meeting Prep Warnings
                </Text>
                <Text style={[s.cardDesc, { color: isDark ? '#819BB3' : '#64748B' }]}>
                  Urgent alerts 15 minutes before scheduled calendar calls
                </Text>
              </View>
              <Switch
                disabled={!masterEnabled}
                value={meetingAlerts && masterEnabled}
                onValueChange={(val) => {
                  Haptics.selectionAsync();
                  setMeetingAlerts(val);
                  savePreferences({ meetingAlerts: val });
                }}
                trackColor={{ false: '#64748B', true: '#38BDF8' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[s.divider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' }]} />

            {/* Smart Budget Thresholds */}
            <View style={s.switchRow}>
              <View style={s.switchInfo}>
                <Text style={[s.cardTitle, { color: theme.text.primary }]}>
                  Budget Threshold Alerts
                </Text>
                <Text style={[s.cardDesc, { color: isDark ? '#819BB3' : '#64748B' }]}>
                  Notifies when monthly spending reaches 80% or 100% of limits
                </Text>
              </View>
              <Switch
                disabled={!masterEnabled}
                value={budgetWarnings && masterEnabled}
                onValueChange={(val) => {
                  Haptics.selectionAsync();
                  setBudgetWarnings(val);
                  savePreferences({ budgetWarnings: val });
                }}
                trackColor={{ false: '#64748B', true: '#38BDF8' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[s.divider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' }]} />

            {/* Quiet Hours */}
            <View style={s.switchRow}>
              <View style={s.switchInfo}>
                <Text style={[s.cardTitle, { color: theme.text.primary }]}>
                  Quiet Hours (Do Not Disturb)
                </Text>
                <Text style={[s.cardDesc, { color: isDark ? '#819BB3' : '#64748B' }]}>
                  Mute all non-critical notifications between 22:30 and 07:00
                </Text>
              </View>
              <Switch
                disabled={!masterEnabled}
                value={quietHours && masterEnabled}
                onValueChange={(val) => {
                  Haptics.selectionAsync();
                  setQuietHours(val);
                  savePreferences({ quietHours: val });
                }}
                trackColor={{ false: '#64748B', true: '#38BDF8' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  headerTitleBox: { alignItems: 'center' },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
    paddingLeft: 4,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    ...shadows.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchInfo: {
    flex: 1,
    paddingRight: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 14,
  },
});
