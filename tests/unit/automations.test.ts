import {
  handleTaskCompletionAutomations,
  evaluateExpenseBudgetImpact,
} from '../../src/lib/intelligence/flowAutomations';
import type { Task, Habit } from '../../src/types';

describe('LifeOS Autonomous Flow Automations', () => {
  const mockHabits: Habit[] = [
    {
      id: 'h-1',
      user_id: 'u-1',
      title: 'Daily Gym & Workout',
      frequency: 'daily',
      target_days: [1, 2, 3, 4, 5],
      streak_count: 5,
      best_streak: 12,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'h-2',
      user_id: 'u-1',
      title: 'Read 20 pages',
      frequency: 'daily',
      target_days: [1, 2, 3, 4, 5, 6, 7],
      streak_count: 3,
      best_streak: 7,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  it('triggers habit auto-logging when a fitness task is completed', async () => {
    const task: Task = {
      id: 't-1',
      user_id: 'u-1',
      title: 'Leg Day Gym Workout',
      status: 'completed',
      priority: 'high',
      tags: ['fitness'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const mockLogFn = jest.fn().mockResolvedValue({ id: 'log-1' });

    const results = await handleTaskCompletionAutomations(task, mockHabits, mockLogFn);

    expect(results).toHaveLength(1);
    expect(results[0].triggered).toBe(true);
    expect(results[0].message).toContain('Daily Gym & Workout');
    expect(mockLogFn).toHaveBeenCalledWith('h-1');
  });

  it('does not trigger habit logging for unrelated tasks', async () => {
    const task: Task = {
      id: 't-2',
      user_id: 'u-1',
      title: 'Prepare Board Slide Deck',
      status: 'completed',
      priority: 'urgent',
      tags: ['work', 'presentation'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const mockLogFn = jest.fn();

    const results = await handleTaskCompletionAutomations(task, mockHabits, mockLogFn);

    expect(results).toHaveLength(0);
    expect(mockLogFn).not.toHaveBeenCalled();
  });

  it('evaluates budget impact and triggers warnings above 80% and 100%', () => {
    // Under 80%
    const safeResult = evaluateExpenseBudgetImpact('Food & Dining', 500, 2000, 5000);
    expect(safeResult.isAlert).toBe(false);
    expect(safeResult.ratio).toBe(0.5);

    // 80% or more (warning threshold)
    const alert80 = evaluateExpenseBudgetImpact('Food & Dining', 2100, 2000, 5000);
    expect(alert80.isAlert).toBe(true);
    expect(alert80.message).toContain('82%');

    // 100% or more (critical threshold)
    const alert100 = evaluateExpenseBudgetImpact('Food & Dining', 3500, 2000, 5000);
    expect(alert100.isAlert).toBe(true);
    expect(alert100.message).toContain('reached 110%');
  });
});
