import { Audio } from 'expo-av';
import { useSoundStore } from '../../stores/soundStore';
import type { SoundscapeType } from '../../stores/focusStore';

const SOUND_ASSETS: Record<string, any> = {
  click: require('../../../assets/sounds/click.wav'),
  success: require('../../../assets/sounds/success.wav'),
  bell: require('../../../assets/sounds/bell.wav'),
  cosmic: require('../../../assets/sounds/cosmic.wav'),
  rain: require('../../../assets/sounds/rain.wav'),
  forest: require('../../../assets/sounds/forest.wav'),
  lofi: require('../../../assets/sounds/lofi.wav'),
};

let currentSoundscapeObj: Audio.Sound | null = null;
let activeSoundscapeType: SoundscapeType = 'none';

/**
 * Configure global audio mode for ambient background playback.
 */
export async function initializeAudio(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  } catch (e) {
    console.warn('[Audio] Failed to set audio mode:', e);
  }
}

/**
 * Plays an ambient looping soundscape for Focus sessions.
 */
export async function playSoundscape(type: SoundscapeType): Promise<void> {
  // If already playing this type, do nothing
  if (type === activeSoundscapeType) return;

  // Stop & unload existing soundscape
  if (currentSoundscapeObj) {
    try {
      await currentSoundscapeObj.stopAsync();
      await currentSoundscapeObj.unloadAsync();
    } catch {}
    currentSoundscapeObj = null;
    activeSoundscapeType = 'none';
  }

  if (type === 'none') return;

  const asset = SOUND_ASSETS[type];
  if (!asset) return;

  try {
    await initializeAudio();
    const { sound } = await Audio.Sound.createAsync(
      asset,
      { shouldPlay: true, isLooping: true, volume: 0.85 }
    );
    currentSoundscapeObj = sound;
    activeSoundscapeType = type;
  } catch (e) {
    console.warn('[Audio] Failed to play soundscape:', e);
  }
}

/**
 * Stops any actively playing focus soundscape.
 */
export async function stopSoundscape(): Promise<void> {
  if (currentSoundscapeObj) {
    try {
      await currentSoundscapeObj.stopAsync();
      await currentSoundscapeObj.unloadAsync();
    } catch {}
    currentSoundscapeObj = null;
    activeSoundscapeType = 'none';
  }
}

/**
 * Plays short tactile audio cues (click, chime, completion).
 */
export async function playTactileCue(cue: 'click' | 'success' | 'bell'): Promise<void> {
  const soundEnabled = useSoundStore.getState().soundEnabled;
  if (!soundEnabled) return;

  const asset = SOUND_ASSETS[cue];
  if (!asset) return;

  try {
    const { sound } = await Audio.Sound.createAsync(
      asset,
      { shouldPlay: true, isLooping: false, volume: 0.6 }
    );
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
      }
    });
  } catch {}
}
