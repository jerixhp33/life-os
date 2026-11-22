import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
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

let currentPlayer: AudioPlayer | null = null;
let activeSoundscapeType: SoundscapeType = 'none';

/**
 * Plays an ambient looping soundscape for Focus sessions.
 */
export async function playSoundscape(type: SoundscapeType): Promise<void> {
  if (type === activeSoundscapeType) return;

  if (currentPlayer) {
    try {
      currentPlayer.pause();
      currentPlayer.remove();
    } catch {}
    currentPlayer = null;
    activeSoundscapeType = 'none';
  }

  if (type === 'none') return;

  const asset = SOUND_ASSETS[type];
  if (!asset) return;

  try {
    const player = createAudioPlayer(asset);
    player.loop = true;
    player.volume = 0.85;
    player.play();
    currentPlayer = player;
    activeSoundscapeType = type;
  } catch (e) {
    console.warn('[Audio] Failed to play soundscape:', e);
  }
}

/**
 * Stops any actively playing focus soundscape.
 */
export async function stopSoundscape(): Promise<void> {
  if (currentPlayer) {
    try {
      currentPlayer.pause();
      currentPlayer.remove();
    } catch {}
    currentPlayer = null;
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
    const player = createAudioPlayer(asset);
    player.volume = 0.6;
    player.play();
  } catch (e) {
    console.warn('[Audio] Failed to play tactile cue:', e);
  }
}
