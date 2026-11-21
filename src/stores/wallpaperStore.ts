import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type WallpaperPresetId =
  | 'nova'
  | 'starlight'
  | 'midnight'
  | 'sunset'
  | 'aurora'
  | 'custom';

export interface WallpaperPresetMeta {
  id: WallpaperPresetId;
  name: string;
  subtitle: string;
  badge?: string;
  circles: [string, string, string, string]; // Top left, top center, top right, center dip
  gradientBase: [string, string];
  darkBg: string;
  lightBg: string;
  hasPatternAsset?: boolean;
}

export const WALLPAPER_PRESETS: Record<WallpaperPresetId, WallpaperPresetMeta> = {
  nova: {
    id: 'nova',
    name: 'Nova AI',
    subtitle: 'Luminous organic U-shape blue blend',
    badge: 'SIGNATURE',
    circles: ['#2563EB', '#93C5FD', '#1D4ED8', '#3B82F6'],
    gradientBase: ['#1E40AF', '#060B13'],
    darkBg: '#060B13',
    lightBg: '#F0F7FF',
  },
  starlight: {
    id: 'starlight',
    name: 'Starlight Graffiti',
    subtitle: 'Blue grunge star pattern with dark fade',
    badge: 'EXCLUSIVE',
    circles: ['#1E3A8A', '#38BDF8', '#1D4ED8', '#2563EB'],
    gradientBase: ['#0C2340', '#060B13'],
    darkBg: '#060B13',
    lightBg: '#F0F6FC',
    hasPatternAsset: true,
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Aura',
    subtitle: 'Deep violet & obsidian cosmic glow',
    circles: ['#4C1D95', '#A78BFA', '#2E1065', '#7C3AED'],
    gradientBase: ['#2E1065', '#060814'],
    darkBg: '#060814',
    lightBg: '#FBF8FF',
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset Twilight',
    subtitle: 'Warm amber, coral & magenta dusk',
    circles: ['#BE185D', '#FDBA74', '#E11D48', '#F59E0B'],
    gradientBase: ['#881337', '#10080E'],
    darkBg: '#10080E',
    lightBg: '#FFF8F6',
  },
  aurora: {
    id: 'aurora',
    name: 'Aurora Borealis',
    subtitle: 'Emerald & luminous neon cyan stream',
    circles: ['#059669', '#6EE7B7', '#047857', '#0D9488'],
    gradientBase: ['#064E3B', '#050E0A'],
    darkBg: '#050E0A',
    lightBg: '#F0FDF8',
  },
  custom: {
    id: 'custom',
    name: 'Custom Photo',
    subtitle: 'Your personal gallery photo or artwork',
    badge: 'PHOTO',
    circles: ['#2563EB', '#93C5FD', '#1D4ED8', '#3B82F6'],
    gradientBase: ['#1E40AF', '#060B13'],
    darkBg: '#060B13',
    lightBg: '#F8FAFC',
  },
};

export interface WallpaperConfig {
  preset: WallpaperPresetId;
  customImageUri?: string | null;
  blurAmount: number; // 0 to 100
  vignette: boolean;
  shapeOpacity: number; // 0.2 to 1.0
}

export const DEFAULT_WALLPAPER_CONFIG: WallpaperConfig = {
  preset: 'nova',
  customImageUri: null,
  blurAmount: 50,
  vignette: true,
  shapeOpacity: 0.95,
};

export type ScreenTarget =
  | 'global'
  | 'home'
  | 'calendar'
  | 'goals'
  | 'tasks'
  | 'notes'
  | 'finance'
  | 'habits'
  | 'more';

export const SCREEN_TARGET_LABELS: Record<ScreenTarget, string> = {
  global: 'All Screens (Default)',
  home: 'Home Dashboard',
  calendar: 'Calendar & Schedule',
  goals: 'Goals & Milestones',
  tasks: 'Tasks & Projects',
  notes: 'Notes & Ideas',
  finance: 'Finance & Wealth',
  habits: 'Habits & Streaks',
  more: 'More & Settings',
};

const WALLPAPER_STORAGE_KEY = 'lifeos_wallpaper_config_v2';

interface PersistedWallpaperState {
  globalConfig: WallpaperConfig;
  pageOverrides: Record<string, WallpaperConfig>;
}

export interface WallpaperState {
  globalConfig: WallpaperConfig;
  pageOverrides: Record<string, WallpaperConfig>;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setGlobalConfig: (updates: Partial<WallpaperConfig>) => Promise<void>;
  setPageOverride: (screen: string, updates: Partial<WallpaperConfig>) => Promise<void>;
  resetPageOverride: (screen: string) => Promise<void>;
  resetAll: () => Promise<void>;
  getConfigForScreen: (screen?: string) => WallpaperConfig;
}

export const useWallpaperStore = create<WallpaperState>((set, get) => ({
  globalConfig: { ...DEFAULT_WALLPAPER_CONFIG },
  pageOverrides: {},
  isInitialized: false,

  initialize: async () => {
    try {
      const raw = await AsyncStorage.getItem(WALLPAPER_STORAGE_KEY);
      if (raw) {
        const parsed: PersistedWallpaperState = JSON.parse(raw);
        set({
          globalConfig: { ...DEFAULT_WALLPAPER_CONFIG, ...(parsed.globalConfig || {}) },
          pageOverrides: parsed.pageOverrides || {},
          isInitialized: true,
        });
        return;
      }
    } catch {
      // fallback to defaults on error
    }
    set({ isInitialized: true });
  },

  setGlobalConfig: async (updates) => {
    const current = get().globalConfig;
    const next: WallpaperConfig = { ...current, ...updates };
    set({ globalConfig: next });

    try {
      const stateToPersist: PersistedWallpaperState = {
        globalConfig: next,
        pageOverrides: get().pageOverrides,
      };
      await AsyncStorage.setItem(WALLPAPER_STORAGE_KEY, JSON.stringify(stateToPersist));
    } catch {}
  },

  setPageOverride: async (screen, updates) => {
    const currentOverrides = { ...get().pageOverrides };
    const base = currentOverrides[screen] || { ...get().globalConfig };
    const next: WallpaperConfig = { ...base, ...updates };
    currentOverrides[screen] = next;

    set({ pageOverrides: currentOverrides });

    try {
      const stateToPersist: PersistedWallpaperState = {
        globalConfig: get().globalConfig,
        pageOverrides: currentOverrides,
      };
      await AsyncStorage.setItem(WALLPAPER_STORAGE_KEY, JSON.stringify(stateToPersist));
    } catch {}
  },

  resetPageOverride: async (screen) => {
    const currentOverrides = { ...get().pageOverrides };
    delete currentOverrides[screen];
    set({ pageOverrides: currentOverrides });

    try {
      const stateToPersist: PersistedWallpaperState = {
        globalConfig: get().globalConfig,
        pageOverrides: currentOverrides,
      };
      await AsyncStorage.setItem(WALLPAPER_STORAGE_KEY, JSON.stringify(stateToPersist));
    } catch {}
  },

  resetAll: async () => {
    set({
      globalConfig: { ...DEFAULT_WALLPAPER_CONFIG },
      pageOverrides: {},
    });
    try {
      await AsyncStorage.removeItem(WALLPAPER_STORAGE_KEY);
    } catch {}
  },

  getConfigForScreen: (screen?: string) => {
    const state = get();
    if (screen && state.pageOverrides[screen]) {
      return state.pageOverrides[screen];
    }
    return state.globalConfig;
  },
}));
