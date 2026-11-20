import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, fontWeight, radius, shadows } from '../../src/theme/tokens';
import { fetchGoals } from '../../src/features/goals/api';
import { useAuthStore } from '../../src/stores/authStore';
import { SkeletonCard, EmptyState } from '../../src/components/feedback';
import { TouchableCard } from '../../src/components/ui/Card';
import type { Goal, GoalCategory } from '../../src/types';
const CM: Record<GoalCategory,{ icon: keyof typeof Ionicons.glyphMap; color:string; bg:string }> = {
  health:{icon:'fitness-outline',color:'#23865A',bg:'#ECFDF5'}, career:{icon:'briefcase-outline',color:'#6957E8',bg:'#F0EEFF'},
  finance:{icon:'wallet-outline',color:'#3B82F6',bg:'#EFF6FF'}, learning:{icon:'book-outline',color:'#8B5CF6',bg:'#F5F3FF'},
  personal:{icon:'person-outline',color:'#F59E0B',bg:'#FFFBEB'}, relationships:{icon:'people-outline',color:'#EC4899',bg:'#FDF2F8'}, other:{icon:'flag-outline',color:'#6B7280',bg:'#F3F4F6'}
};
export default function GoalsScreen() {
  const { theme }=useTheme(); const router=useRouter();
  const uid=useAuthStore(s=>s.user?.id);
  const [filter,setFilter]=useState<'active'|'completed'|'all'>('active');
  const { data:goals, isLoading } = useQuery({ queryKey:['goals',uid], queryFn:()=>fetchGoals(uid!), enabled:Boolean(uid), staleTime:30_000 });
  const filtered=(goals??[]).filter(g=>filter==='all'?true:g.status===filter);
  const avg=goals?.length?Math.round(goals.reduce((s,g)=>s+g.progress,0)/goals.length):0;
  return (
    <SafeAreaView style={[s.safe,{backgroundColor:theme.bg.primary}]} edges={['top','left','right']}>
      <View style={[s.header,{borderBottomColor:theme.border.subtle}]}>
        <Text style={[s.title,{color:theme.text.primary}]}>Goals</Text>
        <TouchableOpacity onPress={()=>router.push('/goals/new')} style={[s.addBtn,{backgroundColor:theme.brand.primaryBg}]} accessibilityLabel="Add goal"><Ionicons name="add" size={22} color={theme.brand.primary}/></TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.stats}>
          {[
            {l:'Active',v:(goals??[]).filter(g=>g.status==='active').length,icon:'flag-outline' as const},
            {l:'Completed',v:(goals??[]).filter(g=>g.status==='completed').length,icon:'checkmark-circle-outline' as const},
            {l:'Avg progress',v:`${avg}%`,icon:'trending-up-outline' as const}
          ].map(c=>(
            <View key={c.l} style={[s.statCard,{backgroundColor:theme.surface.default,...shadows.sm}]}>
              <Ionicons name={c.icon} size={22} color={theme.brand.primary} />
              <Text style={[s.statVal,{color:theme.text.primary}]}>{c.v}</Text>
              <Text style={[s.statLbl,{color:theme.text.tertiary}]}>{c.l}</Text>
            </View>
          ))}
        </View>
        <View style={s.filters}>
          {(['active','completed','all'] as const).map(f=>(
            <TouchableOpacity key={f} onPress={()=>setFilter(f)} style={[s.chip,{backgroundColor:filter===f?theme.brand.primary:theme.surface.inset}]}><Text style={{color:filter===f?'#fff':theme.text.secondary,fontSize:fontSize.sm,fontWeight:fontWeight.medium}}>{f[0].toUpperCase()+f.slice(1)}</Text></TouchableOpacity>
          ))}
        </View>
        <View style={s.list}>
          {isLoading?[1,2,3].map(i=><SkeletonCard key={i}/>):!filtered.length?<EmptyState icon="flag-outline" title="No goals here" description="Set a goal to start tracking." actionLabel="Add goal" onAction={()=>router.push('/goals/new')}/>:
            filtered.map(g=>(<GoalCard key={g.id} goal={g} onPress={()=>router.push(`/goals/${g.id}` as never)}/>))
          }
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
function GoalCard({ goal, onPress }: { goal:Goal; onPress:()=>void }) {
  const { theme }=useTheme(); const m=CM[goal.category]; const done=(goal.milestones??[]).filter(m=>m.completed).length;
  return (
    <TouchableCard onPress={onPress} style={g.card}>
      <View style={g.head}>
        <View style={[g.icon,{backgroundColor:m.bg}]}>
          <Ionicons name={m.icon} size={20} color={m.color} />
        </View>
        <View style={{flex:1}}><Text style={[g.title,{color:theme.text.primary}]} numberOfLines={1}>{goal.title}</Text><Text style={[g.cat,{color:theme.text.tertiary}]}>{goal.category}{goal.target_date?` · ${new Date(goal.target_date).toLocaleDateString('en-US',{month:'short',year:'numeric'})}`:''}</Text></View><Text style={[g.pct,{color:m.color}]}>{goal.progress}%</Text></View>
      <View style={[g.bar,{backgroundColor:theme.surface.inset}]}><View style={[g.fill,{width:`${goal.progress}%`,backgroundColor:m.color}]}/></View>
      {(goal.milestones??[]).length>0&&<Text style={[g.ms,{color:theme.text.tertiary}]}>{done}/{(goal.milestones??[]).length} milestones complete</Text>}
    </TouchableCard>
  );
}
const g=StyleSheet.create({ card:{gap:spacing[3]}, head:{flexDirection:'row',alignItems:'center',gap:spacing[3]}, icon:{width:48,height:48,borderRadius:radius.md,alignItems:'center',justifyContent:'center'}, title:{fontSize:fontSize.base,fontWeight:fontWeight.semibold}, cat:{fontSize:fontSize.xs,marginTop:2}, pct:{fontSize:fontSize.md,fontWeight:fontWeight.bold}, bar:{height:6,borderRadius:radius.full,overflow:'hidden'}, fill:{height:'100%',borderRadius:radius.full}, ms:{fontSize:fontSize.xs} });
const s=StyleSheet.create({ safe:{flex:1}, header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:spacing[5],borderBottomWidth:StyleSheet.hairlineWidth}, title:{fontSize:fontSize['2xl'],fontWeight:fontWeight.bold}, addBtn:{width:40,height:40,borderRadius:radius.full,alignItems:'center',justifyContent:'center'}, stats:{flexDirection:'row',gap:spacing[3],padding:spacing[5],paddingBottom:0}, statCard:{flex:1,alignItems:'center',padding:spacing[3],borderRadius:radius.lg,gap:spacing[1]}, statVal:{fontSize:fontSize.lg,fontWeight:fontWeight.bold}, statLbl:{fontSize:fontSize.xs,textAlign:'center'}, filters:{flexDirection:'row',gap:spacing[2],paddingHorizontal:spacing[5],paddingTop:spacing[4]}, chip:{paddingHorizontal:spacing[4],paddingVertical:spacing[2],borderRadius:radius.full}, list:{padding:spacing[5],gap:spacing[3]} });
