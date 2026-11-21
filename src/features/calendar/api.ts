import { supabase } from '../../lib/supabase/client';
import type { CalendarEvent } from '../../types';
import type { EventFormValues } from '../../lib/validation/schemas';
import { withTimeout, getLocalData, setLocalData } from '../../lib/offline/localStore';
import { enqueueOperation } from '../../lib/offline/queue';

const DEFAULT_SEED_EVENTS: CalendarEvent[] = [
  {
    id: 'seed_event_1',
    user_id: 'local_user',
    title: 'Daily Review & Planning',
    description: 'Review day targets, habits, and tasks',
    start_at: new Date(Date.now() + 3600000).toISOString(),
    end_at: new Date(Date.now() + 7200000).toISOString(),
    all_day: false,
    color: 'blue',
    location: 'LifeOS Workspace',
    timezone: 'Asia/Kolkata',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function fetchEvents(uid: string, from: string, to: string): Promise<CalendarEvent[]> {
  try {
    const query = supabase
      .from('events')
      .select('*')
      .eq('user_id', uid)
      .gte('start_at', from)
      .lte('end_at', to)
      .order('start_at', { ascending: true });

    const { data, error }: any = await withTimeout(query, 3500);
    if (!error && data) {
      await setLocalData(`events_${uid}`, data);
      return data as CalendarEvent[];
    }
  } catch (e) {
    console.warn('[Calendar API] Fetch events fallback to local cache:', e);
  }

  const cached = await getLocalData<CalendarEvent[]>(`events_${uid}`);
  if (cached && cached.length > 0) return cached;
  return DEFAULT_SEED_EVENTS;
}

export async function fetchUpcomingEvents(uid: string, limit = 5): Promise<CalendarEvent[]> {
  try {
    const query = supabase
      .from('events')
      .select('*')
      .eq('user_id', uid)
      .gte('start_at', new Date().toISOString())
      .order('start_at', { ascending: true })
      .limit(limit);

    const { data, error }: any = await withTimeout(query, 3500);
    if (!error && data) {
      return data as CalendarEvent[];
    }
  } catch {}

  const cached = await getLocalData<CalendarEvent[]>(`events_${uid}`);
  if (cached && cached.length > 0) return cached.slice(0, limit);
  return DEFAULT_SEED_EVENTS.slice(0, limit);
}

export async function createEvent(uid: string, values: EventFormValues, timezone: string): Promise<CalendarEvent> {
  const newEvent: CalendarEvent = {
    id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    user_id: uid,
    title: values.title,
    description: values.description,
    start_at: values.start_at,
    end_at: values.end_at,
    all_day: values.all_day ?? false,
    color: values.color ?? 'blue',
    location: values.location,
    timezone: timezone || 'Asia/Kolkata',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const cached = (await getLocalData<CalendarEvent[]>(`events_${uid}`)) ?? [];
  await setLocalData(`events_${uid}`, [newEvent, ...cached]);

  try {
    const { data, error }: any = await withTimeout(
      supabase.from('events').insert({ user_id: uid, ...values, timezone }).select().single(),
      3500
    );
    if (!error && data) return data as CalendarEvent;
  } catch {
    await enqueueOperation('create', 'events', newEvent.id, newEvent as unknown as Record<string, unknown>);
  }

  return newEvent;
}

export async function updateEvent(id: string, updates: Partial<EventFormValues>): Promise<CalendarEvent> {
  try {
    const { data, error }: any = await withTimeout(
      supabase.from('events').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single(),
      3500
    );
    if (!error && data) return data as CalendarEvent;
  } catch {
    await enqueueOperation('update', 'events', id, updates as Record<string, unknown>);
  }

  return { id, ...updates } as CalendarEvent;
}

export async function deleteEvent(id: string): Promise<void> {
  try {
    await withTimeout(supabase.from('events').delete().eq('id', id), 3500);
  } catch {
    await enqueueOperation('delete', 'events', id, {});
  }
}
