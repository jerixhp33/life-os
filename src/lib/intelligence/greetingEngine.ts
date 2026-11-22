import type { Task, CalendarEvent, Habit, HabitLog } from '../../types';

export type CircadianPhase = 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';

export interface GreetingState {
  phase: CircadianPhase;
  greetingText: string;
  contextualSubtitle: string;
  randomWisdom: string;
}

export const WISDOM_SNIPPETS = [
  'Focus on progress, not perfection. Every step forward counts.',
  'Simplicity is the prerequisite for reliability and deep focus.',
  'Small daily disciplines repeated consistently lead to monumental results.',
  'Your mind is for having ideas, not holding them. Capture everything.',
  'Protect your attention as your most valuable finite resource.',
  'A 25-minute block of pure unbroken focus can change your entire day.',
  'Discipline is choosing between what you want now and what you want most.',
];

/**
 * Computes the active circadian phase based on local hour (0-23).
 */
export function getCircadianPhase(hour: number): CircadianPhase {
  if (hour >= 4 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

/**
 * Returns an expressive, personalized greeting based on circadian phase and user name.
 */
export function getCircadianGreeting(phase: CircadianPhase, name: string): string {
  const cleanName = name ? `, ${name}` : '';
  switch (phase) {
    case 'dawn':
      return `Rise & Shine${cleanName}`;
    case 'morning':
      return `Good Morning${cleanName}`;
    case 'afternoon':
      return `Good Afternoon${cleanName}`;
    case 'evening':
      return `Good Evening${cleanName}`;
    case 'night':
      return `Restful Night${cleanName}`;
  }
}

/**
 * Generates an adaptive, context-aware motto based on real-time task, event, and habit state.
 */
export function generateAdaptiveMotto(
  phase: CircadianPhase,
  tasks: Task[] = [],
  events: CalendarEvent[] = [],
  habits: Habit[] = [],
  habitLogs: HabitLog[] = [],
  currentTime: Date = new Date()
): string {
  const currentMs = currentTime.getTime();

  // 1. Check for imminent meeting within 45 minutes
  const imminentMeeting = events.find((e) => {
    if (e.all_day) return false;
    const startMs = new Date(e.start_at).getTime();
    const diffMins = Math.round((startMs - currentMs) / (1000 * 60));
    return diffMins > 0 && diffMins <= 45;
  });

  if (imminentMeeting) {
    const startMs = new Date(imminentMeeting.start_at).getTime();
    const diffMins = Math.round((startMs - currentMs) / (1000 * 60));
    return `Next: "${imminentMeeting.title}" begins in ${diffMins} min${diffMins === 1 ? '' : 's'}.`;
  }

  const pendingTasks = tasks.filter((t) => t.status !== 'completed');
  const urgentTask = pendingTasks.find((t) => t.priority === 'urgent' || t.priority === 'high');

  // 2. Urgent task pending
  if (urgentTask && phase !== 'night') {
    return `Priority focus: 1 urgent task awaiting your attention.`;
  }

  // 3. All tasks completed
  if (tasks.length > 0 && pendingTasks.length === 0) {
    return `All priorities conquered today! Time to relax or learn.`;
  }

  // 4. Evening habit streak protection
  if (phase === 'evening' || phase === 'night') {
    const loggedIds = new Set(habitLogs.map((l) => l.habit_id));
    const unloggedCount = habits.filter((h) => !loggedIds.has(h.id)).length;
    if (unloggedCount > 0) {
      return `${unloggedCount} habit${unloggedCount === 1 ? '' : 's'} remaining tonight to maintain your streak.`;
    }
    return `All daily habits logged. Great consistency today!`;
  }

  // 5. Morning / Dawn default
  if (phase === 'dawn' || phase === 'morning') {
    const pendingCount = pendingTasks.length;
    if (pendingCount > 0) {
      return `${pendingCount} task${pendingCount === 1 ? '' : 's'} scheduled for today. Ready for a focus block?`;
    }
    return `A fresh start today. Set your top intentions.`;
  }

  // 6. Afternoon default
  return `Keep the momentum going. Step forward one block at a time.`;
}

/**
 * Master evaluator generating the complete dynamic greeting bundle.
 */
export function evaluateGreetingState(
  name: string,
  tasks: Task[] = [],
  events: CalendarEvent[] = [],
  habits: Habit[] = [],
  habitLogs: HabitLog[] = [],
  currentTime: Date = new Date()
): GreetingState {
  const phase = getCircadianPhase(currentTime.getHours());
  const greetingText = getCircadianGreeting(phase, name);
  const contextualSubtitle = generateAdaptiveMotto(
    phase,
    tasks,
    events,
    habits,
    habitLogs,
    currentTime
  );
  const randomWisdom = WISDOM_SNIPPETS[Math.floor(Math.random() * WISDOM_SNIPPETS.length)];

  return {
    phase,
    greetingText,
    contextualSubtitle,
    randomWisdom,
  };
}
