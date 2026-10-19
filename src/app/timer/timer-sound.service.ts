import { Injectable } from '@angular/core';

/** Beep length in ms: short and soft, never intrusive. */
export const BEEP_DURATION_MS = 150;
/** Beep frequency in Hz. */
const BEEP_FREQUENCY_HZ = 880;
/** Peak gain, low enough to stay gentle. */
const BEEP_GAIN = 0.15;

type AudioContextConstructor = new () => AudioContext;

/**
 * Phase-change beep built on the native Web Audio API (RNF-5, no dependencies).
 *
 * The context is created lazily on the first user gesture (PLAY), because
 * browsers block audio until then. If audio is unavailable, suspended or
 * rejected, every method stays silent and the notice card is shown anyway
 * (CL-6): the sound is an extra, never a condition of the flow.
 */
@Injectable({ providedIn: 'root' })
export class TimerSoundService {
  private context: AudioContext | null = null;

  /** Called on the first gesture (PLAY) so the browser lets us play later. */
  unlock(): void {
    const context = this.ensureContext();
    if (!context || context.state !== 'suspended') {
      return;
    }
    try {
      void context.resume().catch(() => undefined);
    } catch {
      // Blocked audio: nothing to do, the flow continues.
    }
  }

  /** Plays the short beep; silently does nothing when audio is unavailable. */
  beep(): void {
    const context = this.ensureContext();
    if (!context || context.state === 'suspended') {
      return;
    }
    try {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = BEEP_FREQUENCY_HZ;
      gain.gain.value = BEEP_GAIN;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + BEEP_DURATION_MS / 1000);
    } catch {
      // Whatever fails, the timer keeps running and the card is shown (CL-6).
    }
  }

  private ensureContext(): AudioContext | null {
    if (this.context) {
      return this.context;
    }
    const Constructor = resolveAudioContextConstructor();
    if (!Constructor) {
      return null;
    }
    try {
      this.context = new Constructor();
    } catch {
      return null;
    }
    return this.context;
  }
}

/** Resolves the native constructor, or `null` when the browser has none. */
function resolveAudioContextConstructor(): AudioContextConstructor | null {
  const candidate = (globalThis as { AudioContext?: AudioContextConstructor }).AudioContext;
  return typeof candidate === 'function' ? candidate : null;
}
