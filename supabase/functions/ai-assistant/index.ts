import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GEMINI_API_KEY   = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SVC_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const DAILY_LIMIT      = 50_000;
const MAX_TOKENS       = 1024;
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const auth = req.headers.get('Authorization');
    if (!auth) return err(401, 'Unauthorized');
    const sb = createClient(SUPABASE_URL, SUPABASE_SVC_KEY);
    const { data: { user }, error: authErr } = await sb.auth.getUser(auth.replace('Bearer ', ''));
    if (authErr || !user) return err(401, 'Invalid token');
    if (!GEMINI_API_KEY) return err(503, 'AI assistant is not configured. Add GEMINI_API_KEY to the server environment.', true);

    const today = new Date().toISOString().split('T')[0];
    const { data: usage } = await sb.from('ai_usage').select('tokens_used').eq('user_id', user.id).eq('date', today).single();
    if (usage && usage.tokens_used >= DAILY_LIMIT) return err(429, 'Daily AI usage limit reached. Try again tomorrow.');

    const { messages, context } = await req.json();
    if (!Array.isArray(messages) || !messages.length) return err(400, 'messages required');

    const system = `You are LifeOS Assistant, a calm and practical personal life management assistant powered by Google Gemini.
Current date: ${new Date().toISOString().split('T')[0]}. User timezone: ${context?.timezone ?? 'UTC'}. User: ${context?.user_name ?? 'there'}.
Pending tasks: ${context?.pending_tasks_count ?? 0}. Overdue: ${context?.overdue_tasks_count ?? 0}.
Be concise and practical. Never use shame-based language about productivity.
Only include an action JSON block when user explicitly asks to create/modify something: {"action":{"type":"create_task","payload":{...},"description":"..."}}`;

    const contents = messages
      .filter((m: { role: string }) => m.role !== 'system')
      .slice(-20)
      .map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system + ' Do not use emojis in any response.' }] },
          contents,
          generationConfig: { maxOutputTokens: MAX_TOKENS }
        })
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error('[Gemini API error]', errText);
      return err(502, 'Gemini AI provider error. Please try again.');
    }

    const ai = await res.json();
    let raw: string = ai.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    raw = raw.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}\u{1FA00}-\u{1FAFF}\u{2300}-\u{23FF}\u{2B50}-\u{2B55}]/gu, '').trim();
    const tokens: number = ai.usageMetadata?.candidatesTokenCount ?? 0;

    let pending_action = null;
    const m = raw.match(/\{[\s\S]*"action"[\s\S]*\}/);
    if (m) {
      try {
        const p = JSON.parse(m[0]);
        if (p.action?.type && p.action?.payload) pending_action = p.action;
      } catch {}
    }
    const content = raw.replace(/\{[\s\S]*"action"[\s\S]*\}/, '').trim();

    await sb.from('ai_usage').upsert(
      { user_id: user.id, date: today, tokens_used: (usage?.tokens_used ?? 0) + tokens },
      { onConflict: 'user_id,date' }
    ).catch(() => {});

    return new Response(JSON.stringify({ content, pending_action }), {
      headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('[AI]', e);
    return err(500, 'Unexpected error.');
  }
});

function err(status: number, msg: string, notConfigured = false) {
  return new Response(JSON.stringify({ error: msg, not_configured: notConfigured }), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' }
  });
}
