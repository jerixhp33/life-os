import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { fetchEvents, fetchUpcomingEvents, createEvent, updateEvent, deleteEvent } from './api';
import { scheduleEventReminder, cancelNotification } from '../../lib/notifications/service';
import type { EventFormValues } from '../../lib/validation/schemas';
export const EVENTS_KEY='events', UPCOMING_KEY='events:upcoming';
export const useEvents=(from:string,to:string)=>{ const uid=useAuthStore(s=>s.user?.id); return useQuery({ queryKey:[EVENTS_KEY,uid,from,to], queryFn:()=>fetchEvents(uid!,from,to), enabled:Boolean(uid), staleTime:60_000 }); };
export const useUpcomingEvents=(limit=5)=>{ const uid=useAuthStore(s=>s.user?.id); return useQuery({ queryKey:[UPCOMING_KEY,uid,limit], queryFn:()=>fetchUpcomingEvents(uid!,limit), enabled:Boolean(uid), staleTime:60_000 }); };
export function useCreateEvent(){ const uid=useAuthStore(s=>s.user?.id); const profile=useAuthStore(s=>s.profile); const qc=useQueryClient(); return useMutation({ mutationFn:(v:EventFormValues)=>createEvent(uid!,v,profile?.timezone??'UTC'), onSuccess:async(e)=>{ qc.invalidateQueries({queryKey:[EVENTS_KEY]}); qc.invalidateQueries({queryKey:[UPCOMING_KEY]}); if(e.reminder_minutes!=null){ const at=new Date(new Date(e.start_at).getTime()-e.reminder_minutes*60000); await scheduleEventReminder(e.id,e.title,at).catch(()=>{}); } } }); }
export function useDeleteEvent(){ const qc=useQueryClient(); return useMutation({ mutationFn:deleteEvent, onSuccess:(_,id)=>{ cancelNotification(`event_${id}`).catch(()=>{}); qc.invalidateQueries({queryKey:[EVENTS_KEY]}); qc.invalidateQueries({queryKey:[UPCOMING_KEY]}); } }); }
