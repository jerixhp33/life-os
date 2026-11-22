import { useFocusStore } from '../../src/stores/focusStore';

describe('Focus Store', () => {
  beforeEach(() => {
    useFocusStore.getState().reset();
  });

  it('initializes with default 25m pomodoro state', () => {
    const s = useFocusStore.getState();
    expect(s.status).toBe('idle');
    expect(s.mode).toBe('pomodoro');
    expect(s.timeLeft).toBe(25 * 60);
    expect(s.duration).toBe(25 * 60);
  });

  it('starts focus session with task', () => {
    useFocusStore.getState().start({ id: 't1', title: 'Deep Work' }, 30);
    const s = useFocusStore.getState();
    expect(s.status).toBe('running');
    expect(s.timeLeft).toBe(30 * 60);
    expect(s.activeTaskTitle).toBe('Deep Work');
  });

  it('pauses and resumes session correctly', () => {
    useFocusStore.getState().start();
    useFocusStore.getState().pause();
    expect(useFocusStore.getState().status).toBe('paused');

    useFocusStore.getState().resume();
    expect(useFocusStore.getState().status).toBe('running');
  });

  it('ticks countdown and transitions to short break when timer ends', () => {
    useFocusStore.getState().start(undefined, 1);
    // set timeLeft to 1
    useFocusStore.setState({ timeLeft: 1 });
    useFocusStore.getState().tick();

    const s = useFocusStore.getState();
    expect(s.status).toBe('break');
    expect(s.mode).toBe('short_break');
    expect(s.timeLeft).toBe(5 * 60);
    expect(s.completedSessions).toBe(1);
  });

  it('changes mode properly', () => {
    useFocusStore.getState().setMode('long_break');
    const s = useFocusStore.getState();
    expect(s.mode).toBe('long_break');
    expect(s.timeLeft).toBe(15 * 60);
  });
});
