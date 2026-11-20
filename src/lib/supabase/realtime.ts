import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from './client';
import { useAuthStore } from '../../stores/authStore';
import { processQueue } from '../offline/queue';

export function useRealtimeSync() {
  const qc = useQueryClient();
  const uid = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    if (!uid) return;

    // Run offline queue processor whenever sync is active
    processQueue().catch(() => {});

    // Create a unified realtime channel for the user
    const channel = supabase
      .channel(`lifeos-user-${uid}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${uid}` },
        () => {
          qc.invalidateQueries({ queryKey: ['tasks'] });
          qc.invalidateQueries({ queryKey: ['tasks:today'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notes', filter: `user_id=eq.${uid}` },
        () => {
          qc.invalidateQueries({ queryKey: ['notes'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events', filter: `user_id=eq.${uid}` },
        () => {
          qc.invalidateQueries({ queryKey: ['events'] });
          qc.invalidateQueries({ queryKey: ['events:upcoming'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'habits', filter: `user_id=eq.${uid}` },
        () => {
          qc.invalidateQueries({ queryKey: ['habits'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'habit_logs', filter: `user_id=eq.${uid}` },
        () => {
          qc.invalidateQueries({ queryKey: ['habit_logs'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'goals', filter: `user_id=eq.${uid}` },
        () => {
          qc.invalidateQueries({ queryKey: ['goals'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${uid}` },
        () => {
          qc.invalidateQueries({ queryKey: ['transactions'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'documents', filter: `user_id=eq.${uid}` },
        () => {
          qc.invalidateQueries({ queryKey: ['documents'] });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] Subscribed to live database changes');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [uid, qc]);
}
