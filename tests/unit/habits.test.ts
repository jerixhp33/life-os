import { calculateStreak, calculateCompletionRate } from '../../src/features/habits/logic';
import { format, subDays } from 'date-fns';
import type { Habit, HabitLog } from '../../src/types';
const makeHabit = (o: Partial<Habit> = {}): Habit => ({ id:'h1', user_id:'u1', title:'Exercise', icon:'🏃', color:'#6957E8', frequency:'daily', days_of_week:[0,1,2,3,4,5,6], time_of_day:'morning', target_count:1, is_active:true, created_at:'', updated_at:'', ...o });
const makeLog  = (daysAgo: number, habitId = 'h1', count = 1): HabitLog => ({ id:`l${daysAgo}`, habit_id:habitId, user_id:'u1', date:format(subDays(new Date(), daysAgo), 'yyyy-MM-dd'), count, created_at:'' });

describe('calculateStreak', () => {
  it('returns 0 for no logs',              () => expect(calculateStreak([])).toBe(0));
  it('returns 1 for today only',           () => expect(calculateStreak([makeLog(0)])).toBe(1));
  it('returns correct consecutive streak', () => expect(calculateStreak([makeLog(0),makeLog(1),makeLog(2),makeLog(3)])).toBe(4));
  it('breaks on missing day',              () => expect(calculateStreak([makeLog(0),makeLog(2)])).toBe(1));
  it('returns 0 when gap from today',      () => expect(calculateStreak([makeLog(2),makeLog(3),makeLog(4)])).toBe(0));
  it('handles 30-day streak',              () => expect(calculateStreak(Array.from({length:30},(_,i)=>makeLog(i)))).toBe(30));
});

describe('calculateCompletionRate', () => {
  it('returns 0 for no logs',           () => expect(calculateCompletionRate([], makeHabit(), 7)).toBe(0));
  it('returns 100 when all completed',  () => { const logs=Array.from({length:7},(_,i)=>makeLog(i)); expect(calculateCompletionRate(logs,makeHabit(),7)).toBe(100); });
  it('respects target_count threshold', () => {
    const h = makeHabit({ target_count: 3 });
    expect(calculateCompletionRate([{...makeLog(0),count:2}], h, 1)).toBe(0);
    expect(calculateCompletionRate([{...makeLog(0),count:3}], h, 1)).toBe(100);
  });
});
