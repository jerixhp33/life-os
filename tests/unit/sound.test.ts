import { useSoundStore } from '../../src/stores/soundStore';

describe('Sound & Haptic Preferences Store', () => {
  beforeEach(async () => {
    useSoundStore.setState({
      hapticsEnabled: true,
      hapticIntensity: 'medium',
      soundEnabled: true,
      soundProfile: 'mechanical',
      isLoaded: true,
    });
  });

  it('updates haptics and intensity settings', async () => {
    await useSoundStore.getState().setHapticsEnabled(false);
    expect(useSoundStore.getState().hapticsEnabled).toBe(false);

    await useSoundStore.getState().setHapticIntensity('heavy');
    expect(useSoundStore.getState().hapticIntensity).toBe('heavy');
  });

  it('updates sound profile and sound toggle', async () => {
    await useSoundStore.getState().setSoundProfile('zen');
    expect(useSoundStore.getState().soundProfile).toBe('zen');

    await useSoundStore.getState().setSoundEnabled(false);
    expect(useSoundStore.getState().soundEnabled).toBe(false);
  });
});
