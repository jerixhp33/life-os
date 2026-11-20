import { format, subDays } from 'date-fns';
import type { Habit, HabitLog } from '../../types';

export function calculateStreak(logs: HabitLog[]): number {
  if (!logs.length) return 0;
  const dates = new Set(logs.map(l => l.date));
  let streak = 0, day = new Date();
  while (true) {
    const k = format(day, 'yyyy-MM-dd');
    if (!dates.has(k)) break;
    streak++;
    day = subDays(day, 1);
  }
  return streak;
}

export function calculateCompletionRate(logs: HabitLog[], habit: Habit, days = 7): number {
  if (!habit.days_of_week.length) return 0;
  const scheduled: Date[] = [];
  for (let i = 0; i < days; i++) {
    const d = subDays(new Date(), i);
    if (habit.days_of_week.includes(d.getDay())) scheduled.push(d);
  }
  if (!scheduled.length) return 0;
  const completed = scheduled.filter(d => {
    const k = format(d, 'yyyy-MM-dd');
    return logs.some(l => l.date === k && l.count >= habit.target_count);
  }).length;
  return Math.round((completed / scheduled.length) * 100);
}
