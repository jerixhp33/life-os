import { supabase } from '../../lib/supabase/client';
import type { Task, Subtask } from '../../types';
import type { TaskFormValues } from '../../lib/validation/schemas';
export async function fetchTasks(userId:string):Promise<Task[]> {
  const { data,error } = await supabase.from('tasks').select('*,subtasks:task_subtasks(*)').eq('user_id',userId).order('created_at',{ascending:false});
  if (error) throw new Error(error.message); return data as Task[];
}
export async function fetchTask(taskId:string):Promise<Task> {
  const { data,error } = await supabase.from('tasks').select('*,subtasks:task_subtasks(*)').eq('id',taskId).single();
  if (error) throw new Error(error.message); return data as Task;
}
export async function fetchTodayTasks(userId:string):Promise<Task[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data,error } = await supabase.from('tasks').select('*,subtasks:task_subtasks(*)').eq('user_id',userId).neq('status','cancelled').or(`due_date.eq.${today},due_date.lt.${today}`).neq('status','completed').order('priority',{ascending:false}).order('due_date',{ascending:true}).limit(20);
  if (error) throw new Error(error.message); return data as Task[];
}
export async function createTask(userId:string,values:TaskFormValues):Promise<Task> {
  const { data,error } = await supabase.from('tasks').insert({ user_id:userId,...values, status:'pending', tags:values.tags??[] }).select().single();
  if (error) throw new Error(error.message); return data as Task;
}
export async function updateTask(taskId:string,updates:Partial<TaskFormValues>):Promise<Task> {
  const { data,error } = await supabase.from('tasks').update({ ...updates, updated_at:new Date().toISOString() }).eq('id',taskId).select().single();
  if (error) throw new Error(error.message); return data as Task;
}
export async function completeTask(taskId:string):Promise<Task> {
  const { data,error } = await supabase.from('tasks').update({ status:'completed', completed_at:new Date().toISOString(), updated_at:new Date().toISOString() }).eq('id',taskId).select().single();
  if (error) throw new Error(error.message); return data as Task;
}
export async function deleteTask(taskId:string):Promise<void> { const { error } = await supabase.from('tasks').delete().eq('id',taskId); if (error) throw new Error(error.message); }
export async function searchTasks(userId:string,query:string):Promise<Task[]> {
  const { data,error } = await supabase.from('tasks').select('*').eq('user_id',userId).ilike('title',`%${query}%`).neq('status','cancelled').order('created_at',{ascending:false}).limit(30);
  if (error) throw new Error(error.message); return data as Task[];
}
export async function createSubtask(taskId:string,title:string):Promise<Subtask> {
  const { data:ex } = await supabase.from('task_subtasks').select('position').eq('task_id',taskId).order('position',{ascending:false}).limit(1).single();
  const { data,error } = await supabase.from('task_subtasks').insert({ task_id:taskId, title, completed:false, position:(ex?.position??-1)+1 }).select().single();
  if (error) throw new Error(error.message); return data as Subtask;
}
export async function toggleSubtask(id:string,completed:boolean):Promise<Subtask> {
  const { data,error } = await supabase.from('task_subtasks').update({ completed }).eq('id',id).select().single();
  if (error) throw new Error(error.message); return data as Subtask;
}
export async function deleteSubtask(id:string):Promise<void> { const { error } = await supabase.from('task_subtasks').delete().eq('id',id); if (error) throw new Error(error.message); }
