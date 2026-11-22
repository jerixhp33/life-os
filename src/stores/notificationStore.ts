import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type NotificationType = 'task' | 'meeting' | 'habit' | 'intelligence' | 'system';

export interface LifeNotification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  actionRoute?: string;
  actionLabel?: string;
}

export interface NotificationStoreState {
  notifications: LifeNotification[];
  unreadCount: number;
  isLoaded: boolean;

  addNotification: (
    notif: Omit<LifeNotification, 'id' | 'createdAt' | 'read'> & { id?: string; createdAt?: string }
  ) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  initialize: () => Promise<void>;
}

const STORAGE_KEY = 'lifeos_notifications_v1';

const SEED_NOTIFICATIONS: LifeNotification[] = [
  {
    id: 'seed-1',
    title: 'Welcome to LifeOS Next-Gen 🚀',
    body: 'Explore your new Dynamic Island, 4K Focus Studio, and autonomous voice assistant!',
    type: 'intelligence',
    read: false,
    createdAt: new Date().toISOString(),
    actionRoute: '/focus',
    actionLabel: 'Open Focus Studio',
  },
  {
    id: 'seed-2',
    title: 'Daily Habit Streak Protection 🔥',
    body: 'Complete your daily routines before midnight to keep your active streak alive.',
    type: 'habit',
    read: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    actionRoute: '/habits',
    actionLabel: 'View Habits',
  },
  {
    id: 'seed-3',
    title: 'Life Balance Radar Online 📊',
    body: 'Your 5-axis equilibrium score is evaluated directly from your real records in Hub.',
    type: 'intelligence',
    read: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    actionRoute: '/more',
    actionLabel: 'View Radar',
  },
];

export const useNotificationStore = create<NotificationStoreState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoaded: false,

  addNotification: async (notif) => {
    const newItem: LifeNotification = {
      id: notif.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: notif.title,
      body: notif.body,
      type: notif.type,
      read: false,
      createdAt: notif.createdAt || new Date().toISOString(),
      actionRoute: notif.actionRoute,
      actionLabel: notif.actionLabel,
    };

    const updated = [newItem, ...get().notifications];
    const unread = updated.filter((n) => !n.read).length;

    set({ notifications: updated, unreadCount: unread });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  markAsRead: async (id) => {
    const updated = get().notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    const unread = updated.filter((n) => !n.read).length;
    set({ notifications: updated, unreadCount: unread });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  markAllAsRead: async () => {
    const updated = get().notifications.map((n) => ({ ...n, read: true }));
    set({ notifications: updated, unreadCount: 0 });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  deleteNotification: async (id) => {
    const updated = get().notifications.filter((n) => n.id !== id);
    const unread = updated.filter((n) => !n.read).length;
    set({ notifications: updated, unreadCount: unread });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  clearAll: async () => {
    set({ notifications: [], unreadCount: 0 });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  },

  initialize: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: LifeNotification[] = JSON.parse(stored);
        const unread = parsed.filter((n) => !n.read).length;
        set({ notifications: parsed, unreadCount: unread, isLoaded: true });
        return;
      }
    } catch {}

    // First time setup with helpful seeds
    const unread = SEED_NOTIFICATIONS.filter((n) => !n.read).length;
    set({ notifications: SEED_NOTIFICATIONS, unreadCount: unread, isLoaded: true });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_NOTIFICATIONS));
  },
}));
