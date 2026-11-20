import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const SUPABASE_URL=Deno.env.get('SUPABASE_URL')!; const SUPABASE_SVC=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
serve(async(req:Request)=>{
  if(req.method==='OPTIONS') return new Response('ok',{headers:CORS});
  try{
    const auth=req.headers.get('Authorization'); if(!auth) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:CORS});
    const sb=createClient(SUPABASE_URL,SUPABASE_SVC);
    const {data:{user},error}=await sb.auth.getUser(auth.replace('Bearer ',''));
    if(error||!user) return new Response(JSON.stringify({error:'Invalid token'}),{status:401,headers:CORS});
    const uid=user.id;
    const [profile,tasks,events,notes,habits,goals,transactions,budgets,documents]=await Promise.all([
      sb.from('profiles').select('id,email,full_name,timezone,currency,created_at').eq('id',uid).single(),
      sb.from('tasks').select('*').eq('user_id',uid),
      sb.from('events').select('*').eq('user_id',uid),
      sb.from('notes').select('*').eq('user_id',uid),
      sb.from('habits').select('*').eq('user_id',uid),
      sb.from('goals').select('*').eq('user_id',uid),
      sb.from('transactions').select('*').eq('user_id',uid),
      sb.from('budgets').select('*').eq('user_id',uid),
      sb.from('documents').select('id,title,file_name,category,tags,created_at').eq('user_id',uid),
    ]);
    const data={export_date:new Date().toISOString(),export_version:'1.0',user:profile.data,tasks:tasks.data??[],events:events.data??[],notes:notes.data??[],habits:habits.data??[],goals:goals.data??[],transactions:transactions.data??[],budgets:budgets.data??[],documents_metadata:documents.data??[]};
    return new Response(JSON.stringify(data,null,2),{headers:{...CORS,'Content-Type':'application/json','Content-Disposition':`attachment; filename="lifeos_export_${new Date().toISOString().split('T')[0]}.json"`}});
  }catch(e){console.error('[Export]',e);return new Response(JSON.stringify({error:'Export failed'}),{status:500,headers:CORS});}
});
