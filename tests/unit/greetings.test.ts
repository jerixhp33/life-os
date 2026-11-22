import {
  getCircadianPhase,
  getCircadianGreeting,
  generateAdaptiveMotto,
  evaluateGreetingState,
} from '../../src/lib/intelligence/greetingEngine';
import type { Task, CalendarEvent, Habit } from '../../src/types';

describe('Circadian Greeting & Dynamic Motto Engine', () => {
  it('correctly maps hours to circadian phases', () => {
    expect(getCircadianPhase(5)).toBe('dawn');
    expect(getCircadianPhase(9)).toBe('morning');
    expect(getCircadianPhase(14)).toBe('afternoon');
    expect(getCircadianPhase(19)).toBe('evening');
    expect(getCircadianPhase(23)).toBe('night');
    expect(getCircadianPhase(2)).toBe('night');
  });

  it('generates personalized greetings per phase', () => {
    expect(getCircadianGreeting('dawn', 'Alex')).toBe('Rise & Shine, Alex');
    expect(getCircadianGreeting('morning', 'Alex')).toBe('Good Morning, Alex');
    expect(getCircadianGreeting('afternoon', 'Alex')).toBe('Good Afternoon, Alex');
    expect(getCircadianGreeting('evening', 'Alex')).toBe('Good Evening, Alex');
    expect(getCircadianGreeting('night', 'Alex')).toBe('Restful Night, Alex');
  });

  it('prioritizes imminent meetings within 45 minutes in motto', () => {
    const now = new Date();
    const meeting: CalendarEvent = {
      id: 'm-1',
      user_id: 'u-1',
      title: 'Design Critique',
      start_at: new Date(now.getTime() + 20 * 60 * 1000).toISOString(),
      end_at: new Date(now.getTime() + 50 * 60 * 1000).toISOString(),
      all_day: false,
      color: '#38BDF8',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    const motto = generateAdaptiveMotto('morning', [], [meeting], [], [], now);
    expect(motto).toContain('Design Critique');
    expect(motto).toContain('20 mins');
  });

  it('detects when all tasks are conquered', () => {
    const completedTask: Task = {
      id: 't-1',
      user_id: 'u-1',
      title: 'Ship APK Build',
      status: 'completed',
      priority: 'high',
      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const motto = generateAdaptiveMotto('afternoon', [completedTask], [], [], []);
    expect(motto).toContain('conquered today');
  });

  it('evaluates greeting state completely', () => {
    const state = evaluateGreetingState('Jordan', [], [], []);
    expect(state.greetingText).toContain('Jordan');
    expect(state.contextualSubtitle.length).toBeGreaterThan(0);
    expect(state.randomWisdom.length).toBeGreaterThan(0);
  });
});
