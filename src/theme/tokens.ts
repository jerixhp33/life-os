import { Platform } from 'react-native';

export const palette = {
  ocean: {
    50: '#F0F7FB',
    100: '#E0EFF7',
    200: '#BAE0F3',
    300: '#7DC8EC',
    400: '#38BDF8',
    500: '#0EA5E9',
    600: '#0284C7',
    700: '#1A5A7F',
    800: '#0E2E44',
    900: '#071524',
  },
  cyan: {
    50: '#F0FDFF',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#38BDF8',
    600: '#5AC8FA',
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
};

export const lightTheme = {
  bg: {
    primary: '#F2F4F7',
    secondary: '#FFFFFF',
    tertiary: '#E5E9F0',
    elevated: '#FFFFFF',
    overlay: 'rgba(15, 23, 42, 0.45)',
  },
  surface: {
    default: '#FFFFFF',
    raised: '#FFFFFF',
    inset: '#EDF1F7',
    overlay: 'rgba(255, 255, 255, 0.95)',
  },
  text: {
    primary: '#0F172A',
    secondary: '#334155',
    tertiary: '#64748B',
    disabled: '#94A3B8',
    inverse: '#FFFFFF',
    placeholder: '#94A3B8',
    link: '#0284C7',
  },
  brand: {
    primary: '#0284C7',
    primaryDim: '#38BDF8',
    primaryBg: '#E0F2FE',
  },
  border: {
    subtle: 'rgba(15, 23, 42, 0.08)',
    default: 'rgba(15, 23, 42, 0.16)',
    strong: 'rgba(15, 23, 42, 0.28)',
    focus: '#0284C7',
  },
  frostedGlass: {
    tint: 'rgba(255, 255, 255, 0.85)',
    intensity: 45,
    fallbackBg: '#FFFFFF',
  },
  success: '#10B981',
  successBg: '#ECFDF5',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  error: '#EF4444',
  errorBg: '#FEF2F2',
  info: '#0284C7',
  infoBg: '#F0F9FF',
};

export const darkTheme = {
  bg: {
    primary: '#071524',
    secondary: '#0C2036',
    tertiary: '#112C4A',
    elevated: '#17395E',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
  surface: {
    default: 'rgba(14, 38, 64, 0.82)',
    raised: 'rgba(20, 52, 86, 0.90)',
    inset: '#05101C',
    overlay: 'rgba(14, 38, 64, 0.96)',
  },
  text: {
    primary: '#F8FAFC',
    secondary: '#CBD5E1',
    tertiary: '#819BB3',
    disabled: '#4A6278',
    inverse: '#071524',
    placeholder: '#5C758C',
    link: '#38BDF8',
  },
  brand: {
    primary: '#38BDF8',
    primaryDim: '#1A5A7F',
    primaryBg: '#0E2E44',
  },
  border: {
    subtle: 'rgba(56, 189, 248, 0.14)',
    default: 'rgba(56, 189, 248, 0.26)',
    strong: 'rgba(56, 189, 248, 0.42)',
    focus: '#38BDF8',
  },
  frostedGlass: {
    tint: 'rgba(14, 38, 64, 0.82)',
    intensity: 55,
    fallbackBg: '#0B1E32',
  },
  success: '#34D399',
  successBg: '#042A22',
  warning: '#FBBF24',
  warningBg: '#2E2205',
  error: '#F87171',
  errorBg: '#341014',
  info: '#38BDF8',
  infoBg: '#092742',
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
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
    android: { elevation: 1 },
    default: {},
  }),
  md: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8 },
    android: { elevation: 3 },
    default: {},
  }),
  lg: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 16 },
    android: { elevation: 6 },
    default: {},
  }),
};

export const priorityColors = {
  low:    { bg: '#EFF6FF', text: '#3B82F6', dot: '#3B82F6' },
  medium: { bg: '#FFFBEB', text: '#D97706', dot: '#F59E0B' },
  high:   { bg: '#FFF7ED', text: '#EA580C', dot: '#F97316' },
  urgent: { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444' },
};

export const eventColors = {
  violet: '#0284C7',
  blue: '#38BDF8',
  green: '#10B981',
  yellow: '#F59E0B',
  red: '#EF4444',
  pink: '#EC4899',
  orange: '#F97316',
};

export const touchTarget = { min: 44, comfortable: 48, large: 56 };
export const iconSize = { xs: 14, sm: 18, md: 22, lg: 26, xl: 32, '2xl': 40 };
export const animation = {
  duration: { instant: 0, fast: 150, normal: 250, slow: 400 },
  spring: { damping: 15, stiffness: 150, mass: 0.8 },
};
