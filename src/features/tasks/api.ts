import { supabase } from '../../lib/supabase/client';
import type { Task, Subtask } from '../../types';
import type { TaskFormValues } from '../../lib/validation/schemas';
import { withTimeout, getLocalData, setLocalData } from '../../lib/offline/localStore';
import { enqueueOperation } from '../../lib/offline/queue';

const DEFAULT_SEED_TASKS: Task[] = [
  {
    id: 'seed_task_1',
    user_id: 'local_user',
    title: 'Review today’s schedule & priorities',
    description: 'Check calendar events and plan tasks',
    priority: 'high',
    status: 'pending',
    due_date: new Date().toISOString().split('T')[0],
    due_time: '09:00',
    tags: ['Planning'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'seed_task_2',
    user_id: 'local_user',
    title: 'Update monthly expense log',
    description: 'Track daily UPI and cash payments',
    priority: 'medium',
    status: 'pending',
    due_date: new Date().toISOString().split('T')[0],
    tags: ['Finance'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function fetchTasks(userId: string): Promise<Task[]> {
  try {
    const query = supabase
      .from('tasks')
      .select('*,subtasks:task_subtasks(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const { data, error }: any = await withTimeout(query, 3500);
    if (!error && data) {
      await setLocalData(`tasks_${userId}`, data);
      return data as Task[];
    }
  } catch (e) {
    console.warn('[Tasks API] Remote fetch deferred, falling back to local cache:', e);
  }

  const cached = await getLocalData<Task[]>(`tasks_${userId}`);
  if (cached && cached.length > 0) return cached;
  return DEFAULT_SEED_TASKS;
}

export async function fetchTask(taskId: string): Promise<Task> {
  try {
    const query = supabase
      .from('tasks')
      .select('*,subtasks:task_subtasks(*)')
      .eq('id', taskId)
      .single();

    const { data, error }: any = await withTimeout(query, 3500);
    if (!error && data) return data as Task;
  } catch {}

  const cached = (await getLocalData<Task[]>('tasks_all')) ?? DEFAULT_SEED_TASKS;
  const found = cached.find((t) => t.id === taskId);
  if (found) return found;
  return DEFAULT_SEED_TASKS[0];
}

export async function fetchTodayTasks(userId: string): Promise<Task[]> {
  const today = new Date().toISOString().split('T')[0];
  try {
    const query = supabase
      .from('tasks')
      .select('*,subtasks:task_subtasks(*)')
      .eq('user_id', userId)
      .neq('status', 'cancelled')
      .or(`due_date.eq.${today},due_date.lt.${today}`)
      .neq('status', 'completed')
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true })
      .limit(20);

    const { data, error }: any = await withTimeout(query, 3500);
    if (!error && data) {
      await setLocalData(`today_tasks_${userId}`, data);
      return data as Task[];
    }
  } catch (e) {
    console.warn('[Tasks API] Today tasks deferred to cache:', e);
  }

  const cached = await getLocalData<Task[]>(`today_tasks_${userId}`);
  if (cached && cached.length > 0) return cached;
  const allCached = await getLocalData<Task[]>(`tasks_${userId}`);
  if (allCached) {
    return allCached.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');
  }
  return DEFAULT_SEED_TASKS;
}

export async function createTask(userId: string, values: TaskFormValues): Promise<Task> {
  const newTask: Task = {
    id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    user_id: userId,
    title: values.title,
    description: values.description,
    priority: values.priority,
    status: 'pending',
    due_date: values.due_date,
    due_time: values.due_time,
    tags: values.tags ?? [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const cached = (await getLocalData<Task[]>(`tasks_${userId}`)) ?? [];
  await setLocalData(`tasks_${userId}`, [newTask, ...cached]);

  try {
    const { data, error }: any = await withTimeout(
      supabase.from('tasks').insert({ user_id: userId, ...values, status: 'pending', tags: values.tags ?? [] }).select().single(),
      3500
    );
    if (!error && data) {
      return data as Task;
    }
  } catch {
    await enqueueOperation('create', 'tasks', newTask.id, newTask as unknown as Record<string, unknown>);
  }

  return newTask;
}

export async function updateTask(taskId: string, updates: Partial<TaskFormValues>): Promise<Task> {
  try {
    const { data, error }: any = await withTimeout(
      supabase.from('tasks').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', taskId).select().single(),
      3500
    );
    if (!error && data) return data as Task;
  } catch {
    await enqueueOperation('update', 'tasks', taskId, updates as Record<string, unknown>);
  }

  return { id: taskId, ...updates } as Task;
}

export async function completeTask(taskId: string): Promise<Task> {
  try {
    const { data, error }: any = await withTimeout(
      supabase
        .from('tasks')
        .update({ status: 'completed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', taskId)
        .select()
        .single(),
      3500
    );
    if (!error && data) return data as Task;
  } catch {
    await enqueueOperation('update', 'tasks', taskId, { status: 'completed' });
  }

  return { id: taskId, status: 'completed' } as Task;
}

export async function deleteTask(taskId: string): Promise<void> {
  try {
    await withTimeout(supabase.from('tasks').delete().eq('id', taskId), 3500);
  } catch {
    await enqueueOperation('delete', 'tasks', taskId, {});
  }
}

export async function searchTasks(userId: string, query: string): Promise<Task[]> {
  try {
    const { data, error }: any = await withTimeout(
      supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .ilike('title', `%${query}%`)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(30),
      3500
    );
    if (!error && data) return data as Task[];
  } catch {}

  const cached = (await getLocalData<Task[]>(`tasks_${userId}`)) ?? [];
  return cached.filter((t) => t.title.toLowerCase().includes(query.toLowerCase()));
}

export async function createSubtask(taskId: string, title: string): Promise<Subtask> {
  const subtask: Subtask = {
    id: `sub_${Date.now()}`,
    task_id: taskId,
    title,
    completed: false,
    position: 0,
    created_at: new Date().toISOString(),
  };

  try {
    const { data: ex }: any = await supabase
      .from('task_subtasks')
      .select('position')
      .eq('task_id', taskId)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const { data, error }: any = await withTimeout(
      supabase.from('task_subtasks').insert({ task_id: taskId, title, completed: false, position: (ex?.position ?? -1) + 1 }).select().single(),
      3500
    );
    if (!error && data) return data as Subtask;
  } catch {}

  return subtask;
}

export async function toggleSubtask(id: string, completed: boolean): Promise<Subtask> {
  try {
    const { data, error }: any = await withTimeout(
      supabase.from('task_subtasks').update({ completed }).eq('id', id).select().single(),
      3500
    );
    if (!error && data) return data as Subtask;
  } catch {}

  return { id, completed } as Subtask;
}

export async function deleteSubtask(id: string): Promise<void> {
  try {
    await withTimeout(supabase.from('task_subtasks').delete().eq('id', id), 3500);
  } catch {}
}
