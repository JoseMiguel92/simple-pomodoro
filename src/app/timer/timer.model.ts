/** Types and constants shared by the pure timer logic and its persistence. */

export type Phase = 'focus' | 'break';

/** Full timer state. While running, `endsAt` is the source of truth. */
export interface TimerState {
  phase: Phase;
  focusMinutes: number;
  breakMinutes: number;
  running: boolean;
  /** Epoch ms when the current phase ends; only meaningful while running. */
  endsAt: number | null;
  /** Milliseconds left; source of truth while stopped or paused. */
  remainingMs: number;
}

/** Data kept between visits (times per phase, never an absolute instant). */
export interface StoredState {
  focusMinutes: number;
  breakMinutes: number;
  phase: Phase;
}

export const DEFAULT_FOCUS_MINUTES = 25;
export const DEFAULT_BREAK_MINUTES = 5;
export const MIN_MINUTES = 1;
export const MAX_MINUTES = 60;
export const MINUTE_MS = 60_000;
export const STORAGE_KEY = 'pomodoro.state.v1';
