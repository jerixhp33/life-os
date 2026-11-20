import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { ScreenLayout } from '../../src/components/layout/ScreenLayout';
import { Input } from '../../src/components/ui/Input';
import { SkeletonCard, EmptyState } from '../../src/components/feedback';
import { TouchableCard } from '../../src/components/ui/Card';
import { useNotes, useSearchNotes, useDeleteNote, useUpdateNote } from '../../src/features/notes/hooks';
import { spacing, fontSize, fontWeight, radius } from '../../src/theme/tokens';
import type { Note } from '../../src/types';
export default function NotesScreen() {
  const { theme }=useTheme(); const router=useRouter();
  const [search,setSearch]=useState('');
  const { data:notes, isLoading, refetch } = useNotes();
  const { data:sr } = useSearchNotes(search);
  const del=useDeleteNote(); const upd=useUpdateNote();
  const display = search.length>1?(sr??[]):(notes??[]);
  const handleDelete=(n:Note)=>Alert.alert('Delete note',`Delete "${n.title}"?`,[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:()=>del.mutate(n.id)}]);
  return (
    <ScreenLayout title="Notes" showBack rightAction={<TouchableOpacity onPress={()=>router.push('/notes/new')} accessibilityLabel="New note"><Ionicons name="add" size={26} color={theme.brand.primary}/></TouchableOpacity>}>
      <View style={s.top}><Input placeholder="Search notes…" value={search} onChangeText={setSearch} showClearButton prefix={<Ionicons name="search-outline" size={18} color={theme.text.tertiary}/>} containerStyle={{marginBottom:0}}/></View>
      {isLoading?<View style={s.list}>{[1,2,3].map(i=><SkeletonCard key={i}/>)}</View>:!display.length?<EmptyState icon="document-text-outline" title={search?'No matches':'No notes yet'} description="Tap + to write your first note." actionLabel={search?undefined:'New note'} onAction={search?undefined:()=>router.push('/notes/new')}/>:
        <FlatList data={display} keyExtractor={n=>n.id} contentContainerStyle={s.list} showsVerticalScrollIndicator={false}
          renderItem={({item:n})=>(
            <TouchableCard onPress={()=>router.push(`/notes/${n.id}` as never)} style={s.card}>
              <View style={s.head}>
                {n.pinned&&<Ionicons name="pin" size={14} color={theme.brand.primary} style={{marginRight:4}}/>}
                <Text style={[s.title,{color:theme.text.primary}]} numberOfLines={1}>{n.title||'Untitled'}</Text>
                <TouchableOpacity onPress={()=>upd.mutate({id:n.id,updates:{is_favorite:!n.is_favorite}})} hitSlop={{top:8,bottom:8,left:8,right:8}}><Ionicons name={n.is_favorite?'heart':'heart-outline'} size={16} color={n.is_favorite?'#C53B45':theme.text.tertiary}/></TouchableOpacity>
              </View>
              {n.content.length>0&&<Text style={[s.preview,{color:theme.text.secondary}]} numberOfLines={2}>{n.content.replace(/[#*_~`]/g,'').slice(0,100)}</Text>}
              <View style={s.meta}><Text style={[s.date,{color:theme.text.tertiary}]}>{format(new Date(n.updated_at),'MMM d, yyyy')}</Text>{n.tags.slice(0,3).map(t=><View key={t} style={[s.tag,{backgroundColor:theme.brand.primaryBg}]}><Text style={[s.tagTxt,{color:theme.brand.primary}]}>{t}</Text></View>)}<TouchableOpacity onPress={()=>handleDelete(n)} hitSlop={{top:8,bottom:8,left:8,right:8}}><Ionicons name="trash-outline" size={16} color={theme.text.tertiary}/></TouchableOpacity></View>
            </TouchableCard>
          )}
        />
      }
    </ScreenLayout>
  );
}
const s=StyleSheet.create({ top:{padding:spacing[4],paddingBottom:spacing[2]}, list:{padding:spacing[4],gap:spacing[3]}, card:{gap:spacing[2]}, head:{flexDirection:'row',alignItems:'center',gap:spacing[1]}, title:{flex:1,fontSize:fontSize.base,fontWeight:fontWeight.semibold}, preview:{fontSize:fontSize.sm,lineHeight:20}, meta:{flexDirection:'row',alignItems:'center',gap:spacing[2]}, date:{fontSize:fontSize.xs,flex:1}, tag:{paddingHorizontal:spacing[2],paddingVertical:2,borderRadius:radius.full}, tagTxt:{fontSize:10,fontWeight:fontWeight.medium} });
