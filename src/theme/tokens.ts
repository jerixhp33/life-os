import { Platform } from 'react-native';

export const palette = {
  ocean: {
    50: '#E9EEF0',
    100: '#DBEDF6',
    200: '#C8D9E1',
    300: '#ACC3CF',
    400: '#9CBBCB',
    500: '#6F9DB5',
    600: '#1A5A7F',
    700: '#123E5C',
    800: '#0E2E44',
    900: '#0A2438'
  },
  cyan: {
    100: '#E0F2FE',
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#A8DCF4',
    600: '#0284C7'
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
    900: '#0F172A'
  }
};

export const lightTheme = {
  bg:      { primary:'#F0F5F9', secondary:'#FFFFFF', tertiary:'#E4EDF3', elevated:'#FFFFFF', overlay:'rgba(10,36,56,0.6)' },
  surface: { default:'#FFFFFF', raised:'#F7FAFC', inset:'#E9F1F6', overlay:'rgba(255,255,255,0.96)' },
  text:    { primary:'#0A2438', secondary:'#1A5A7F', tertiary:'#5A6B79', disabled:'#9CBBCB', inverse:'#FFFFFF', placeholder:'#6F9DB5', link:'#1A5A7F' },
  brand:   { primary:'#1A5A7F', primaryDim:'#6F9DB5', primaryBg:'#E0F2FE' },
  border:  { subtle:'#E2EEF5', default:'#ACC3CF', strong:'#6F9DB5', focus:'#1A5A7F' },
  success:'#10B981', successBg:'#ECFDF5', warning:'#D97706', warningBg:'#FFFBEB',
  error:'#EF4444', errorBg:'#FEF2F2', info:'#0284C7', infoBg:'#F0F9FF',
};

export const darkTheme = {
  bg:      { primary:'#0A2438', secondary:'#0E2E46', tertiary:'#133956', elevated:'#174466', overlay:'rgba(0,0,0,0.7)' },
  surface: { default:'#10324D', raised:'#164163', inset:'#071D2D', overlay:'rgba(16,50,77,0.97)' },
  text:    { primary:'#F0F8FF', secondary:'#C2E5F5', tertiary:'#9CBBCB', disabled:'#5A6B79', inverse:'#0A2438', placeholder:'#5A6B79', link:'#A8DCF4' },
  brand:   { primary:'#A8DCF4', primaryDim:'#1A5A7F', primaryBg:'#0D314B' },
  border:  { subtle:'rgba(168,220,244,0.14)', default:'rgba(168,220,244,0.25)', strong:'#3A7CA5', focus:'#A8DCF4' },
  success:'#34D399', successBg:'#032822', warning:'#FBBF24', warningBg:'#261C02',
  error:'#F87171', errorBg:'#2D0F13', info:'#38BDF8', infoBg:'#09253B',
};
export type Theme = typeof lightTheme;
export const spacing = { 0:0,1:4,2:8,3:12,4:16,5:20,6:24,7:28,8:32,10:40,12:48,14:56,16:64,20:80 } as const;
export const radius  = { xs:4,sm:8,md:12,lg:16,xl:20,'2xl':24,full:9999 } as const;
export const fontFamily = { sans: Platform.select({ ios:'SF Pro Text', android:'Roboto', default:'System' }), mono: Platform.select({ ios:'SF Mono', android:'monospace', default:'monospace' }) };
export const fontSize = { xs:11,sm:13,base:15,md:17,lg:19,xl:22,'2xl':26,'3xl':30,'4xl':36 } as const;
export const fontWeight = { regular:'400' as const, medium:'500' as const, semibold:'600' as const, bold:'700' as const };
export const shadows = {
  none:{},
  sm: Platform.select({ ios:{ shadowColor:'#000',shadowOffset:{width:0,height:1},shadowOpacity:0.06,shadowRadius:4 }, android:{ elevation:2 }, default:{} }),
  md: Platform.select({ ios:{ shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.08,shadowRadius:8 }, android:{ elevation:4 }, default:{} }),
  lg: Platform.select({ ios:{ shadowColor:'#000',shadowOffset:{width:0,height:4},shadowOpacity:0.10,shadowRadius:16 }, android:{ elevation:8 }, default:{} }),
};
export const priorityColors = { low:{bg:'#EFF6FF',text:'#3B82F6',dot:'#3B82F6'}, medium:{bg:'#FFFBEB',text:'#A96512',dot:'#F59E0B'}, high:{bg:'#FFF7ED',text:'#C53B45',dot:'#F97316'}, urgent:{bg:'#FEF2F2',text:'#C53B45',dot:'#EF4444'} };
export const eventColors = { violet:'#1A5A7F',blue:'#38BDF8',green:'#10B981',yellow:'#F59E0B',red:'#EF4444',pink:'#EC4899',orange:'#F97316' };
export const touchTarget = { min:44, comfortable:48, large:56 };
export const iconSize    = { xs:14,sm:18,md:22,lg:26,xl:32,'2xl':40 };
export const animation   = { duration:{ instant:0,fast:150,normal:250,slow:400 } };
