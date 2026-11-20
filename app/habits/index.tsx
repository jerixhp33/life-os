import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { ScreenLayout } from '../../src/components/layout/ScreenLayout';
import { spacing, fontSize, fontWeight, radius, shadows } from '../../src/theme/tokens';
import { fetchHabits, fetchTodayHabitLogs, logHabit, unlogHabit, archiveHabit } from '../../src/features/habits/api';
import { useAuthStore } from '../../src/stores/authStore';
import { EmptyState, SkeletonCard } from '../../src/components/feedback';
import type { Habit } from '../../src/types';
const DS=['S','M','T','W','T','F','S'];
export default function HabitsScreen() {
  const { theme }=useTheme(); const router=useRouter(); const qc=useQueryClient();
  const uid=useAuthStore(s=>s.user?.id);
  const { data:habits, isLoading } = useQuery({ queryKey:['habits',uid], queryFn:()=>fetchHabits(uid!), enabled:Boolean(uid) });
  const { data:logs } = useQuery({ queryKey:['habit_logs','today',uid], queryFn:()=>fetchTodayHabitLogs(uid!), enabled:Boolean(uid), refetchInterval:60_000 });
  const log=useMutation({ mutationFn:({hid}:{hid:string})=>logHabit(uid!,hid), onSuccess:()=>{ qc.invalidateQueries({queryKey:['habit_logs']}); } });
  const unlog=useMutation({ mutationFn:(hid:string)=>unlogHabit(uid!,hid), onSuccess:()=>qc.invalidateQueries({queryKey:['habit_logs']}) });
  const archive=useMutation({ mutationFn:archiveHabit, onSuccess:()=>qc.invalidateQueries({queryKey:['habits']}) });
  const tod=new Date().getDay();
  const todHabits=useMemo(()=>(habits??[]).filter(h=>h.frequency==='daily'||h.days_of_week.includes(tod)),[habits,tod]);
  const done=todHabits.filter(h=>(logs??[]).some(l=>l.habit_id===h.id&&l.count>=h.target_count)).length;
  const handleArchive=(h:Habit)=>Alert.alert('Archive habit',`Archive "${h.title}"?`,[{text:'Cancel',style:'cancel'},{text:'Archive',onPress:()=>archive.mutate(h.id)}]);
  return (
    <ScreenLayout title="Habits" showBack rightAction={<TouchableOpacity onPress={()=>router.push('/habits/new')} accessibilityLabel="New habit"><Ionicons name="add" size={26} color={theme.brand.primary}/></TouchableOpacity>}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {todHabits.length>0&&(
          <View style={[s.sum,{backgroundColor:theme.brand.primary}]}>
            <View><Text style={s.sumT}>Today's Progress</Text><Text style={s.sumD}>{format(new Date(),'EEEE, MMMM d')}</Text></View>
            <View style={s.sumC}><Text style={s.sumF}>{done}<Text style={s.sumTo}>/{todHabits.length}</Text></Text><Text style={s.sumL}>done</Text></View>
          </View>
        )}
        <Text style={[s.secTitle,{color:theme.text.secondary}]}>Today</Text>
        {isLoading?[1,2,3].map(i=><SkeletonCard key={i}/>):todHabits.length===0?<EmptyState icon="repeat-outline" title="No habits today" description="Build a new routine to get started." actionLabel="New habit" onAction={()=>router.push('/habits/new')}/>:
          todHabits.map(h=>{
            const isComplete=(logs??[]).some(l=>l.habit_id===h.id&&l.count>=h.target_count);
            return <HabitCard key={h.id} habit={h} isComplete={isComplete} onToggle={()=>isComplete?unlog.mutate(h.id):log.mutate({hid:h.id})} onPress={()=>router.push(`/habits/${h.id}` as never)} onArchive={()=>handleArchive(h)}/>;
          })
        }
        <View style={{height:spacing[20]}}/>
      </ScrollView>
    </ScreenLayout>
  );
}
function HabitCard({ habit,isComplete,onToggle,onPress,onArchive }: { habit:Habit;isComplete:boolean;onToggle:()=>void;onPress:()=>void;onArchive:()=>void }) {
  const { theme }=useTheme(); const tod=new Date().getDay();
  return (
    <TouchableOpacity onPress={onPress} onLongPress={onArchive} style={[hS.card,{backgroundColor:isComplete?habit.color+'15':theme.surface.default,borderColor:isComplete?habit.color:theme.border.subtle,...shadows.sm}]}>
      <TouchableOpacity onPress={onToggle} style={[hS.ring,{borderColor:isComplete?habit.color:theme.border.default,backgroundColor:isComplete?habit.color:'transparent'}]} accessibilityRole="checkbox" accessibilityState={{checked:isComplete}} hitSlop={{top:8,bottom:8,left:8,right:8}}>
        {isComplete?<Ionicons name="checkmark" size={18} color="#fff"/>:<Ionicons name="repeat-outline" size={18} color={habit.color}/>}
      </TouchableOpacity>
      <View style={{flex:1}}>
        <Text style={[hS.name,{color:isComplete?theme.text.tertiary:theme.text.primary,textDecorationLine:isComplete?'line-through':'none'}]} numberOfLines={1}>{habit.title}</Text>
        <View style={hS.meta}><View style={hS.dots}>{DS.map((d,i)=><View key={i} style={[hS.dot,{backgroundColor:habit.days_of_week.includes(i)?habit.color:theme.border.subtle,opacity:i===tod?1:0.5}]}/>)}</View><Text style={[hS.tod,{color:theme.text.tertiary}]}>{habit.time_of_day}</Text></View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.text.tertiary}/>
    </TouchableOpacity>
  );
}
const hS=StyleSheet.create({ card:{flexDirection:'row',alignItems:'center',gap:spacing[3],padding:spacing[4],borderRadius:radius.lg,borderWidth:1.5,marginBottom:spacing[2]}, ring:{width:44,height:44,borderRadius:radius.full,borderWidth:2.5,alignItems:'center',justifyContent:'center'}, name:{fontSize:fontSize.base,fontWeight:fontWeight.medium}, meta:{flexDirection:'row',alignItems:'center',gap:spacing[3],marginTop:4}, dots:{flexDirection:'row',gap:3}, dot:{width:8,height:8,borderRadius:radius.full}, tod:{fontSize:fontSize.xs} });
const s=StyleSheet.create({ scroll:{padding:spacing[4],gap:spacing[3]}, sum:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:spacing[5],borderRadius:radius.xl,marginBottom:spacing[1]}, sumT:{fontSize:fontSize.md,fontWeight:fontWeight.bold,color:'#fff'}, sumD:{fontSize:fontSize.sm,color:'rgba(255,255,255,0.75)',marginTop:2}, sumC:{alignItems:'center'}, sumF:{fontSize:36,fontWeight:fontWeight.bold,color:'#fff'}, sumTo:{fontSize:fontSize.xl}, sumL:{fontSize:fontSize.sm,color:'rgba(255,255,255,0.75)'}, secTitle:{fontSize:fontSize.sm,fontWeight:fontWeight.semibold,textTransform:'uppercase',letterSpacing:0.5,marginLeft:spacing[1]} });
