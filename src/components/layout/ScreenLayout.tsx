import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, fontSize, fontWeight, touchTarget } from '../../theme/tokens';
interface Props { children:React.ReactNode; title?:string; showBack?:boolean; rightAction?:React.ReactNode; scrollable?:boolean; keyboardAvoid?:boolean; style?:object; contentStyle?:object; edges?:Array<'top'|'bottom'|'left'|'right'>; }
export function ScreenLayout({ children, title, showBack=false, rightAction, scrollable=false, keyboardAvoid=false, style, contentStyle, edges=['top','bottom','left','right'] }: Props) {
  const { theme }=useTheme(); const router=useRouter();
  const inner = scrollable
    ? <ScrollView contentContainerStyle={[styles.scrollContent,contentStyle]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</ScrollView>
    : <View style={[styles.content,contentStyle]}>{children}</View>;
  const body = keyboardAvoid
    ? <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS==='ios'?'padding':'height'} keyboardVerticalOffset={Platform.OS==='ios'?0:20}>{inner}</KeyboardAvoidingView>
    : inner;
  return (
    <SafeAreaView style={[styles.safe,{backgroundColor:theme.bg.primary},style]} edges={edges}>
      {(title||showBack||rightAction) && (
        <View style={[styles.header,{borderBottomColor:theme.border.subtle}]}>
          {showBack ? <TouchableOpacity onPress={()=>router.back()} activeOpacity={0.7} style={styles.backBtn} accessibilityLabel="Go back" accessibilityRole="button" hitSlop={{top:12,bottom:12,left:12,right:12}}><Ionicons name="chevron-back" size={24} color={theme.text.primary}/></TouchableOpacity> : <View style={styles.placeholder}/>}
          {title && <Text style={[styles.title,{color:theme.text.primary}]} numberOfLines={1} accessibilityRole="header">{title}</Text>}
          <View style={styles.rightAction}>{rightAction??<View style={styles.placeholder}/>}</View>
        </View>
      )}
      {body}
    </SafeAreaView>
  );
}
const styles=StyleSheet.create({ safe:{flex:1}, flex:{flex:1}, header:{flexDirection:'row',alignItems:'center',height:56,paddingHorizontal:spacing[4],borderBottomWidth:StyleSheet.hairlineWidth}, backBtn:{width:touchTarget.min,height:touchTarget.min,alignItems:'flex-start',justifyContent:'center'}, placeholder:{width:touchTarget.min}, title:{flex:1,fontSize:fontSize.md,fontWeight:fontWeight.semibold,textAlign:'center'}, rightAction:{width:touchTarget.min,alignItems:'flex-end',justifyContent:'center'}, content:{flex:1}, scrollContent:{flexGrow:1} });
