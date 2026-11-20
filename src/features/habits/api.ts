import { supabase } from '../../lib/supabase/client';
import { format, subDays } from 'date-fns';
import type { Habit, HabitLog } from '../../types';
import type { HabitFormValues } from '../../lib/validation/schemas';
export async function fetchHabits(uid:string):Promise<Habit[]> { const { data,error }=await supabase.from('habits').select('*').eq('user_id',uid).eq('is_active',true).order('created_at',{ascending:true}); if(error)throw new Error(error.message); return data as Habit[]; }
export async function fetchTodayHabitLogs(uid:string):Promise<HabitLog[]> { const today=format(new Date(),'yyyy-MM-dd'); const { data,error }=await supabase.from('habit_logs').select('*').eq('user_id',uid).eq('date',today); if(error)throw new Error(error.message); return data as HabitLog[]; }
export async function fetchHabitLogs(uid:string,habitId:string,days=30):Promise<HabitLog[]> { const from=format(subDays(new Date(),days),'yyyy-MM-dd'); const { data,error }=await supabase.from('habit_logs').select('*').eq('user_id',uid).eq('habit_id',habitId).gte('date',from).order('date',{ascending:false}); if(error)throw new Error(error.message); return data as HabitLog[]; }
export async function logHabit(uid:string,habitId:string,count=1,note?:string):Promise<HabitLog> {
  const today=format(new Date(),'yyyy-MM-dd');
  const { data,error }=await supabase.from('habit_logs').upsert({ user_id:uid, habit_id:habitId, date:today, count, note:note??null },{ onConflict:'user_id,habit_id,date' }).select().single();
  if(error)throw new Error(error.message); return data as HabitLog;
}
export async function unlogHabit(uid:string,habitId:string):Promise<void> { const today=format(new Date(),'yyyy-MM-dd'); const { error }=await supabase.from('habit_logs').delete().eq('user_id',uid).eq('habit_id',habitId).eq('date',today); if(error)throw new Error(error.message); }
export async function createHabit(uid:string,values:HabitFormValues):Promise<Habit> { const { data,error }=await supabase.from('habits').insert({ user_id:uid,...values, is_active:true }).select().single(); if(error)throw new Error(error.message); return data as Habit; }
export async function updateHabit(id:string,updates:Partial<HabitFormValues>):Promise<Habit> { const { data,error }=await supabase.from('habits').update({ ...updates, updated_at:new Date().toISOString() }).eq('id',id).select().single(); if(error)throw new Error(error.message); return data as Habit; }
export async function archiveHabit(id:string):Promise<void> { const { error }=await supabase.from('habits').update({ is_active:false, updated_at:new Date().toISOString() }).eq('id',id); if(error)throw new Error(error.message); }
export function calculateStreak(logs:HabitLog[]):number {
  if(!logs.length) return 0;
  const dates=new Set(logs.map(l=>l.date));
  let streak=0, day=new Date();
  while(true){ const k=format(day,'yyyy-MM-dd'); if(!dates.has(k))break; streak++; day=subDays(day,1); }
  return streak;
}
export function calculateCompletionRate(logs:HabitLog[],habit:Habit,days=7):number {
  if(!habit.days_of_week.length) return 0;
  let completed=0;
  const scheduled:Date[]=[];
  for(let i=0;i<days;i++){ const d=subDays(new Date(),i); if(habit.days_of_week.includes(d.getDay())) scheduled.push(d); }
  for(const d of scheduled){ const k=format(d,'yyyy-MM-dd'); if(logs.some(l=>l.date===k&&l.count>=habit.target_count)) completed++; }
  return scheduled.length===0 ? 0 : Math.round((completed/scheduled.length)*100);
}
