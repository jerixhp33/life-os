import { supabase } from '../../lib/supabase/client';
import type { Goal, GoalMilestone } from '../../types';
import type { GoalFormValues } from '../../lib/validation/schemas';
export async function fetchGoals(uid:string):Promise<Goal[]> { const { data,error }=await supabase.from('goals').select('*,milestones:goal_milestones(*)').eq('user_id',uid).order('created_at',{ascending:false}); if(error)throw new Error(error.message); return (data??[]) as Goal[]; }
export async function fetchGoal(id:string):Promise<Goal> { const { data,error }=await supabase.from('goals').select('*,milestones:goal_milestones(*)').eq('id',id).single(); if(error)throw new Error(error.message); return data as Goal; }
export async function createGoal(uid:string,values:GoalFormValues):Promise<Goal> { const { data,error }=await supabase.from('goals').insert({ user_id:uid,...values, status:'active', progress:0 }).select().single(); if(error)throw new Error(error.message); return data as Goal; }
export async function updateGoal(id:string,updates:Partial<Goal>):Promise<Goal> { const { data,error }=await supabase.from('goals').update({ ...updates, updated_at:new Date().toISOString() }).eq('id',id).select().single(); if(error)throw new Error(error.message); return data as Goal; }
export async function updateGoalProgress(id:string,progress:number):Promise<Goal> { const p=Math.max(0,Math.min(100,Math.round(progress))); return updateGoal(id,{ progress:p, status:p===100?'completed':'active' }); }
export async function deleteGoal(id:string):Promise<void> { const { error }=await supabase.from('goals').delete().eq('id',id); if(error)throw new Error(error.message); }
export async function createMilestone(goalId:string,values:{title:string;description?:string;target_date?:string|null}):Promise<GoalMilestone> {
  const { data:ex }=await supabase.from('goal_milestones').select('position').eq('goal_id',goalId).order('position',{ascending:false}).limit(1).single();
  const { data,error }=await supabase.from('goal_milestones').insert({ goal_id:goalId,...values, completed:false, position:(ex?.position??-1)+1 }).select().single();
  if(error)throw new Error(error.message); return data as GoalMilestone;
}
export async function completeMilestone(milestoneId:string,goalId:string):Promise<void> {
  await supabase.from('goal_milestones').update({ completed:true, completed_at:new Date().toISOString() }).eq('id',milestoneId);
  const { data }=await supabase.from('goal_milestones').select('completed').eq('goal_id',goalId);
  if(data?.length){ const done=data.filter(m=>m.completed).length; await updateGoalProgress(goalId,(done/data.length)*100); }
}
export async function deleteMilestone(id:string):Promise<void> { const { error }=await supabase.from('goal_milestones').delete().eq('id',id); if(error)throw new Error(error.message); }
