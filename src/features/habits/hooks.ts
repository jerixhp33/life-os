import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import {
  fetchHabits,
  fetchTodayHabitLogs,
  fetchHabitLogs,
  logHabit,
  unlogHabit,
  createHabit,
  updateHabit,
  archiveHabit,
} from './api';
import type { HabitFormValues } from '../../lib/validation/schemas';

export const HABITS_KEY = 'habits';
export const HABIT_LOGS_KEY = 'habit_logs';

export function useHabits() {
  const uid = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: [HABITS_KEY, uid],
    queryFn: () => fetchHabits(uid!),
    enabled: Boolean(uid),
    staleTime: 30_000,
  });
}

export function useTodayHabitLogs() {
  const uid = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: [HABIT_LOGS_KEY, 'today', uid],
    queryFn: () => fetchTodayHabitLogs(uid!),
    enabled: Boolean(uid),
    refetchInterval: 60_000,
  });
}

export function useHabitLogs(habitId: string, days = 30) {
  const uid = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: [HABIT_LOGS_KEY, habitId, uid, days],
    queryFn: () => fetchHabitLogs(uid!, habitId, days),
    enabled: Boolean(uid && habitId),
    staleTime: 30_000,
  });
}

export function useLogHabit() {
  const uid = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ habitId, count = 1, note }: { habitId: string; count?: number; note?: string }) =>
      logHabit(uid!, habitId, count, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [HABIT_LOGS_KEY] });
    },
  });
}

export function useUnlogHabit() {
  const uid = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (habitId: string) => unlogHabit(uid!, habitId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [HABIT_LOGS_KEY] });
    },
  });
}

export function useCreateHabit() {
  const uid = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: HabitFormValues) => createHabit(uid!, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [HABITS_KEY] });
    },
  });
}

export function useUpdateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<HabitFormValues> }) =>
      updateHabit(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [HABITS_KEY] });
    },
  });
}

export function useArchiveHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveHabit(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [HABITS_KEY] });
    },
  });
}
