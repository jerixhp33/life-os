import { Platform } from 'react-native';
export const palette = {
  violet: { 50:'#F0EEFF',100:'#E3DEFF',200:'#C9BEFF',300:'#B8A8FF',400:'#9E8DFF',500:'#6957E8',600:'#5243C4',700:'#3D30A0' },
  slate:  { 50:'#F8F7FE',100:'#F0EFF9',200:'#E2E0F4',300:'#C8C5E8',400:'#9D98C9',500:'#726D9E',600:'#4E4A72',700:'#3A3760',800:'#28243A',900:'#15151D' },
};
export const lightTheme = {
  bg:      { primary:'#F6F5FC', secondary:'#FFFFFF', tertiary:'#F0EFF9', elevated:'#FFFFFF', overlay:'rgba(21,21,29,0.5)' },
  surface: { default:'#FFFFFF', raised:'#FFFFFF', inset:'#F0EFF9', overlay:'rgba(255,255,255,0.95)' },
  text:    { primary:'#28243A', secondary:'#4E4A72', tertiary:'#726D9E', disabled:'#9D98C9', inverse:'#FFFFFF', placeholder:'#9D98C9', link:'#6957E8' },
  brand:   { primary:'#6957E8', primaryDim:'#B8A8FF', primaryBg:'#F0EEFF' },
  border:  { subtle:'#E2E0F4', default:'#C8C5E8', strong:'#9D98C9', focus:'#6957E8' },
  success:'#23865A', successBg:'#ECFDF5', warning:'#A96512', warningBg:'#FFFBEB',
  error:'#C53B45', errorBg:'#FEF2F2', info:'#3B82F6', infoBg:'#EFF6FF',
};
export const darkTheme = {
  bg:      { primary:'#15151D', secondary:'#1C1C26', tertiary:'#22222D', elevated:'#22222D', overlay:'rgba(0,0,0,0.6)' },
  surface: { default:'#22222D', raised:'#2A2A38', inset:'#1A1A24', overlay:'rgba(34,34,45,0.97)' },
  text:    { primary:'#EAE8F8', secondary:'#B8B4D8', tertiary:'#7E7A9C', disabled:'#4E4A72', inverse:'#28243A', placeholder:'#4E4A72', link:'#B8A8FF' },
  brand:   { primary:'#8B7BFF', primaryDim:'#4D3FAA', primaryBg:'#1E1A3A' },
  border:  { subtle:'#2A2A38', default:'#3A3750', strong:'#4E4A72', focus:'#8B7BFF' },
  success:'#34D399', successBg:'#022C22', warning:'#FBBF24', warningBg:'#1C1202',
  error:'#F87171', errorBg:'#2A0A0C', info:'#60A5FA', infoBg:'#0C1A2E',
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
export const eventColors = { violet:'#6957E8',blue:'#3B82F6',green:'#23865A',yellow:'#F59E0B',red:'#C53B45',pink:'#EC4899',orange:'#F97316' };
export const touchTarget = { min:44, comfortable:48, large:56 };
export const iconSize    = { xs:14,sm:18,md:22,lg:26,xl:32,'2xl':40 };
export const animation   = { duration:{ instant:0,fast:150,normal:250,slow:400 } };
