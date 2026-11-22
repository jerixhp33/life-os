import { Platform } from 'react-native';

export const palette = {
  amber: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  ember: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F97316',
    600: '#EA580C',
    700: '#C2410C',
    800: '#9A3412',
    900: '#7C2D12',
  },
  charcoal: {
    50: '#F9F8F6',
    100: '#F2EFE9',
    200: '#E4DFD6',
    300: '#C8C1B5',
    400: '#9B9284',
    500: '#6E6659',
    600: '#4A4338',
    700: '#2C2720',
    800: '#1A1713',
    900: '#0C0B0A',
  },
  // Legacy aliases for backward compatibility
  ocean: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#0C0B0A',
  },
  cyan: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#F59E0B',
    600: '#EA580C',
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
    primary: '#1A1612',
    secondary: '#483E34',
    tertiary: '#7A6E60',
    disabled: '#A69B8D',
    inverse: '#FFFFFF',
    placeholder: '#A69B8D',
    link: '#D97706',
  },
  brand: {
    primary: '#D97706',
    primaryDim: '#F59E0B',
    primaryBg: '#FEF3C7',
  },
  border: {
    subtle: 'rgba(26, 22, 18, 0.08)',
    default: 'rgba(26, 22, 18, 0.14)',
    strong: 'rgba(26, 22, 18, 0.26)',
    focus: '#D97706',
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
  info: '#D97706',
  infoBg: '#FFFBEB',
};

// Warm Ambient Luxury Theme inspired by Projector Control App (Image 3)
// Obsidian warm black base with luminous amber, copper, and pure transparent glass cards
export const darkTheme = {
  bg: {
    primary: '#0C0B0A',       // Deep obsidian charcoal warm base
    secondary: '#141210',     // Subtle warm charcoal elevated
    tertiary: '#1B1815',      // Warm charcoal tier 3
    elevated: '#24201C',      // Elevated surface
    overlay: 'rgba(0, 0, 0, 0.75)',
  },
  surface: {
    default: 'rgba(255, 255, 255, 0.05)',  // Full glass card WITHOUT inner opaque color!
    raised: 'rgba(255, 255, 255, 0.08)',   // Elevated glass card
    inset: 'rgba(0, 0, 0, 0.35)',          // Deep glass inset
    overlay: 'rgba(20, 18, 16, 0.88)',
  },
  text: {
    primary: '#FFFFFF',       // Crisp pure white
    secondary: '#E8DFD6',     // Warm ivory / soft bone
    tertiary: '#A89F91',      // Warm sand / refined taupe
    disabled: '#5E574D',      // Muted warm charcoal
    inverse: '#0C0B0A',
    placeholder: '#7A7266',
    link: '#F59E0B',          // Warm amber gold
  },
  brand: {
    primary: '#F59E0B',       // Warm luxury amber
    primaryDim: '#B45309',    // Deep bronze
    primaryBg: 'rgba(245, 158, 11, 0.15)', // Translucent amber glow
  },
  border: {
    subtle: 'rgba(255, 255, 255, 0.10)',
    default: 'rgba(255, 255, 255, 0.16)',
    strong: 'rgba(255, 255, 255, 0.28)',
    focus: '#F59E0B',
  },
  frostedGlass: {
    tint: 'rgba(255, 255, 255, 0.06)',
    intensity: 40,
    fallbackBg: 'rgba(24, 21, 18, 0.85)',
  },
  success: '#10B981',
  successBg: 'rgba(16, 185, 129, 0.15)',
  warning: '#F59E0B',
  warningBg: 'rgba(245, 158, 11, 0.15)',
  error: '#EF4444',
  errorBg: 'rgba(239, 68, 68, 0.15)',
  info: '#F59E0B',
  infoBg: 'rgba(245, 158, 11, 0.12)',
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
  low:    { bg: 'rgba(255, 255, 255, 0.08)', text: '#A89F91', dot: '#A89F91' },
  medium: { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', dot: '#F59E0B' },
  high:   { bg: 'rgba(234, 88, 12, 0.18)', text: '#EA580C', dot: '#F97316' },
  urgent: { bg: 'rgba(239, 68, 68, 0.20)', text: '#EF4444', dot: '#EF4444' },
};

export const eventColors = {
  violet: '#F59E0B',
  blue: '#FBBF24',
  green: '#10B981',
  yellow: '#FDE68A',
  red: '#EF4444',
  pink: '#EA580C',
  orange: '#F97316',
};

export const touchTarget = { min: 44, comfortable: 48, large: 56 };
export const iconSize = { xs: 14, sm: 18, md: 22, lg: 26, xl: 32, '2xl': 40 };
export const animation = {
  duration: { instant: 0, fast: 150, normal: 250, slow: 400 },
};
