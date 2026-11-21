import React, { useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Image } from 'react-native';
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

const PC: Record<string,string> = { urgent:'#EF4444', high:'#F97316', medium:'#F59E0B', low:'#38BDF8' };
const EC: Record<string,string> = { violet:'#1A5A7F', blue:'#38BDF8', green:'#10B981', yellow:'#F59E0B', red:'#EF4444', pink:'#EC4899', orange:'#F97316' };
const QA = [
  { icon: 'checkbox-outline' as const, label: 'Tasks', bg: 'rgba(26,90,127,0.18)', iconColor: '#38BDF8', route: '/tasks' },
  { icon: 'document-text-outline' as const, label: 'Notes', bg: 'rgba(168,220,244,0.16)', iconColor: '#A8DCF4', route: '/notes' },
  { icon: 'wallet-outline' as const, label: 'Finance', bg: 'rgba(56,189,248,0.16)', iconColor: '#38BDF8', route: '/finance' },
  { icon: 'sparkles-outline' as const, label: 'AI', bg: 'rgba(168,220,244,0.22)', iconColor: '#A8DCF4', route: '/ai/chat' }
];

export default function HomeScreen() {
  const { theme, isDark } = useTheme(); const router = useRouter(); const qc = useQueryClient();
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
            <View style={s.pillBadge}>
              <View style={[s.pillDot, { backgroundColor: '#38BDF8' }]} />
              <Text style={s.pillText}>Dark Ocean</Text>
            </View>
            <Text style={[s.greeting,{color:theme.text.secondary}]}>{greeting},</Text>
            <Text style={[s.name,{color:theme.text.primary}]}>{profile?.full_name?.split(' ')[0]??'Manikandan'}</Text>
            <Text style={[s.date,{color:theme.text.tertiary}]}>{format(new Date(),'EEEE, MMMM d')}</Text>
          </View>

          <TouchableOpacity onPress={()=>router.push('/settings/profile')} style={s.avatarWrap} accessibilityLabel="Open profile settings">
            <View style={[s.avatar,{backgroundColor:theme.surface.raised, borderColor: isDark ? 'rgba(168,220,244,0.35)' : 'rgba(26,90,127,0.25)'}]}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={s.avatarImg} />
              ) : (
                <Text style={[s.avatarText,{color:theme.brand.primary}]}>{profile?.full_name?.[0]?.toUpperCase()??'M'}</Text>
              )}
            </View>
            {/* Color Swatch Dots matching Dark Ocean reference */}
            <View style={s.statusPill}>
              <View style={[s.statusDot, { backgroundColor: '#0A2438' }]} />
              <View style={[s.statusDot, { backgroundColor: '#1A5A7F' }]} />
              <View style={[s.statusDot, { backgroundColor: '#6F9DB5' }]} />
              <View style={[s.statusDot, { backgroundColor: '#A8DCF4' }]} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={s.qa}>
          {QA.map(a=>(
            <TouchableOpacity
              key={a.label}
              onPress={()=>router.push(a.route as never)}
              style={[
                s.qaItem,
                {
                  backgroundColor: theme.surface.default,
                  borderColor: isDark ? 'rgba(168,220,244,0.14)' : 'rgba(26,90,127,0.1)',
                  ...shadows.sm
                }
              ]}
              accessibilityRole="button"
            >
              <View style={[s.qaIcon,{backgroundColor:a.bg}]}>
                <Ionicons name={a.icon} size={20} color={a.iconColor} />
              </View>
              <Text style={[s.qaLabel,{color:theme.text.primary}]}>{a.label}</Text>
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
              <View style={[s.evAccent,{backgroundColor:EC[e.color]??'#1A5A7F'}]}/>
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
  return <View style={sh.row}><Text style={[sh.title,{color:theme.text.primary}]}>{title}{count!=null&&count>0&&<Text style={{color:theme.text.tertiary}}> ({count})</Text>}</Text><TouchableOpacity onPress={onMore}><Text style={{color:theme.brand.primary,fontSize:fontSize.sm,fontWeight:fontWeight.semibold}}>See all</Text></TouchableOpacity></View>;
}

const sh=StyleSheet.create({ row:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:spacing[6],marginBottom:spacing[3],paddingHorizontal:spacing[1]}, title:{fontSize:fontSize.md,fontWeight:fontWeight.semibold} });
const s=StyleSheet.create({
  safe:{flex:1},
  scroll:{padding:spacing[5],paddingBottom:0},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:spacing[5]},
  pillBadge:{flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:9,paddingVertical:3,borderRadius:radius.full,backgroundColor:'rgba(56,189,248,0.12)',borderWidth:1,borderColor:'rgba(56,189,248,0.3)',alignSelf:'flex-start',marginBottom:spacing[2]},
  pillDot:{width:6,height:6,borderRadius:3},
  pillText:{fontSize:11,fontWeight:'600',color:'#38BDF8'},
  greeting:{fontSize:fontSize.base},
  name:{fontSize:fontSize['3xl'],fontWeight:fontWeight.bold,lineHeight:38},
  date:{fontSize:fontSize.sm,marginTop:spacing[1]},
  avatarWrap:{alignItems:'center',gap:4},
  avatar:{width:50,height:50,borderRadius:radius.full,alignItems:'center',justifyContent:'center',borderWidth:2,overflow:'hidden'},
  avatarImg:{width:50,height:50,borderRadius:radius.full},
  avatarText:{fontSize:fontSize.lg,fontWeight:fontWeight.bold},
  statusPill:{flexDirection:'row',gap:3,marginTop:2},
  statusDot:{width:5,height:5,borderRadius:3,borderWidth:0.5,borderColor:'rgba(255,255,255,0.3)'},
  qa:{flexDirection:'row',gap:spacing[3]},
  qaItem:{flex:1,alignItems:'center',paddingVertical:spacing[4],borderRadius:radius.xl,gap:spacing[2],borderWidth:1.5},
  qaIcon:{width:44,height:44,borderRadius:radius.lg,alignItems:'center',justifyContent:'center'},
  qaLabel:{fontSize:fontSize.xs,fontWeight:fontWeight.semibold},
  taskCard:{marginBottom:spacing[2],borderRadius:radius.xl,borderWidth:1.5},
  taskRow:{flexDirection:'row',alignItems:'center',gap:spacing[3]},
  check:{width:22,height:22,borderRadius:radius.full,borderWidth:2,alignItems:'center',justifyContent:'center'},
  taskBody:{flex:1},
  taskTitle:{fontSize:fontSize.base,fontWeight:fontWeight.medium},
  strike:{textDecorationLine:'line-through',opacity:0.45},
  taskMeta:{fontSize:fontSize.xs,marginTop:2},
  dot:{width:8,height:8,borderRadius:radius.full},
  evCard:{marginBottom:spacing[2],flexDirection:'row',alignItems:'center',borderRadius:radius.xl,borderWidth:1.5},
  evAccent:{width:4,height:'100%',borderRadius:radius.full,marginRight:spacing[3]},
  evTitle:{fontSize:fontSize.base,fontWeight:fontWeight.medium},
  evTime:{fontSize:fontSize.xs,marginTop:2}
});
