import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type HapticIntensity = 'light' | 'medium' | 'heavy';
export type SoundProfile = 'mechanical' | 'zen' | 'cyber' | 'minimal';

export interface SoundPreferencesState {
  hapticsEnabled: boolean;
  hapticIntensity: HapticIntensity;
  soundEnabled: boolean;
  soundProfile: SoundProfile;
  isLoaded: boolean;

  // Actions
  setHapticsEnabled: (enabled: boolean) => Promise<void>;
  setHapticIntensity: (intensity: HapticIntensity) => Promise<void>;
  setSoundEnabled: (enabled: boolean) => Promise<void>;
  setSoundProfile: (profile: SoundProfile) => Promise<void>;
  initialize: () => Promise<void>;
}

const STORAGE_KEY = 'lifeos_sound_preferences';

export const useSoundStore = create<SoundPreferencesState>((set, get) => ({
  hapticsEnabled: true,
  hapticIntensity: 'medium',
  soundEnabled: true,
  soundProfile: 'mechanical',
  isLoaded: false,

  setHapticsEnabled: async (enabled) => {
    set({ hapticsEnabled: enabled });
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...get(),
        hapticsEnabled: enabled,
      })
    );
  },

  setHapticIntensity: async (intensity) => {
    set({ hapticIntensity: intensity });
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...get(),
        hapticIntensity: intensity,
      })
    );
  },

  setSoundEnabled: async (enabled) => {
    set({ soundEnabled: enabled });
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...get(),
        soundEnabled: enabled,
      })
    );
  },

  setSoundProfile: async (profile) => {
    set({ soundProfile: profile });
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...get(),
        soundProfile: profile,
      })
    );
  },

  initialize: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set({
          hapticsEnabled: parsed.hapticsEnabled ?? true,
          hapticIntensity: parsed.hapticIntensity ?? 'medium',
          soundEnabled: parsed.soundEnabled ?? true,
          soundProfile: parsed.soundProfile ?? 'mechanical',
          isLoaded: true,
        });
        return;
      }
    } catch {}
    set({ isLoaded: true });
  },
}));
