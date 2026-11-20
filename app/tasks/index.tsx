import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { ScreenLayout } from '../../src/components/layout/ScreenLayout';
import { Input } from '../../src/components/ui/Input';
import { SkeletonCard, EmptyState, ErrorState } from '../../src/components/feedback';
import { TouchableCard } from '../../src/components/ui/Card';
import { useTasks, useCompleteTask, useDeleteTask } from '../../src/features/tasks/hooks';
import { spacing, fontSize, fontWeight, radius } from '../../src/theme/tokens';
import type { Task } from '../../src/types';
const PC: Record<string,string> = { urgent:'#EF4444', high:'#F97316', medium:'#F59E0B', low:'#3B82F6' };
const FILTERS = [{k:'all',l:'All'},{k:'pending',l:'Pending'},{k:'in_progress',l:'In progress'},{k:'completed',l:'Done'}];
export default function TasksScreen() {
  const { theme }=useTheme(); const router=useRouter();
  const [search,setSearch]=useState(''); const [sf,setSf]=useState('all');
  const { data:tasks, isLoading, error, refetch } = useTasks();
  const complete=useCompleteTask(); const del=useDeleteTask();
  const filtered=useMemo(()=>(tasks??[]).filter(t=>(!search||t.title.toLowerCase().includes(search.toLowerCase()))&&(sf==='all'||t.status===sf)),[tasks,search,sf]);
  const handleDelete=(t:Task)=>Alert.alert('Delete task',`Delete "${t.title}"?`,[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:()=>del.mutate(t.id)}]);
  return (
    <ScreenLayout title="Tasks" showBack rightAction={<TouchableOpacity onPress={()=>router.push('/tasks/new')} accessibilityLabel="Add task"><Ionicons name="add" size={26} color={theme.brand.primary}/></TouchableOpacity>}>
      <View style={s.top}>
        <Input placeholder="Search tasks…" value={search} onChangeText={setSearch} showClearButton prefix={<Ionicons name="search-outline" size={18} color={theme.text.tertiary}/>} containerStyle={{marginBottom:0}}/>
        <View style={s.chips}>{FILTERS.map(f=><TouchableOpacity key={f.k} onPress={()=>setSf(f.k)} style={[s.chip,{backgroundColor:sf===f.k?theme.brand.primary:theme.surface.inset}]}><Text style={{color:sf===f.k?'#fff':theme.text.secondary,fontSize:fontSize.sm,fontWeight:fontWeight.medium}}>{f.l}</Text></TouchableOpacity>)}</View>
      </View>
      {error?<ErrorState message="Could not load tasks." onRetry={refetch}/>:isLoading?<View style={s.list}>{[1,2,3].map(i=><SkeletonCard key={i}/>)}</View>:!filtered.length?<EmptyState icon="checkbox-outline" title={search?'No matches':'No tasks yet'} description={search?'Try a different search.':'Tap + to create your first task.'} actionLabel={search?undefined:'Add task'} onAction={search?undefined:()=>router.push('/tasks/new')}/>:
        <FlatList data={filtered} keyExtractor={t=>t.id} contentContainerStyle={s.list} showsVerticalScrollIndicator={false}
          renderItem={({item:t})=>(
            <TouchableCard onPress={()=>router.push(`/tasks/${t.id}` as never)} style={s.card}>
              <View style={s.row}>
                <TouchableOpacity onPress={()=>complete.mutate(t.id)} style={[s.check,{borderColor:PC[t.priority]}]} hitSlop={{top:10,bottom:10,left:10,right:10}} accessibilityRole="checkbox">
                  {t.status==='completed'&&<Ionicons name="checkmark" size={13} color={PC[t.priority]}/>}
                </TouchableOpacity>
                <View style={s.body}>
                  <Text style={[s.title,{color:theme.text.primary},t.status==='completed'&&s.strike]} numberOfLines={1}>{t.title}</Text>
                  <View style={{flexDirection:'row'}}>{t.due_date&&<Text style={[s.meta,{color:theme.text.tertiary}]}>{format(new Date(t.due_date),'MMM d')} · </Text>}{t.category&&<Text style={[s.meta,{color:theme.text.tertiary}]}>{t.category}</Text>}</View>
                </View>
                <TouchableOpacity onPress={()=>handleDelete(t)} hitSlop={{top:10,bottom:10,left:10,right:10}} accessibilityLabel="Delete"><Ionicons name="trash-outline" size={18} color={theme.text.tertiary}/></TouchableOpacity>
              </View>
            </TouchableCard>
          )}
        />
      }
    </ScreenLayout>
  );
}
const s=StyleSheet.create({ top:{padding:spacing[4],gap:spacing[3]}, chips:{flexDirection:'row',gap:spacing[2]}, chip:{paddingHorizontal:spacing[3],paddingVertical:spacing[1],borderRadius:radius.full}, list:{padding:spacing[4],paddingTop:0,gap:spacing[2]}, card:{}, row:{flexDirection:'row',alignItems:'center',gap:spacing[3]}, check:{width:22,height:22,borderRadius:radius.full,borderWidth:2,alignItems:'center',justifyContent:'center'}, body:{flex:1}, title:{fontSize:fontSize.base,fontWeight:fontWeight.medium}, strike:{textDecorationLine:'line-through',opacity:0.45}, meta:{fontSize:fontSize.xs} });
