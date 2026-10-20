import { Injectable } from '@angular/core';
import { canPersist, ConsentChoice, parseConsent } from '../consent/consent.logic';
import {
  DEFAULT_BREAK_MINUTES,
  DEFAULT_FOCUS_MINUTES,
  STORAGE_KEY,
  StoredState,
  TimerState,
} from './timer.model';
import { parseStoredState, toStored } from './timer-storage';

/**
 * Own key for the consent choice, kept apart from the state key so that
 * wiping app data never destroys it (RF-5).
 */
export const CONSENT_KEY = 'pomodoro.consent.v1';

/**
 * Thin wrapper around `localStorage`. All browser-storage access stays in here,
 * so the timer logic never sees the DOM and any failure (private mode, quota)
 * degrades to "nothing remembered" instead of breaking the countdown.
 * Every read or write of app data passes the consent gate first (RF-2/RF-3/RF-5).
 */
@Injectable({ providedIn: 'root' })
export class TimerStorageService {
  /** Reads the stored state; without an accepted choice the defaults win (CA-2.2, CA-3.3). */
  load(): StoredState {
    if (!canPersist(this.readConsent())) {
      return {
        focusMinutes: DEFAULT_FOCUS_MINUTES,
        breakMinutes: DEFAULT_BREAK_MINUTES,
        phase: 'focus',
      };
    }
    return parseStoredState(this.readRaw(STORAGE_KEY));
  }

  /** Persists times and phase — never the ticking instant (RF-8) — only once accepted (RF-2). */
  save(state: TimerState): void {
    if (!canPersist(this.readConsent())) {
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStored(state)));
    } catch {
      // Private mode or quota exceeded: persistence is a nicety, not a condition.
    }
  }

  /** The stored choice; corrupt or unreadable values count as none (RF-7). */
  readConsent(): ConsentChoice | null {
    return parseConsent(this.readRaw(CONSENT_KEY));
  }

  /** Stores the choice; the only browser write allowed without acceptance (RF-5). */
  writeConsent(choice: ConsentChoice): void {
    try {
      localStorage.setItem(CONSENT_KEY, choice);
    } catch {
      // Nowhere to remember the choice: the popup shows again next visit (CL-7).
    }
  }

  /** Forgets the choice so the popup can show again (RF-6). */
  clearConsent(): void {
    try {
      localStorage.removeItem(CONSENT_KEY);
    } catch {
      // No storage, no choice to forget (CL-7).
    }
  }

  /** Deletes app data (state key and this origin's cookies), keeping the choice (RF-3, RF-6). */
  wipeAppData(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing stored to wipe (CL-7).
    }
    this.clearOwnCookies();
  }

  private readRaw(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  /** Expires this origin's cookies; the choice lives in its own key, untouched (CA-3.1). */
  private clearOwnCookies(): void {
    try {
      const names = document.cookie
        .split(';')
        .map((entry) => entry.split('=')[0].trim())
        .filter((name) => name.length > 0);
      for (const name of names) {
        document.cookie = `${name}=; Max-Age=0; path=/`;
      }
    } catch {
      // No DOM access: cookies are out of reach (CL-7).
    }
  }
}
