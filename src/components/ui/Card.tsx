import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { radius, shadows } from '../../theme/tokens';
export function Card({ children, style, elevation='raised' }: { children:React.ReactNode; style?:object; elevation?:'flat'|'raised'|'floating' }) {
  const { theme }=useTheme();
  return <View style={[styles.card,{backgroundColor:theme.surface.default,borderColor:theme.border.subtle},elevation!=='flat'&&(elevation==='floating'?shadows.md:shadows.sm),style]}>{children}</View>;
}
export function TouchableCard({ children, style, onPress, elevation='raised' }: { children:React.ReactNode; style?:object; onPress:()=>void; elevation?:'flat'|'raised'|'floating' }) {
  const { theme }=useTheme();
  return <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={[styles.card,{backgroundColor:theme.surface.default,borderColor:theme.border.subtle},elevation!=='flat'&&shadows.sm,style]} accessibilityRole="button">{children}</TouchableOpacity>;
}
const styles=StyleSheet.create({ card:{ borderRadius:radius.xl, borderWidth:1.5, padding:18, overflow:'hidden' } });
