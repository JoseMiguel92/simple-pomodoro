import { Injectable } from '@angular/core';
import { STORAGE_KEY, StoredState, TimerState } from './timer.model';
import { parseStoredState, toStored } from './timer-storage';

/**
 * Thin wrapper around `localStorage`. All browser-storage access stays in here,
 * so the timer logic never sees the DOM and any failure (private mode, quota)
 * degrades to "nothing remembered" instead of breaking the countdown.
 */
@Injectable({ providedIn: 'root' })
export class TimerStorageService {
  /** Reads the stored state; unreadable data falls back to the defaults (CA-8.3). */
  load(): StoredState {
    return parseStoredState(this.readRaw());
  }

  /** Persists times and phase — never the ticking instant (RF-8). */
  save(state: TimerState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStored(state)));
    } catch {
      // Private mode or quota exceeded: persistence is a nicety, not a condition.
    }
  }

  private readRaw(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }
}
