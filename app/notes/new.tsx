import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { ScreenLayout } from '../../src/components/layout/ScreenLayout';
import { spacing, fontSize, fontWeight, radius } from '../../src/theme/tokens';
import { useCreateNote, useUpdateNote } from '../../src/features/notes/hooks';
export default function NoteEditorScreen() {
  const { theme }=useTheme(); const router=useRouter();
  const { id } = useLocalSearchParams<{ id?:string }>();
  const [title,setTitle]=useState(''); const [content,setContent]=useState('');
  const [ctype,setCtype]=useState<'text'|'checklist'|'markdown'>('text');
  const [saving,setSaving]=useState(false);
  const create=useCreateNote(); const upd=useUpdateNote();
  const handleSave=async()=>{
    if(!title.trim()&&!content.trim()){ router.back(); return; }
    setSaving(true);
    try {
      if(id) await upd.mutateAsync({ id, updates:{ title:title.trim()||'Untitled', content, content_type:ctype } });
      else    await create.mutateAsync({ title:title.trim()||'Untitled', content, content_type:ctype });
      router.back();
    } catch(e){ Alert.alert('Error',e instanceof Error?e.message:'Could not save note.'); }
    finally { setSaving(false); }
  };
  return (
    <ScreenLayout title={id?'Edit note':'New note'} showBack rightAction={<TouchableOpacity onPress={handleSave} disabled={saving}><Text style={{color:saving?theme.text.disabled:theme.brand.primary,fontSize:fontSize.base,fontWeight:fontWeight.semibold}}>{saving?'Saving…':'Save'}</Text></TouchableOpacity>} keyboardAvoid>
      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}>
        <ScrollView contentContainerStyle={s.c} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TextInput value={title} onChangeText={setTitle} placeholder="Title" placeholderTextColor={theme.text.placeholder} style={[s.titleIn,{color:theme.text.primary}]} autoFocus/>
          <View style={[s.typeBar,{backgroundColor:theme.surface.inset}]}>
            {(['text','checklist','markdown'] as const).map(t=><TouchableOpacity key={t} onPress={()=>setCtype(t)} style={[s.typeBtn,ctype===t&&{backgroundColor:theme.surface.default,shadowColor:'#000',shadowOpacity:0.06,shadowRadius:4,shadowOffset:{width:0,height:1},elevation:2}]}><Text style={{fontSize:fontSize.sm,fontWeight:fontWeight.medium,color:ctype===t?theme.brand.primary:theme.text.tertiary}}>{t[0].toUpperCase()+t.slice(1)}</Text></TouchableOpacity>)}
          </View>
          <TextInput value={content} onChangeText={setContent} placeholder={ctype==='markdown'?'# Heading\n\nWrite **bold** or _italic_…':'Write something…'} placeholderTextColor={theme.text.placeholder} style={[s.bodyIn,{color:theme.text.primary}]} multiline textAlignVertical="top" autoCapitalize="sentences"/>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}
const s=StyleSheet.create({ c:{padding:spacing[5],gap:spacing[4],flexGrow:1}, titleIn:{fontSize:fontSize['2xl'],fontWeight:fontWeight.bold,paddingVertical:spacing[2]}, typeBar:{flexDirection:'row',borderRadius:radius.md,padding:3,gap:2}, typeBtn:{flex:1,alignItems:'center',paddingVertical:spacing[2],borderRadius:radius.sm}, bodyIn:{fontSize:fontSize.base,lineHeight:24,minHeight:300,paddingVertical:spacing[2]} });
