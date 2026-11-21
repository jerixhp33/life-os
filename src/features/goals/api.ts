import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase/client';
import type { Goal, GoalMilestone } from '../../types';
import type { GoalFormValues } from '../../lib/validation/schemas';
import { withTimeout, getLocalData, setLocalData } from '../../lib/offline/localStore';
import { enqueueOperation } from '../../lib/offline/queue';

const DEFAULT_SEED_GOALS: Goal[] = [
  {
    id: 'seed_goal_1',
    user_id: 'local_user',
    title: 'Daily Fitness & Health Routine',
    description: 'Work out 5 days a week and drink 3L water',
    category: 'health',
    status: 'active',
    progress: 40,
    target_date: new Date(Date.now() + 86400000 * 30).toISOString(),
    milestones: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'seed_goal_2',
    user_id: 'local_user',
    title: 'Financial Freedom & Monthly Savings',
    description: 'Save 30% of income and review portfolio monthly',
    category: 'finance',
    status: 'active',
    progress: 65,
    target_date: new Date(Date.now() + 86400000 * 60).toISOString(),
    milestones: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function fetchGoals(uid: string): Promise<Goal[]> {
  try {
    const query = supabase
      .from('goals')
      .select('*,milestones:goal_milestones(*)')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

    const { data, error }: any = await withTimeout(query, 3500);
    if (!error && data) {
      await setLocalData(`goals_${uid}`, data);
      return data as Goal[];
    }
  } catch (e) {
    console.warn('[Goals API] Fetch fallback to cache:', e);
  }

  const cached = await getLocalData<Goal[]>(`goals_${uid}`);
  if (cached && cached.length > 0) return cached;
  return DEFAULT_SEED_GOALS;
}

export async function fetchGoal(id: string): Promise<Goal> {
  try {
    const query = supabase
      .from('goals')
      .select('*,milestones:goal_milestones(*)')
      .eq('id', id)
      .single();

    const { data, error }: any = await withTimeout(query, 3500);
    if (!error && data) return data as Goal;
  } catch {}

  return DEFAULT_SEED_GOALS[0];
}

export async function createGoal(uid: string, values: GoalFormValues): Promise<Goal> {
  const newGoal: Goal = {
    id: `goal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    user_id: uid,
    title: values.title,
    description: values.description,
    category: values.category,
    status: 'active',
    progress: 0,
    target_date: values.target_date,
    milestones: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const cached = (await getLocalData<Goal[]>(`goals_${uid}`)) ?? [];
  await setLocalData(`goals_${uid}`, [newGoal, ...cached]);

  try {
    const { data, error }: any = await withTimeout(
      supabase.from('goals').insert({ user_id: uid, ...values, status: 'active', progress: 0 }).select().single(),
      3500
    );
    if (!error && data) return data as Goal;
  } catch {
    await enqueueOperation('create', 'goals', newGoal.id, newGoal as unknown as Record<string, unknown>);
  }

  return newGoal;
}

export async function updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
  await syncLocalGoalUpdate(id, updates);
  try {
    const { data, error }: any = await withTimeout(
      supabase.from('goals').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single(),
      3500
    );
    if (!error && data) return data as Goal;
  } catch {
    await enqueueOperation('update', 'goals', id, updates as Record<string, unknown>);
  }

  return { id, ...updates } as Goal;
}

async function syncLocalGoalUpdate(id: string, updates: Partial<Goal>) {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const goalKeys = allKeys.filter((k) => k.startsWith('lifeos_data_goals_'));
    for (const gk of goalKeys) {
      const strippedKey = gk.replace('lifeos_data_', '');
      const cached = await getLocalData<Goal[]>(strippedKey);
      if (cached) {
        const updated = cached.map((g) => (g.id === id ? { ...g, ...updates, updated_at: new Date().toISOString() } : g));
        await setLocalData(strippedKey, updated);
      }
    }
  } catch {}
}

async function syncLocalMilestoneToggle(milestoneId: string, goalId: string, completed: boolean) {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const goalKeys = allKeys.filter((k) => k.startsWith('lifeos_data_goals_'));
    for (const gk of goalKeys) {
      const strippedKey = gk.replace('lifeos_data_', '');
      const cached = await getLocalData<Goal[]>(strippedKey);
      if (cached) {
        const updated = cached.map((g) => {
          if (g.id === goalId) {
            const msList = (g.milestones ?? []).map((m) =>
              m.id === milestoneId ? { ...m, completed, completed_at: completed ? new Date().toISOString() : null } : m
            );
            const done = msList.filter((m) => m.completed).length;
            const newProg = msList.length ? Math.round((done / msList.length) * 100) : g.progress;
            return {
              ...g,
              progress: newProg,
              status: (newProg === 100 ? 'completed' : g.status === 'completed' && newProg < 100 ? 'active' : g.status) as Goal['status'],
              milestones: msList,
              updated_at: new Date().toISOString(),
            };
          }
          return g;
        });
        await setLocalData(strippedKey, updated);
      }
    }
  } catch {}
}

export async function updateGoalProgress(id: string, progress: number): Promise<Goal> {
  const p = Math.max(0, Math.min(100, Math.round(progress)));
  return updateGoal(id, { progress: p, status: p === 100 ? 'completed' : 'active' });
}

export async function deleteGoal(id: string): Promise<void> {
  try {
    await withTimeout(supabase.from('goals').delete().eq('id', id), 3500);
  } catch {
    await enqueueOperation('delete', 'goals', id, {});
  }
}

export async function createMilestone(
  goalId: string,
  values: { title: string; description?: string; target_date?: string | null }
): Promise<GoalMilestone> {
  const milestone: GoalMilestone = {
    id: `ms_${Date.now()}`,
    goal_id: goalId,
    title: values.title,
    completed: false,
    position: 0,
  };

  try {
    const { data: ex } = await supabase
      .from('goal_milestones')
      .select('position')
      .eq('goal_id', goalId)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const { data, error }: any = await withTimeout(
      supabase.from('goal_milestones').insert({ goal_id: goalId, ...values, completed: false, position: (ex?.position ?? -1) + 1 }).select().single(),
      3500
    );
    if (!error && data) return data as GoalMilestone;
  } catch {}

  return milestone;
}

export async function completeMilestone(milestoneId: string, goalId: string): Promise<void> {
  await toggleMilestone(milestoneId, goalId, true);
}

export async function toggleMilestone(milestoneId: string, goalId: string, completed: boolean): Promise<void> {
  await syncLocalMilestoneToggle(milestoneId, goalId, completed);
  const completed_at = completed ? new Date().toISOString() : null;
  try {
    await supabase.from('goal_milestones').update({ completed, completed_at }).eq('id', milestoneId);
    const { data } = await supabase.from('goal_milestones').select('completed').eq('goal_id', goalId);
    if (data?.length) {
      const done = data.filter((m) => m.completed).length;
      await updateGoalProgress(goalId, (done / data.length) * 100);
    }
  } catch (err) {
    console.warn('[toggleMilestone] offline fallback:', err);
  }
}

export async function deleteMilestone(id: string): Promise<void> {
  try {
    await supabase.from('goal_milestones').delete().eq('id', id);
  } catch {}
}
