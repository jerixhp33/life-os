import { format, subDays, eachDayOfInterval, parseISO } from 'date-fns';

export interface DayContribution {
  date: string; // yyyy-MM-dd
  dayOfWeek: number; // 0 (Sun) to 6 (Sat)
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ActivityRecord {
  date: string; // yyyy-MM-dd or ISO string
  type: 'task' | 'habit' | 'focus';
}

export function getActivityLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 6) return 3;
  return 4;
}

/**
 * Generates an array of weeks for the contribution matrix (e.g. past N days).
 * Returns columns of weeks, each containing 7 days (Sun through Sat).
 */
export function generateContributionMatrix(
  daysCount = 112, // 16 weeks * 7 days
  activities: ActivityRecord[] = []
): DayContribution[][] {
  const today = new Date();
  const startDate = subDays(today, daysCount - 1);

  // Index activities by yyyy-MM-dd
  const countByDate = new Map<string, number>();
  for (const act of activities) {
    const key = act.date.slice(0, 10);
    countByDate.set(key, (countByDate.get(key) ?? 0) + 1);
  }

  const intervalDays = eachDayOfInterval({ start: startDate, end: today });
  const weeks: DayContribution[][] = [];
  let currentWeek: DayContribution[] = [];

  for (const day of intervalDays) {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayOfWeek = day.getDay();
    const count = countByDate.get(dateStr) ?? 0;
    const level = getActivityLevel(count);

    currentWeek.push({
      date: dateStr,
      dayOfWeek,
      count,
      level,
    });

    if (dayOfWeek === 6 || day.getTime() === today.getTime()) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks;
}
