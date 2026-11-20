import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SECURITY_STORAGE_KEY = 'lifeos_security_settings';

export interface SecuritySettings {
  isLockEnabled: boolean;
  lockTimeoutMinutes: number; // 0 = Immediate, 1 = 1 Min, 5 = 5 Mins, 15 = 15 Mins
}

export interface SecurityState extends SecuritySettings {
  isLocked: boolean;
  isInitialized: boolean;
  backgroundTimestamp: number | null;
  initialize: () => Promise<void>;
  unlock: () => void;
  lockNow: () => void;
  setLockEnabled: (enabled: boolean) => Promise<void>;
  setLockTimeout: (minutes: number) => Promise<void>;
  onAppBackground: () => void;
  onAppForeground: () => void;
}

export const useSecurityStore = create<SecurityState>((set, get) => ({
  isLockEnabled: false,
  lockTimeoutMinutes: 0, // default Immediate
  isLocked: false,
  isInitialized: false,
  backgroundTimestamp: null,

  initialize: async () => {
    try {
      const stored = await AsyncStorage.getItem(SECURITY_STORAGE_KEY);
      if (stored) {
        const parsed: SecuritySettings = JSON.parse(stored);
        set({
          isLockEnabled: parsed.isLockEnabled ?? false,
          lockTimeoutMinutes: parsed.lockTimeoutMinutes ?? 0,
          isLocked: parsed.isLockEnabled ?? false,
          isInitialized: true
        });
        return;
      }
    } catch {}
    set({ isInitialized: true });
  },

  unlock: () => {
    set({ isLocked: false, backgroundTimestamp: null });
  },

  lockNow: () => {
    set({ isLocked: true });
  },

  setLockEnabled: async (enabled: boolean) => {
    const current = get();
    const updated: SecuritySettings = {
      isLockEnabled: enabled,
      lockTimeoutMinutes: current.lockTimeoutMinutes
    };
    await AsyncStorage.setItem(SECURITY_STORAGE_KEY, JSON.stringify(updated));
    set({ isLockEnabled: enabled });
  },

  setLockTimeout: async (minutes: number) => {
    const current = get();
    const updated: SecuritySettings = {
      isLockEnabled: current.isLockEnabled,
      lockTimeoutMinutes: minutes
    };
    await AsyncStorage.setItem(SECURITY_STORAGE_KEY, JSON.stringify(updated));
    set({ lockTimeoutMinutes: minutes });
  },

  onAppBackground: () => {
    if (get().isLockEnabled) {
      set({ backgroundTimestamp: Date.now() });
    }
  },

  onAppForeground: () => {
    const { isLockEnabled, isLocked, backgroundTimestamp, lockTimeoutMinutes } = get();
    if (!isLockEnabled || isLocked) return;

    if (backgroundTimestamp == null) return;

    const elapsedSeconds = (Date.now() - backgroundTimestamp) / 1000;
    const timeoutSeconds = lockTimeoutMinutes * 60;

    if (elapsedSeconds >= timeoutSeconds) {
      set({ isLocked: true, backgroundTimestamp: null });
    }
  }
}));
