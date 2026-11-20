import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true
  } as any)
});

export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'General Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6957E8'
    });
    await Notifications.setNotificationChannelAsync('habits', {
      name: 'Habit Routines',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 300, 200, 300],
      lightColor: '#10B981'
    });
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleNotification(opts: {
  id?: string;
  title: string;
  body: string;
  trigger: Date;
  data?: Record<string, unknown>;
  channelId?: string;
}): Promise<string | null> {
  const ok = await requestNotificationPermission();
  if (!ok || opts.trigger <= new Date()) return null;
  if (opts.id) await cancelNotification(opts.id);
  try {
    return await Notifications.scheduleNotificationAsync({
      identifier: opts.id,
      content: {
        title: opts.title,
        body: opts.body,
        data: opts.data ?? {},
        sound: 'default'
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: opts.trigger,
        channelId: opts.channelId ?? 'default'
      }
    });
  } catch (e) {
    console.error('[Notifications]', e);
    return null;
  }
}

export async function scheduleDailyHabitRoutine(
  id: string,
  title: string,
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'anytime'
): Promise<string | null> {
  const ok = await requestNotificationPermission();
  if (!ok) return null;

  const timeMap = {
    morning: { hour: 8, minute: 0 },
    afternoon: { hour: 13, minute: 0 },
    evening: { hour: 20, minute: 0 },
    anytime: { hour: 9, minute: 30 }
  };

  const { hour, minute } = timeMap[timeOfDay] ?? timeMap.anytime;
  const notifId = `habit_daily_${id}`;
  await cancelNotification(notifId);

  try {
    return await Notifications.scheduleNotificationAsync({
      identifier: notifId,
      content: {
        title: 'Daily Habit Routine',
        body: `Time for your daily routine: ${title}`,
        data: { type: 'habit', id },
        sound: 'default'
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: 'habits'
      }
    });
  } catch (e) {
    console.error('[Habit Notification]', e);
    return null;
  }
}

export async function cancelNotification(id: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {}
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export const scheduleTaskReminder = (id: string, title: string, at: Date) =>
  scheduleNotification({ id: `task_${id}`, title: 'Task Reminder', body: title, trigger: at, data: { type: 'task', id } });

export const scheduleEventReminder = (id: string, title: string, at: Date) =>
  scheduleNotification({ id: `event_${id}`, title: 'Upcoming Event', body: title, trigger: at, data: { type: 'event', id } });

export const scheduleHabitReminder = (id: string, title: string, at: Date) =>
  scheduleNotification({ id: `habit_${id}`, title: 'Habit Reminder', body: `Time for: ${title}`, trigger: at, data: { type: 'habit', id } });

export async function setBadgeCount(n: number) {
  try {
    await Notifications.setBadgeCountAsync(n);
  } catch {}
}
