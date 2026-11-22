import type { Task, CalendarEvent, Habit, HabitLog } from '../../types';

export interface MorningBriefing {
  greeting: string;
  topTask: Task | null;
  nextEvent: CalendarEvent | null;
  pendingHabitsCount: number;
  readinessScore: number;
}

export interface EveningReflection {
  completedTasksCount: number;
  totalTasksCount: number;
  completedHabitsCount: number;
  unloggedHabitsCount: number;
  summaryMessage: string;
}

/**
 * Builds a structured, proactive morning briefing from authentic user state.
 */
export function generateMorningBriefing(
  name: string,
  tasks: Task[] = [],
  events: CalendarEvent[] = [],
  habits: Habit[] = [],
  habitLogs: HabitLog[] = []
): MorningBriefing {
  const pendingTasks = tasks.filter((t) => t.status !== 'completed');
  const topTask =
    pendingTasks.find((t) => t.priority === 'urgent') ||
    pendingTasks.find((t) => t.priority === 'high') ||
    pendingTasks[0] ||
    null;

  const now = new Date();
  const upcomingEvents = events
    .filter((e) => new Date(e.start_at).getTime() >= now.getTime())
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  const nextEvent = upcomingEvents[0] || null;

  const loggedHabitIds = new Set(habitLogs.map((l) => l.habit_id));
  const pendingHabits = habits.filter((h) => !loggedHabitIds.has(h.id));

  // Readiness score (0-100)
  let score = 100;
  if (pendingTasks.length > 5) score -= 15;
  if (pendingHabits.length > 3) score -= 10;
  const readinessScore = Math.max(50, Math.min(100, score));

  const greeting = `Good morning, ${name}. You have ${pendingTasks.length} pending ${
    pendingTasks.length === 1 ? 'task' : 'tasks'
  } and ${upcomingEvents.length} scheduled ${upcomingEvents.length === 1 ? 'event' : 'events'} today.`;

  return {
    greeting,
    topTask,
    nextEvent,
    pendingHabitsCount: pendingHabits.length,
    readinessScore,
  };
}

/**
 * Builds an evening productivity reflection summary.
 */
export function generateEveningReflection(
  tasks: Task[] = [],
  habits: Habit[] = [],
  habitLogs: HabitLog[] = []
): EveningReflection {
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const loggedHabitIds = new Set(habitLogs.map((l) => l.habit_id));
  const completedHabits = habits.filter((h) => loggedHabitIds.has(h.id));
  const unloggedHabits = habits.filter((h) => !loggedHabitIds.has(h.id));

  const summaryMessage =
    completedTasks.length > 0 || completedHabits.length > 0
      ? `Great progress! You finished ${completedTasks.length} ${
          completedTasks.length === 1 ? 'task' : 'tasks'
        } and kept ${completedHabits.length} ${
          completedHabits.length === 1 ? 'habit' : 'habits'
        } alive today.`
      : 'A quiet day. Tomorrow is a fresh opportunity to build momentum!';

  return {
    completedTasksCount: completedTasks.length,
    totalTasksCount: tasks.length,
    completedHabitsCount: completedHabits.length,
    unloggedHabitsCount: unloggedHabits.length,
    summaryMessage,
  };
}
