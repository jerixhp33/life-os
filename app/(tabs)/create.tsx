import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius, shadows } from '../../src/theme/tokens';
const OPTIONS = [
  { icon: 'checkbox-outline' as const, label: 'Task',        desc: 'Add a to-do with priority & due date',       route: '/tasks/new' },
  { icon: 'document-text-outline' as const, label: 'Note',   desc: 'Capture an idea, thought, or checklist',      route: '/notes/new' },
  { icon: 'calendar-outline' as const, label: 'Event',       desc: 'Schedule something on your calendar',         route: '/calendar/new' },
  { icon: 'repeat-outline' as const, label: 'Habit',         desc: 'Build a new daily or weekly routine',         route: '/habits/new' },
  { icon: 'flag-outline' as const, label: 'Goal',            desc: 'Set a goal with milestones to track',         route: '/goals/new' },
  { icon: 'wallet-outline' as const, label: 'Transaction',   desc: 'Log an income or expense entry',              route: '/finance/new' },
];
export default function CreateScreen() {
  const { theme } = useTheme(); const router = useRouter();
  return (
    <SafeAreaView style={[s.safe,{backgroundColor:theme.bg.primary}]} edges={['top','left','right']}>
      <View style={[s.header,{borderBottomColor:theme.border.subtle}]}>
        <Text style={[s.title,{color:theme.text.primary}]}>Create</Text>
        <Text style={[s.sub,{color:theme.text.tertiary}]}>What would you like to add?</Text>
      </View>
      <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
        {OPTIONS.map(o=>(
          <TouchableOpacity key={o.label} onPress={()=>router.push(o.route as never)} style={[s.opt,{backgroundColor:theme.surface.default,borderColor:theme.border.subtle,...shadows.sm}]} accessibilityRole="button" accessibilityLabel={`Create ${o.label}`}>
            <View style={[s.icon,{backgroundColor:theme.brand.primaryBg}]}>
              <Ionicons name={o.icon} size={26} color={theme.brand.primary} />
            </View>
            <View style={s.body}><Text style={[s.label,{color:theme.text.primary}]}>{o.label}</Text><Text style={[s.desc,{color:theme.text.tertiary}]} numberOfLines={1}>{o.desc}</Text></View>
            <Ionicons name="chevron-forward" size={18} color={theme.text.tertiary}/>
          </TouchableOpacity>
        ))}
        <View style={{height:spacing[20]}}/>
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({ safe:{flex:1}, header:{paddingHorizontal:spacing[6],paddingTop:spacing[5],paddingBottom:spacing[4],borderBottomWidth:StyleSheet.hairlineWidth}, title:{fontSize:fontSize['3xl'],fontWeight:fontWeight.bold}, sub:{fontSize:fontSize.base,marginTop:spacing[1]}, list:{padding:spacing[5],gap:spacing[3]}, opt:{flexDirection:'row',alignItems:'center',gap:spacing[4],padding:spacing[4],borderRadius:radius.xl,borderWidth:1}, icon:{width:52,height:52,borderRadius:radius.lg,alignItems:'center',justifyContent:'center'}, body:{flex:1}, label:{fontSize:fontSize.md,fontWeight:fontWeight.semibold}, desc:{fontSize:fontSize.sm,marginTop:2} });
