import type { CalendarEvent } from '../../types';

export interface MeetingPrepAlert {
  event: CalendarEvent;
  minutesUntil: number;
  urgency: 'imminent' | 'upcoming';
  checklist: string[];
}

/**
 * Checks for upcoming meetings within the next 60 minutes and generates prep guidance.
 */
export function detectUpcomingMeetingPrep(
  events: CalendarEvent[] = [],
  currentTime: Date = new Date()
): MeetingPrepAlert | null {
  const currentMs = currentTime.getTime();

  for (const ev of events) {
    if (ev.all_day) continue;
    const startMs = new Date(ev.start_at).getTime();
    const diffMinutes = Math.round((startMs - currentMs) / (1000 * 60));

    if (diffMinutes > 0 && diffMinutes <= 60) {
      const urgency = diffMinutes <= 15 ? 'imminent' : 'upcoming';
      const checklist = [
        'Review meeting objectives & notes',
        'Verify camera & microphone setup',
        'Silence distracting notifications',
      ];

      return {
        event: ev,
        minutesUntil: diffMinutes,
        urgency,
        checklist,
      };
    }
  }

  return null;
}
