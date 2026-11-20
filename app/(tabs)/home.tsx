import React, { useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius, shadows } from '../../src/theme/tokens';
import { useTodayTasks, useCompleteTask } from '../../src/features/tasks/hooks';
import { useUpcomingEvents } from '../../src/features/calendar/hooks';
import { useAuthStore } from '../../src/stores/authStore';
import { TouchableCard } from '../../src/components/ui/Card';
import { SkeletonCard, EmptyState } from '../../src/components/feedback';
const PC: Record<string,string> = { urgent:'#EF4444', high:'#F97316', medium:'#F59E0B', low:'#3B82F6' };
const EC: Record<string,string> = { violet:'#6957E8', blue:'#3B82F6', green:'#23865A', yellow:'#F59E0B', red:'#C53B45', pink:'#EC4899', orange:'#F97316' };
const QA = [
  { icon: 'checkbox-outline' as const, label: 'Tasks', bg: '#F0EEFF', route: '/tasks' },
  { icon: 'document-text-outline' as const, label: 'Notes', bg: '#ECFDF5', route: '/notes' },
  { icon: 'wallet-outline' as const, label: 'Finance', bg: '#EFF6FF', route: '/finance' },
  { icon: 'sparkles-outline' as const, label: 'AI', bg: '#F5F3FF', route: '/ai/chat' }
];
export default function HomeScreen() {
  const { theme } = useTheme(); const router = useRouter(); const qc = useQueryClient();
  const profile = useAuthStore(s=>s.profile);
  const { data:tasks, isLoading:tl } = useTodayTasks();
  const { data:events, isLoading:el } = useUpcomingEvents(3);
  const complete = useCompleteTask();
  const hour = new Date().getHours();
  const greeting = hour<12?'Good morning':hour<17?'Good afternoon':'Good evening';
  const onRefresh = useCallback(async()=>{ await qc.invalidateQueries(); },[qc]);
  return (
    <SafeAreaView style={[s.safe,{backgroundColor:theme.bg.primary}]} edges={['top','left','right']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={theme.brand.primary}/>}>
        <View style={s.header}>
          <View>
            <Text style={[s.greeting,{color:theme.text.secondary}]}>{greeting},</Text>
            <Text style={[s.name,{color:theme.text.primary}]}>{profile?.full_name?.split(' ')[0]??'there'}</Text>
            <Text style={[s.date,{color:theme.text.tertiary}]}>{format(new Date(),'EEEE, MMMM d')}</Text>
          </View>
          <TouchableOpacity onPress={()=>router.push('/settings/profile')} style={[s.avatar,{backgroundColor:theme.brand.primaryBg}]} accessibilityLabel="Open settings">
            <Text style={[s.avatarText,{color:theme.brand.primary}]}>{profile?.full_name?.[0]?.toUpperCase()??'?'}</Text>
          </TouchableOpacity>
        </View>
        <View style={s.qa}>
          {QA.map(a=>(
            <TouchableOpacity key={a.label} onPress={()=>router.push(a.route as never)} style={[s.qaItem,{backgroundColor:theme.surface.default,...shadows.sm}]} accessibilityRole="button">
              <View style={[s.qaIcon,{backgroundColor:a.bg}]}>
                <Ionicons name={a.icon} size={20} color={theme.brand.primary} />
              </View>
              <Text style={[s.qaLabel,{color:theme.text.secondary}]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <SH title="Today's tasks" count={tasks?.length} onMore={()=>router.push('/tasks')}/>
        {tl ? [1,2].map(i=><SkeletonCard key={i}/>) : !tasks?.length ? <EmptyState icon="checkbox-outline" title="Nothing due today" description="All clear! Add a task to get started." actionLabel="Add task" onAction={()=>router.push('/(tabs)/create')}/> :
          tasks.map(t=>(
            <TouchableCard key={t.id} onPress={()=>router.push(`/tasks/${t.id}` as never)} style={s.taskCard}>
              <View style={s.taskRow}>
                <TouchableOpacity onPress={()=>complete.mutate(t.id)} style={[s.check,{borderColor:PC[t.priority]}]} accessibilityRole="checkbox" accessibilityState={{checked:t.status==='completed'}} hitSlop={{top:10,bottom:10,left:10,right:10}}>
                  {t.status==='completed'&&<Ionicons name="checkmark" size={13} color={PC[t.priority]}/>}
                </TouchableOpacity>
                <View style={s.taskBody}>
                  <Text style={[s.taskTitle,{color:theme.text.primary},t.status==='completed'&&s.strike]} numberOfLines={1}>{t.title}</Text>
                  {t.due_date&&<Text style={[s.taskMeta,{color:theme.text.tertiary}]}>{format(new Date(t.due_date),'MMM d')}{t.due_time&&` · ${t.due_time}`}</Text>}
                </View>
                <View style={[s.dot,{backgroundColor:PC[t.priority]}]}/>
              </View>
            </TouchableCard>
          ))
        }
        <SH title="Coming up" count={events?.length} onMore={()=>router.push('/(tabs)/calendar')}/>
        {el ? <SkeletonCard/> : !events?.length ? <EmptyState icon="calendar-outline" title="No upcoming events" description="Schedule something on the calendar." actionLabel="Add event" onAction={()=>router.push('/(tabs)/create')}/> :
          events.map(e=>(
            <TouchableCard key={e.id} onPress={()=>router.push(`/calendar/${e.id}` as never)} style={s.evCard}>
              <View style={[s.evAccent,{backgroundColor:EC[e.color]??'#6957E8'}]}/>
              <View style={{flex:1}}>
                <Text style={[s.evTitle,{color:theme.text.primary}]} numberOfLines={1}>{e.title}</Text>
                <Text style={[s.evTime,{color:theme.text.tertiary}]}>{e.all_day?format(new Date(e.start_at),'MMM d'):`${format(new Date(e.start_at),'MMM d · h:mm a')}`}</Text>
              </View>
            </TouchableCard>
          ))
        }
        <View style={{height:spacing[20]}}/>
      </ScrollView>
    </SafeAreaView>
  );
}
function SH({ title, count, onMore }: { title:string; count?:number; onMore:()=>void }) {
  const { theme }=useTheme();
  return <View style={sh.row}><Text style={[sh.title,{color:theme.text.primary}]}>{title}{count!=null&&count>0&&<Text style={{color:theme.text.tertiary}}> ({count})</Text>}</Text><TouchableOpacity onPress={onMore}><Text style={{color:theme.brand.primary,fontSize:fontSize.sm}}>See all</Text></TouchableOpacity></View>;
}
const sh=StyleSheet.create({ row:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:spacing[6],marginBottom:spacing[3],paddingHorizontal:spacing[1]}, title:{fontSize:fontSize.md,fontWeight:fontWeight.semibold} });
const s=StyleSheet.create({ safe:{flex:1}, scroll:{padding:spacing[5],paddingBottom:0}, header:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:spacing[5]}, greeting:{fontSize:fontSize.base}, name:{fontSize:fontSize['3xl'],fontWeight:fontWeight.bold,lineHeight:38}, date:{fontSize:fontSize.sm,marginTop:spacing[1]}, avatar:{width:44,height:44,borderRadius:radius.full,alignItems:'center',justifyContent:'center'}, avatarText:{fontSize:fontSize.lg,fontWeight:fontWeight.bold}, qa:{flexDirection:'row',gap:spacing[3]}, qaItem:{flex:1,alignItems:'center',paddingVertical:spacing[4],borderRadius:radius.lg,gap:spacing[2],borderWidth:1,borderColor:'transparent'}, qaIcon:{width:44,height:44,borderRadius:radius.md,alignItems:'center',justifyContent:'center'}, qaLabel:{fontSize:fontSize.xs,fontWeight:fontWeight.medium}, taskCard:{marginBottom:spacing[2]}, taskRow:{flexDirection:'row',alignItems:'center',gap:spacing[3]}, check:{width:22,height:22,borderRadius:radius.full,borderWidth:2,alignItems:'center',justifyContent:'center'}, taskBody:{flex:1}, taskTitle:{fontSize:fontSize.base,fontWeight:fontWeight.medium}, strike:{textDecorationLine:'line-through',opacity:0.45}, taskMeta:{fontSize:fontSize.xs,marginTop:2}, dot:{width:8,height:8,borderRadius:radius.full}, evCard:{marginBottom:spacing[2],flexDirection:'row',alignItems:'center'}, evAccent:{width:4,height:'100%',borderRadius:radius.full,marginRight:spacing[3]}, evTitle:{fontSize:fontSize.base,fontWeight:fontWeight.medium}, evTime:{fontSize:fontSize.xs,marginTop:2} });
