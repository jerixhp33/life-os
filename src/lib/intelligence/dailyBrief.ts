import { format, isToday, parseISO, isPast } from 'date-fns';
import type { Task, Habit, HabitLog, Transaction } from '../../types';

export interface DailyBriefInsight {
  greeting: string;
  headline: string;
  summary: string;
  bulletPoints: string[];
  suggestedAction?: {
    label: string;
    route: string;
  };
}

export function generateDailyBrief(params: {
  tasks: Task[];
  habits: Habit[];
  habitLogs: HabitLog[];
  transactions: Transaction[];
  userName?: string;
  currency?: string;
}): DailyBriefInsight {
  const { tasks, habits, habitLogs, transactions, userName = 'Friend', currency = 'INR' } = params;
  const hour = new Date().getHours();
  const isMorning = hour < 12;
  const isAfternoon = hour >= 12 && hour < 17;
  const isEvening = hour >= 17;

  const greeting = isMorning
    ? `Good morning, ${userName}`
    : isAfternoon
    ? `Good afternoon, ${userName}`
    : `Good evening, ${userName}`;

  // Task metrics
  const todayTasks = tasks.filter((t) => {
    if (!t.due_date) return false;
    try {
      return isToday(parseISO(t.due_date));
    } catch {
      return false;
    }
  });

  const pendingTasks = todayTasks.filter((t) => t.status !== 'completed');
  const doneTasks = todayTasks.filter((t) => t.status === 'completed');
  const urgentTasks = pendingTasks.filter((t) => t.priority === 'urgent' || t.priority === 'high');

  // Habit metrics
  const todayHabits = habits.filter((h) => h.is_active);
  const doneHabits = todayHabits.filter((h) =>
    habitLogs.some((l) => l.habit_id === h.id && l.count >= h.target_count)
  );

  // Financial metrics
  const todayExpenses = transactions
    .filter((tx) => tx.type === 'expense' && isToday(parseISO(tx.date)))
    .reduce((s, tx) => s + tx.amount, 0);

  const bulletPoints: string[] = [];

  if (isMorning) {
    if (urgentTasks.length > 0) {
      bulletPoints.push(`${urgentTasks.length} high-priority tasks scheduled today, starting with "${urgentTasks[0].title}".`);
    } else if (pendingTasks.length > 0) {
      bulletPoints.push(`${pendingTasks.length} tasks planned for today.`);
    } else {
      bulletPoints.push('Clear agenda today. Great time for deep learning or backlog reviews.');
    }

    if (todayHabits.length > 0) {
      bulletPoints.push(`${todayHabits.length} daily habits lined up. Complete early to lock in your streaks.`);
    }

    return {
      greeting,
      headline: urgentTasks.length > 0 ? 'High Focus Required' : 'Ready For A Productive Day',
      summary: `You have ${pendingTasks.length} pending tasks and ${todayHabits.length} habits today.`,
      bulletPoints,
      suggestedAction: pendingTasks.length > 0 ? { label: 'Start First Task', route: '/tasks' } : undefined,
    };
  } else if (isAfternoon) {
    bulletPoints.push(`${doneTasks.length} of ${todayTasks.length} tasks completed so far.`);
    if (pendingTasks.length > 0) {
      bulletPoints.push(`${pendingTasks.length} tasks remaining before evening.`);
    }
    if (todayExpenses > 0) {
      bulletPoints.push(`Today's recorded spending is ${currency} ${todayExpenses.toLocaleString()}.`);
    }

    return {
      greeting,
      headline: 'Midday Progress Check',
      summary: `Steady velocity: ${doneTasks.length} tasks completed today.`,
      bulletPoints,
      suggestedAction: { label: 'View Tasks', route: '/tasks' },
    };
  } else {
    // Evening Retrospective
    const completionPct = todayTasks.length > 0 ? Math.round((doneTasks.length / todayTasks.length) * 100) : 100;
    bulletPoints.push(`${doneTasks.length} tasks accomplished (${completionPct}% completion rate).`);
    bulletPoints.push(`${doneHabits.length} of ${todayHabits.length} habits maintained.`);
    if (pendingTasks.length > 0) {
      bulletPoints.push(`${pendingTasks.length} unfinished tasks can be rescheduled smoothly to tomorrow.`);
    }

    return {
      greeting,
      headline: completionPct >= 70 ? 'Strong Daily Velocity' : 'Evening Wind-down',
      summary: `Day retrospective: ${doneTasks.length} tasks finished and ${doneHabits.length} habits locked in.`,
      bulletPoints,
      suggestedAction: pendingTasks.length > 0 ? { label: 'Review Schedule', route: '/tasks' } : undefined,
    };
  }
}
