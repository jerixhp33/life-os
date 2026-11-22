import { Platform } from 'react-native';

export const palette = {
  azure: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  cyan: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#0EA5E9',
    600: '#0284C7',
    700: '#0369A1',
    800: '#075985',
    900: '#0C4A6E',
  },
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
  // Aliases for compatibility
  ocean: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  amber: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  ember: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#0EA5E9',
    600: '#0284C7',
    700: '#0369A1',
    800: '#075985',
    900: '#0C4A6E',
  },
  charcoal: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#000000',
  },
};

export const lightTheme = {
  bg: {
    primary: '#FAF7F2',
    secondary: '#FFFFFF',
    tertiary: '#F3EDE4',
    elevated: '#FFFFFF',
    overlay: 'rgba(18, 16, 14, 0.45)',
  },
  surface: {
    default: 'rgba(255, 255, 255, 0.82)',
    raised: 'rgba(255, 255, 255, 0.94)',
    inset: '#EFEAE0',
    overlay: 'rgba(255, 255, 255, 0.95)',
  },
  text: {
    primary: '#0F172A',
    secondary: '#334155',
    tertiary: '#64748B',
    disabled: '#94A3B8',
    inverse: '#FFFFFF',
    placeholder: '#94A3B8',
    link: '#2563EB',
  },
  brand: {
    primary: '#2563EB',
    primaryDim: '#1D4ED8',
    primaryBg: '#EFF6FF',
  },
  border: {
    subtle: 'rgba(15, 23, 42, 0.08)',
    default: 'rgba(15, 23, 42, 0.14)',
    strong: 'rgba(15, 23, 42, 0.26)',
    focus: '#2563EB',
  },
  frostedGlass: {
    tint: 'rgba(255, 255, 255, 0.85)',
    intensity: 45,
    fallbackBg: '#FFFFFF',
  },
  success: '#10B981',
  successBg: '#ECFDF5',
  warning: '#0284C7',
  warningBg: '#F0F9FF',
  error: '#EF4444',
  errorBg: '#FEF2F2',
  info: '#0284C7',
  infoBg: '#F0F9FF',
};

// Nova AI Theme inspired by Shapes -> Blur effect -> Final Design
// Pitch-black base (#000000) with cool azure, periwinkle, and pure transparent glass cards
export const darkTheme = {
  bg: {
    primary: '#000000',       // True pitch black (Nova AI panel 3)
    secondary: '#07090E',     // Deep obsidian with cool undertone
    tertiary: '#0E111B',      // Deep navy-charcoal
    elevated: '#151928',      // Elevated surface
    overlay: 'rgba(0, 0, 0, 0.85)',
  },
  surface: {
    default: 'rgba(255, 255, 255, 0.04)',  // Full transparent glass card WITHOUT inner opaque color!
    raised: 'rgba(255, 255, 255, 0.07)',   // Elevated glass card
    inset: 'rgba(0, 0, 0, 0.40)',          // Deep glass inset
    overlay: 'rgba(10, 12, 18, 0.90)',
  },
  text: {
    primary: '#FFFFFF',       // Crisp pure white
    secondary: '#E2E8F0',     // Clean cool slate / white
    tertiary: '#94A3B8',      // Muted cool slate
    disabled: '#475569',      // Dimmed text
    inverse: '#000000',
    placeholder: '#64748B',
    link: '#60A5FA',          // Bright electric sky
  },
  brand: {
    primary: '#3B82F6',       // Electric Azure Blue
    primaryDim: '#2563EB',    // Deep Royal Blue
    primaryBg: 'rgba(59, 130, 246, 0.15)', // Translucent blue glow
  },
  border: {
    subtle: 'rgba(255, 255, 255, 0.08)',
    default: 'rgba(255, 255, 255, 0.12)',
    strong: 'rgba(255, 255, 255, 0.22)',
    focus: '#3B82F6',
  },
  frostedGlass: {
    tint: 'rgba(255, 255, 255, 0.05)',
    intensity: 45,
    fallbackBg: 'rgba(10, 12, 18, 0.88)',
  },
  success: '#10B981',
  successBg: 'rgba(16, 185, 129, 0.15)',
  warning: '#38BDF8',
  warningBg: 'rgba(56, 189, 248, 0.15)',
  error: '#EF4444',
  errorBg: 'rgba(239, 68, 68, 0.15)',
  info: '#38BDF8',
  infoBg: 'rgba(56, 189, 248, 0.15)',
};

export type Theme = typeof lightTheme;

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
} as const;

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  card: 18,
  full: 9999,
} as const;

export const fontFamily = {
  sans: Platform.select({ ios: 'SF Pro Display', android: 'Roboto', default: 'System' }),
  mono: Platform.select({ ios: 'SF Mono', android: 'monospace', default: 'monospace' }),
};

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 19,
  xl: 22,
  '2xl': 26,
  '3xl': 30,
  '4xl': 36,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const shadows = {
  none: {},
  sm: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3 },
    android: { elevation: 1 },
    default: {},
  }),
  md: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.22, shadowRadius: 8 },
    android: { elevation: 3 },
    default: {},
  }),
  lg: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 16 },
    android: { elevation: 6 },
    default: {},
  }),
};

export const priorityColors = {
  low:    { bg: 'rgba(255, 255, 255, 0.08)', text: '#94A3B8', dot: '#94A3B8' },
  medium: { bg: 'rgba(96, 165, 250, 0.16)', text: '#60A5FA', dot: '#60A5FA' },
  high:   { bg: 'rgba(56, 189, 248, 0.18)', text: '#38BDF8', dot: '#38BDF8' },
  urgent: { bg: 'rgba(239, 68, 68, 0.20)', text: '#EF4444', dot: '#EF4444' },
};

export const eventColors = {
  violet: '#818CF8',
  blue: '#3B82F6',
  green: '#10B981',
  yellow: '#38BDF8',
  red: '#EF4444',
  pink: '#A5B4FC',
  orange: '#60A5FA',
};

export const touchTarget = { min: 44, comfortable: 48, large: 56 };
export const iconSize = { xs: 14, sm: 18, md: 22, lg: 26, xl: 32, '2xl': 40 };
export const animation = {
  duration: { instant: 0, fast: 150, normal: 250, slow: 400 },
};
