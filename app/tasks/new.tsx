import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useTheme } from '../../src/theme/ThemeContext';
import { ScreenLayout } from '../../src/components/layout/ScreenLayout';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { spacing, fontSize, fontWeight, radius } from '../../src/theme/tokens';
import { taskSchema, type TaskFormValues } from '../../src/lib/validation/schemas';
import { useCreateTask } from '../../src/features/tasks/hooks';
const PRIORITIES=[{k:'low',l:'Low',c:'#94A3B8'},{k:'medium',l:'Medium',c:'#60A5FA'},{k:'high',l:'High',c:'#38BDF8'},{k:'urgent',l:'Urgent',c:'#EF4444'}] as const;
const CATEGORIES=['Work','Personal','Health','Finance','Learning','Family','Other'];
export default function NewTaskScreen() {
  const { theme }=useTheme(); const router=useRouter(); const create=useCreateTask();
  const [showDate,setShowDate]=useState(false); const [showRem,setShowRem]=useState(false);
  const { control, handleSubmit, watch, setValue, formState:{errors} } = useForm<TaskFormValues>({ resolver:zodResolver(taskSchema), defaultValues:{ title:'', priority:'medium', tags:[] } });
  const dueDate=watch('due_date'); const remAt=watch('reminder_at');
  const onSubmit=async(v:TaskFormValues)=>{ try { await create.mutateAsync(v); router.back(); } catch(e){ Alert.alert('Error',e instanceof Error?e.message:'Could not create task.'); } };
  return (
    <ScreenLayout title="New task" showBack keyboardAvoid>
      <ScrollView contentContainerStyle={s.c} keyboardShouldPersistTaps="handled">
        <Controller control={control} name="title" render={({field:{onChange,value}})=><Input label="Task title" placeholder="What needs to get done?" value={value} onChangeText={onChange} error={errors.title?.message} required autoFocus/>}/>
        <Controller control={control} name="description" render={({field:{onChange,value}})=><Input label="Description (optional)" placeholder="Add details…" value={value??''} onChangeText={onChange} multiline numberOfLines={3}/>}/>
        <View><Text style={[s.label,{color:theme.text.secondary}]}>Priority</Text>
          <Controller control={control} name="priority" render={({field:{value,onChange}})=>(
            <View style={{flexDirection:'row',gap:spacing[2]}}>
              {PRIORITIES.map(p=><TouchableOpacity key={p.k} onPress={()=>onChange(p.k)} style={[s.pChip,{backgroundColor:value===p.k?p.c+'20':theme.surface.inset,borderColor:value===p.k?p.c:'transparent',borderWidth:1.5}]}><View style={[s.dot,{backgroundColor:p.c}]}/><Text style={{color:value===p.k?p.c:theme.text.secondary,fontSize:fontSize.sm,fontWeight:fontWeight.medium}}>{p.l}</Text></TouchableOpacity>)}
            </View>
          )}/>
        </View>
        <View><Text style={[s.label,{color:theme.text.secondary}]}>Due date</Text>
          <TouchableOpacity onPress={()=>setShowDate(true)} style={[s.pick,{backgroundColor:theme.surface.inset,borderColor:theme.border.default}]}>
            <Ionicons name="calendar-outline" size={18} color={theme.text.tertiary}/>
            <Text style={{color:dueDate?theme.text.primary:theme.text.placeholder,flex:1}}>{dueDate?format(new Date(dueDate),'EEEE, MMM d yyyy'):'No due date'}</Text>
            {dueDate&&<TouchableOpacity onPress={()=>setValue('due_date',undefined)}><Ionicons name="close-circle" size={18} color={theme.text.tertiary}/></TouchableOpacity>}
          </TouchableOpacity>
        </View>
        {showDate&&<DateTimePicker value={dueDate?new Date(dueDate):new Date()} mode="date" onChange={(_,d)=>{ setShowDate(false); if(d) setValue('due_date',d.toISOString().split('T')[0]); }}/>}
        <View><Text style={[s.label,{color:theme.text.secondary}]}>Reminder</Text>
          <TouchableOpacity onPress={()=>setShowRem(true)} style={[s.pick,{backgroundColor:theme.surface.inset,borderColor:theme.border.default}]}>
            <Ionicons name="notifications-outline" size={18} color={theme.text.tertiary}/>
            <Text style={{color:remAt?theme.text.primary:theme.text.placeholder,flex:1}}>{remAt?format(new Date(remAt),"MMM d 'at' h:mm a"):'No reminder'}</Text>
            {remAt&&<TouchableOpacity onPress={()=>setValue('reminder_at',undefined)}><Ionicons name="close-circle" size={18} color={theme.text.tertiary}/></TouchableOpacity>}
          </TouchableOpacity>
        </View>
        {showRem&&<DateTimePicker value={remAt?new Date(remAt):new Date()} mode="datetime" onChange={(_,d)=>{ setShowRem(false); if(d) setValue('reminder_at',d.toISOString()); }}/>}
        <View><Text style={[s.label,{color:theme.text.secondary}]}>Category</Text>
          <Controller control={control} name="category" render={({field:{value,onChange}})=>(
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:spacing[2]}}>
              {CATEGORIES.map(c=><TouchableOpacity key={c} onPress={()=>onChange(value===c?undefined:c)} style={[s.catChip,{backgroundColor:value===c?theme.brand.primary:theme.surface.inset}]}><Text style={{color:value===c?'#fff':theme.text.secondary,fontSize:fontSize.sm,fontWeight:fontWeight.medium}}>{c}</Text></TouchableOpacity>)}
            </ScrollView>
          )}/>
        </View>
        <Button label="Create task" onPress={handleSubmit(onSubmit)} loading={create.isPending} size="lg" fullWidth style={{marginTop:spacing[4]}}/>
      </ScrollView>
    </ScreenLayout>
  );
}
const s=StyleSheet.create({ c:{padding:spacing[5],gap:spacing[5]}, label:{fontSize:fontSize.sm,fontWeight:fontWeight.medium,marginBottom:spacing[2]}, pChip:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',paddingVertical:spacing[2],borderRadius:radius.md,gap:spacing[1]}, dot:{width:8,height:8,borderRadius:radius.full}, pick:{flexDirection:'row',alignItems:'center',gap:spacing[2],borderWidth:1.5,borderRadius:radius.md,paddingHorizontal:spacing[3],paddingVertical:spacing[3]}, catChip:{paddingHorizontal:spacing[4],paddingVertical:spacing[2],borderRadius:radius.full} });
