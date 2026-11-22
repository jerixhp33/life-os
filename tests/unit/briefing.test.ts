import {
  generateMorningBriefing,
  generateEveningReflection,
} from '../../src/lib/intelligence/proactiveBriefing';
import { detectUpcomingMeetingPrep } from '../../src/lib/intelligence/meetingPrep';
import type { Task, CalendarEvent, Habit, HabitLog } from '../../src/types';

describe('Proactive Intelligence & Briefing', () => {
  const mockTasks: Task[] = [
    {
      id: 't-1',
      user_id: 'u-1',
      title: 'Review Quarterly Financials',
      status: 'pending',
      priority: 'urgent',
      tags: ['finance'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 't-2',
      user_id: 'u-1',
      title: 'Call Marketing Lead',
      status: 'completed',
      priority: 'medium',
      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const futureMeeting: CalendarEvent = {
    id: 'e-1',
    user_id: 'u-1',
    title: 'Product Sync & Design Critique',
    start_at: new Date(Date.now() + 25 * 60 * 1000).toISOString(), // 25 min from now
    end_at: new Date(Date.now() + 55 * 60 * 1000).toISOString(),
    all_day: false,
    color: '#38BDF8',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockHabits: Habit[] = [
    {
      id: 'h-1',
      user_id: 'u-1',
      title: 'Drink 2L Water',
      frequency: 'daily',
      target_days: [1, 2, 3, 4, 5, 6, 7],
      streak_count: 5,
      best_streak: 10,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  it('generates a contextual morning briefing', () => {
    const briefing = generateMorningBriefing('Alex', mockTasks, [futureMeeting], mockHabits, []);
    expect(briefing.greeting).toContain('Alex');
    expect(briefing.topTask?.id).toBe('t-1');
    expect(briefing.topTask?.priority).toBe('urgent');
    expect(briefing.nextEvent?.id).toBe('e-1');
    expect(briefing.pendingHabitsCount).toBe(1);
    expect(briefing.readinessScore).toBeGreaterThanOrEqual(50);
  });

  it('generates an evening reflection with completed stats', () => {
    const reflection = generateEveningReflection(mockTasks, mockHabits, [
      { id: 'l-1', habit_id: 'h-1', logged_at: new Date().toISOString() },
    ]);
    expect(reflection.completedTasksCount).toBe(1);
    expect(reflection.completedHabitsCount).toBe(1);
    expect(reflection.unloggedHabitsCount).toBe(0);
    expect(reflection.summaryMessage).toContain('Great progress!');
  });

  it('detects upcoming meeting within 60 minutes and outputs prep checklist', () => {
    const alert = detectUpcomingMeetingPrep([futureMeeting]);
    expect(alert).not.toBeNull();
    expect(alert?.event.id).toBe('e-1');
    expect(alert?.minutesUntil).toBeLessThanOrEqual(30);
    expect(alert?.checklist.length).toBeGreaterThan(0);
  });

  it('ignores all-day events or distant meetings for meeting prep', () => {
    const farMeeting: CalendarEvent = {
      id: 'e-2',
      user_id: 'u-1',
      title: 'Next Week Planning',
      start_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      end_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      all_day: false,
      color: '#38BDF8',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const alert = detectUpcomingMeetingPrep([farMeeting]);
    expect(alert).toBeNull();
  });
});
