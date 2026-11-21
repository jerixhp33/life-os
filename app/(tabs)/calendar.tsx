import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, addDays, isSameDay, isSameMonth, isToday, parseISO } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius, shadows } from '../../src/theme/tokens';
import { useEvents } from '../../src/features/calendar/hooks';
import { SkeletonCard, EmptyState } from '../../src/components/feedback';
import type { CalendarEvent } from '../../src/types';
const EC: Record<string,string> = { violet:'#1A5A7F',blue:'#38BDF8',green:'#10B981',yellow:'#F59E0B',red:'#EF4444',pink:'#EC4899',orange:'#F97316' };
export default function CalendarScreen() {
  const { theme }=useTheme(); const router=useRouter();
  const [month,setMonth]=useState(new Date()); const [sel,setSel]=useState(new Date());
  const calStart=startOfWeek(startOfMonth(month),{weekStartsOn:0}), calEnd=endOfWeek(endOfMonth(month),{weekStartsOn:0});
  const { data:events, isLoading } = useEvents(calStart.toISOString(), calEnd.toISOString());
  const days=useMemo(()=>{ const r:Date[]=[]; let d=calStart; while(d<=calEnd){ r.push(d); d=addDays(d,1); } return r; },[month]);
  const eventsByDate=useMemo(()=>{ const m=new Map<string,CalendarEvent[]>(); (events??[]).forEach(e=>{ const k=format(parseISO(e.start_at),'yyyy-MM-dd'); m.set(k,[...(m.get(k)??[]),e]); }); return m; },[events]);
  const selEvents=useMemo(()=>(events??[]).filter(e=>isSameDay(parseISO(e.start_at),sel)),[events,sel]);
  return (
    <SafeAreaView style={[s.safe,{backgroundColor:theme.bg.primary}]} edges={['top','left','right']}>
      <View style={[s.mHead,{borderBottomColor:theme.border.subtle}]}>
        <TouchableOpacity onPress={()=>setMonth(m=>subMonths(m,1))} hitSlop={{top:8,bottom:8,left:8,right:8}} accessibilityLabel="Previous month"><Ionicons name="chevron-back" size={24} color={theme.text.primary}/></TouchableOpacity>
        <Text style={[s.mTitle,{color:theme.text.primary}]}>{format(month,'MMMM yyyy')}</Text>
        <TouchableOpacity onPress={()=>setMonth(m=>addMonths(m,1))} hitSlop={{top:8,bottom:8,left:8,right:8}} accessibilityLabel="Next month"><Ionicons name="chevron-forward" size={24} color={theme.text.primary}/></TouchableOpacity>
      </View>
      <View style={s.dayLabels}>
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><Text key={d} style={[s.dayLabel,{color:theme.text.tertiary}]}>{d}</Text>)}
      </View>
      <View style={s.grid}>
        {days.map(day=>{
          const k=format(day,'yyyy-MM-dd'); const de=eventsByDate.get(k)??[];
          const selected=isSameDay(day,sel), today=isToday(day), inMonth=isSameMonth(day,month);
          return (
            <TouchableOpacity key={k} onPress={()=>setSel(day)} style={s.dayCell} accessibilityLabel={format(day,'EEEE, MMMM d')}>
              <View style={[s.dayNum, selected&&{backgroundColor:theme.brand.primary}, today&&!selected&&{borderWidth:1.5,borderColor:theme.brand.primary}]}>
                <Text style={[s.dayTxt,{color:!inMonth?theme.text.disabled:selected?'#fff':today?theme.brand.primary:theme.text.primary}]}>{format(day,'d')}</Text>
              </View>
              <View style={s.evDots}>{de.slice(0,3).map((e,i)=><View key={i} style={[s.evDot,{backgroundColor:EC[e.color]??'#6957E8'}]}/>)}</View>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={[s.detail,{backgroundColor:theme.bg.secondary,borderTopColor:theme.border.subtle}]}>
        <View style={s.detHead}>
          <Text style={[s.detTitle,{color:theme.text.primary}]}>{isToday(sel)?'Today':format(sel,'EEEE, MMMM d')}</Text>
          <TouchableOpacity onPress={()=>router.push('/calendar/new')} style={[s.addBtn,{backgroundColor:theme.brand.primaryBg}]} accessibilityLabel="Add event"><Ionicons name="add" size={20} color={theme.brand.primary}/></TouchableOpacity>
        </View>
        {isLoading?<SkeletonCard/>:selEvents.length===0?<EmptyState icon="calendar-outline" title="Nothing scheduled" description="Tap + to add an event." style={{paddingVertical:spacing[6]}}/>:
          <FlatList data={selEvents} keyExtractor={e=>e.id} showsVerticalScrollIndicator={false} contentContainerStyle={{gap:spacing[2],padding:spacing[4],paddingTop:0}}
            renderItem={({item})=>(
              <TouchableOpacity onPress={()=>router.push(`/calendar/${item.id}` as never)} style={[s.evRow,{backgroundColor:theme.surface.default,borderLeftColor:EC[item.color]??'#1A5A7F',borderColor:theme.border.subtle,borderWidth:1,...shadows.sm}]}>
                <Text style={[s.evTitle,{color:theme.text.primary}]} numberOfLines={1}>{item.title}</Text>
                <Text style={[s.evTime,{color:theme.text.tertiary}]}>{item.all_day?'All day':`${format(parseISO(item.start_at),'h:mm a')} – ${format(parseISO(item.end_at),'h:mm a')}`}</Text>
              </TouchableOpacity>
            )}
          />
        }
      </View>
    </SafeAreaView>
  );
}
const s=StyleSheet.create({ safe:{flex:1}, mHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:spacing[5],paddingVertical:spacing[3],borderBottomWidth:StyleSheet.hairlineWidth}, mTitle:{fontSize:fontSize.lg,fontWeight:fontWeight.semibold}, dayLabels:{flexDirection:'row',paddingHorizontal:spacing[3],paddingVertical:spacing[2]}, dayLabel:{flex:1,textAlign:'center',fontSize:fontSize.xs,fontWeight:fontWeight.medium}, grid:{flexDirection:'row',flexWrap:'wrap',paddingHorizontal:spacing[3]}, dayCell:{width:`${100/7}%`,alignItems:'center',paddingVertical:spacing[1]}, dayNum:{width:34,height:34,borderRadius:radius.full,alignItems:'center',justifyContent:'center'}, dayTxt:{fontSize:fontSize.sm,fontWeight:fontWeight.medium}, evDots:{flexDirection:'row',gap:2,marginTop:2,height:6,alignItems:'center'}, evDot:{width:5,height:5,borderRadius:radius.full}, detail:{flex:1,borderTopWidth:1,marginTop:spacing[2]}, detHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:spacing[4]}, detTitle:{fontSize:fontSize.md,fontWeight:fontWeight.semibold}, addBtn:{width:36,height:36,borderRadius:radius.full,alignItems:'center',justifyContent:'center'}, evRow:{padding:spacing[3],borderRadius:radius.xl,borderLeftWidth:4}, evTitle:{fontSize:fontSize.base,fontWeight:fontWeight.medium}, evTime:{fontSize:fontSize.xs,marginTop:2} });
