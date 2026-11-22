import {
  getActivityLevel,
  generateContributionMatrix,
  ActivityRecord,
} from '../../src/lib/analytics/matrixCalculations';
import { format, subDays } from 'date-fns';

describe('Contribution Matrix Calculations', () => {
  it('assigns correct activity levels based on counts', () => {
    expect(getActivityLevel(0)).toBe(0);
    expect(getActivityLevel(1)).toBe(1);
    expect(getActivityLevel(2)).toBe(1);
    expect(getActivityLevel(3)).toBe(2);
    expect(getActivityLevel(5)).toBe(3);
    expect(getActivityLevel(8)).toBe(4);
  });

  it('generates a valid weekly matrix from activity records', () => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');

    const activities: ActivityRecord[] = [
      { date: todayStr, type: 'task' },
      { date: todayStr, type: 'habit' },
      { date: todayStr, type: 'focus' },
      { date: yesterdayStr, type: 'task' },
    ];

    const weeks = generateContributionMatrix(28, activities);
    expect(weeks.length).toBeGreaterThan(0);

    // Flatten days
    const allDays = weeks.flat();
    const todayContribution = allDays.find((d) => d.date === todayStr);
    expect(todayContribution).toBeDefined();
    expect(todayContribution?.count).toBe(3);
    expect(todayContribution?.level).toBe(2);

    const yesterdayContribution = allDays.find((d) => d.date === yesterdayStr);
    expect(yesterdayContribution).toBeDefined();
    expect(yesterdayContribution?.count).toBe(1);
    expect(yesterdayContribution?.level).toBe(1);
  });
});
