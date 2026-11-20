import { supabase } from '../../lib/supabase/client';
import type { AiMessage, AiPendingAction } from '../../types';
export interface AiUserContext { user_name:string; timezone:string; today:string; pending_tasks_count:number; overdue_tasks_count:number; }
export function buildAiContext(p:Partial<AiUserContext>):AiUserContext { return { user_name:p.user_name??'there', timezone:p.timezone??'UTC', today:p.today??new Date().toISOString().split('T')[0], pending_tasks_count:p.pending_tasks_count??0, overdue_tasks_count:p.overdue_tasks_count??0 }; }
export class AiNotConfiguredError extends Error { constructor(){ super('The AI assistant is not configured. Add GEMINI_API_KEY to the server environment.'); this.name='AiNotConfiguredError'; } }
export async function sendAiMessage(messages:AiMessage[], context:AiUserContext): Promise<AiMessage> {
  const { data, error } = await supabase.functions.invoke('ai-assistant', { body:{ messages:messages.slice(-20).map(m=>({role:m.role,content:m.content})), context } });
  if (error) {
    if (error.message?.includes('configured')) throw new AiNotConfiguredError();
    throw new Error(error.message ?? 'AI assistant is unavailable right now.');
  }
  return { id:`ai_${Date.now()}`, role:'assistant', content:data?.content??'Sorry, I could not respond.', timestamp:new Date().toISOString(), pending_action:data?.pending_action??null };
}
export async function executeAiAction(action:AiPendingAction,userId:string):Promise<{success:boolean;message:string}> {
  const { data, error } = await supabase.functions.invoke('ai-action',{ body:{ action, user_id:userId } });
  if (error) throw new Error(error.message??'Action failed');
  return data as {success:boolean;message:string};
}
