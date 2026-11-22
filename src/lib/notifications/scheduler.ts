import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { requestNotificationPermission, cancelNotification } from './service';
import type { CalendarEvent, Task } from '../../types';

export const NOTIFICATION_CHANNELS = {
  BRIEFINGS: 'briefings',
  MEETINGS: 'meetings',
  HABITS: 'habits',
  FINANCE: 'finance',
} as const;

/**
 * Configure dedicated Android notification channels with custom importance & lights.
 */
export async function initializeNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.BRIEFINGS, {
    name: 'Daily Briefings & AI Insights',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 150, 200],
    lightColor: '#38BDF8',
  });

  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.MEETINGS, {
    name: 'Meeting Preparation & Calls',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 300, 200, 300],
    lightColor: '#6366F1',
  });

  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.HABITS, {
    name: 'Habit Routines & Streak Guard',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#F59E0B',
  });

  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.FINANCE, {
    name: 'Finance & Budget Thresholds',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 150, 150],
    lightColor: '#10B981',
  });
}

/**
 * Schedules the recurring morning productivity briefing.
 */
export async function scheduleDailyMorningBriefing(hour = 7, minute = 30): Promise<string | null> {
  const ok = await requestNotificationPermission();
  if (!ok) return null;

  const notifId = 'daily_morning_briefing';
  await cancelNotification(notifId);

  try {
    return await Notifications.scheduleNotificationAsync({
      identifier: notifId,
      content: {
        title: 'Good Morning from LifeOS ☀️',
        body: "Your daily priorities, schedule, and habit routines are ready for review.",
        data: { type: 'briefing' },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: NOTIFICATION_CHANNELS.BRIEFINGS,
      },
    });
  } catch (e) {
    console.error('[Scheduler] Morning Briefing Error:', e);
    return null;
  }
}

/**
 * Schedules the evening streak guard notification.
 */
export async function scheduleEveningStreakGuard(hour = 20, minute = 30): Promise<string | null> {
  const ok = await requestNotificationPermission();
  if (!ok) return null;

  const notifId = 'daily_evening_streak_guard';
  await cancelNotification(notifId);

  try {
    return await Notifications.scheduleNotificationAsync({
      identifier: notifId,
      content: {
        title: 'Protect Your Streak 🔥',
        body: "Don't let your consistency slip! Check off any remaining habits before midnight.",
        data: { type: 'habit_guard' },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: NOTIFICATION_CHANNELS.HABITS,
      },
    });
  } catch (e) {
    console.error('[Scheduler] Streak Guard Error:', e);
    return null;
  }
}

/**
 * Schedules an urgent 15-minute preparation reminder for a calendar meeting.
 */
export async function scheduleMeetingPrepReminder(event: CalendarEvent): Promise<string | null> {
  if (event.all_day) return null;
  const ok = await requestNotificationPermission();
  if (!ok) return null;

  const eventStart = new Date(event.start_at).getTime();
  const alertTime = new Date(eventStart - 15 * 60 * 1000); // 15 mins prior

  if (alertTime.getTime() <= Date.now()) return null;

  const notifId = `meeting_prep_${event.id}`;
  await cancelNotification(notifId);

  try {
    return await Notifications.scheduleNotificationAsync({
      identifier: notifId,
      content: {
        title: `Starting in 15 mins: ${event.title} 📅`,
        body: event.location ? `Location: ${event.location}` : 'Tap to review agenda and prepare.',
        data: { type: 'meeting', eventId: event.id },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: alertTime,
        channelId: NOTIFICATION_CHANNELS.MEETINGS,
      },
    });
  } catch (e) {
    console.error('[Scheduler] Meeting Prep Error:', e);
    return null;
  }
}
