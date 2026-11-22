import { create } from 'zustand';

export type FocusStatus = 'idle' | 'running' | 'paused' | 'break';
export type FocusMode = 'pomodoro' | 'short_break' | 'long_break';
export type SoundscapeType = 'none' | 'cosmic' | 'rain' | 'forest' | 'lofi';

export interface FocusState {
  status: FocusStatus;
  mode: FocusMode;
  timeLeft: number; // in seconds
  duration: number; // in seconds
  activeTaskId: string | null;
  activeTaskTitle: string | null;
  soundscape: SoundscapeType;
  completedSessions: number;

  // Actions
  start: (task?: { id: string; title: string }, customMinutes?: number) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  tick: () => void;
  setMode: (mode: FocusMode) => void;
  setSoundscape: (soundscape: SoundscapeType) => void;
}

const DEFAULT_POMODORO_SECONDS = 25 * 60;
const DEFAULT_SHORT_BREAK_SECONDS = 5 * 60;
const DEFAULT_LONG_BREAK_SECONDS = 15 * 60;

export const useFocusStore = create<FocusState>((set, get) => ({
  status: 'idle',
  mode: 'pomodoro',
  timeLeft: DEFAULT_POMODORO_SECONDS,
  duration: DEFAULT_POMODORO_SECONDS,
  activeTaskId: null,
  activeTaskTitle: null,
  soundscape: 'none',
  completedSessions: 0,

  start: (task, customMinutes) => {
    const duration = (customMinutes ?? 25) * 60;
    set({
      status: 'running',
      mode: 'pomodoro',
      timeLeft: duration,
      duration,
      activeTaskId: task?.id ?? null,
      activeTaskTitle: task?.title ?? null,
    });
  },

  pause: () => {
    if (get().status === 'running') {
      set({ status: 'paused' });
    }
  },

  resume: () => {
    if (get().status === 'paused') {
      set({ status: 'running' });
    }
  },

  reset: () => {
    const isBreak = get().mode !== 'pomodoro';
    const duration = isBreak ? DEFAULT_SHORT_BREAK_SECONDS : DEFAULT_POMODORO_SECONDS;
    set({
      status: 'idle',
      timeLeft: duration,
      duration,
      activeTaskId: null,
      activeTaskTitle: null,
    });
  },

  tick: () => {
    const current = get();
    if (current.status !== 'running') return;

    if (current.timeLeft <= 1) {
      if (current.mode === 'pomodoro') {
        // Complete pomodoro, switch to break
        set((s) => ({
          status: 'break',
          mode: 'short_break',
          timeLeft: DEFAULT_SHORT_BREAK_SECONDS,
          duration: DEFAULT_SHORT_BREAK_SECONDS,
          completedSessions: s.completedSessions + 1,
        }));
      } else {
        // Break ended, back to idle
        set({
          status: 'idle',
          mode: 'pomodoro',
          timeLeft: DEFAULT_POMODORO_SECONDS,
          duration: DEFAULT_POMODORO_SECONDS,
        });
      }
    } else {
      set((s) => ({ timeLeft: s.timeLeft - 1 }));
    }
  },

  setMode: (mode) => {
    let duration = DEFAULT_POMODORO_SECONDS;
    if (mode === 'short_break') duration = DEFAULT_SHORT_BREAK_SECONDS;
    if (mode === 'long_break') duration = DEFAULT_LONG_BREAK_SECONDS;
    set({
      mode,
      duration,
      timeLeft: duration,
      status: 'idle',
    });
  },

  setSoundscape: (soundscape) => set({ soundscape }),
}));
