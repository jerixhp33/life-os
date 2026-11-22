import type { Task, Habit } from '../../types';

export interface AutomationResult {
  triggered: boolean;
  message: string;
}

/**
 * Automatically logs a matching daily habit when a task tagged with health/fitness is completed.
 */
export async function handleTaskCompletionAutomations(
  completedTask: Task,
  activeHabits: Habit[],
  logHabitFn: (habitId: string) => Promise<any>
): Promise<AutomationResult[]> {
  const results: AutomationResult[] = [];
  const tags = (completedTask.tags ?? []).map((t) => t.toLowerCase());
  const titleLower = completedTask.title.toLowerCase();

  const isFitness =
    tags.includes('fitness') ||
    tags.includes('health') ||
    tags.includes('workout') ||
    tags.includes('exercise') ||
    titleLower.includes('gym') ||
    titleLower.includes('workout') ||
    titleLower.includes('running');

  if (isFitness) {
    const matchingHabit = activeHabits.find((h) => {
      const hTitle = h.title.toLowerCase();
      return (
        hTitle.includes('exercise') ||
        hTitle.includes('workout') ||
        hTitle.includes('gym') ||
        hTitle.includes('fitness') ||
        hTitle.includes('run')
      );
    });

    if (matchingHabit) {
      try {
        await logHabitFn(matchingHabit.id);
        results.push({
          triggered: true,
          message: `Flow Automation: Auto-logged "${matchingHabit.title}" habit from completed task.`,
        });
      } catch {}
    }
  }

  return results;
}

/**
 * Checks budget threshold and triggers intelligent proactive warnings when spending approaches limit.
 */
export function evaluateExpenseBudgetImpact(
  category: string,
  newAmount: number,
  existingCategoryTotal: number,
  budgetAmount?: number
): { isAlert: boolean; message?: string; ratio: number } {
  if (!budgetAmount || budgetAmount <= 0) {
    return { isAlert: false, ratio: 0 };
  }

  const projectedTotal = existingCategoryTotal + newAmount;
  const ratio = projectedTotal / budgetAmount;

  if (ratio >= 1.0) {
    return {
      isAlert: true,
      ratio,
      message: `Warning: Spending in ${category} has reached ${Math.round(ratio * 100)}% of your monthly budget limit.`,
    };
  }

  if (ratio >= 0.8) {
    return {
      isAlert: true,
      ratio,
      message: `Notice: You have used ${Math.round(ratio * 100)}% of your ${category} budget.`,
    };
  }

  return { isAlert: false, ratio };
}
