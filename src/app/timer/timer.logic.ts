import {
  DEFAULT_BREAK_MINUTES,
  DEFAULT_FOCUS_MINUTES,
  MAX_MINUTES,
  MIN_MINUTES,
  MINUTE_MS,
  Phase,
  TimerState,
} from './timer.model';

/** Result of a time jump: the state plus a single transition indicator (no burst). */
export interface AdvanceResult {
  state: TimerState;
  transitioned: boolean;
}

/** Builds a stopped state for the given phase, ready for PLAY. */
export function createState(
  focusMinutes: number = DEFAULT_FOCUS_MINUTES,
  breakMinutes: number = DEFAULT_BREAK_MINUTES,
  phase: Phase = 'focus',
): TimerState {
  return {
    phase,
    focusMinutes,
    breakMinutes,
    running: false,
    endsAt: null,
    remainingMs: minutesForPhase({ phase, focusMinutes, breakMinutes }) * MINUTE_MS,
  };
}

/** Milliseconds left, derived from the absolute clock while running. */
export function remainingMs(state: TimerState, now: number): number {
  if (state.running && state.endsAt !== null) {
    return Math.max(0, state.endsAt - now);
  }
  return Math.max(0, state.remainingMs);
}

/** Elapsed fraction of the current phase (0 full, 1 empty), clamped to 0..1. */
export function progress(state: TimerState, now: number): number {
  const total = minutesForPhase(state) * MINUTE_MS;
  if (total <= 0) {
    return 0;
  }
  const ratio = remainingMs(state, now) / total;
  return Math.min(1, Math.max(0, 1 - ratio));
}

/**
 * Moves to the phase that contains `now`, looping over as many phases as needed.
 * Returns one single `transitioned` flag, so callers emit at most one notice.
 */
export function advance(state: TimerState, now: number): AdvanceResult {
  if (!state.running || state.endsAt === null || now < state.endsAt) {
    return { state, transitioned: false };
  }

  let phase = state.phase;
  let endsAt = state.endsAt;
  while (now >= endsAt) {
    phase = phase === 'focus' ? 'break' : 'focus';
    endsAt += minutesForPhase({ ...state, phase }) * MINUTE_MS;
  }

  return {
    state: { ...state, phase, endsAt, remainingMs: endsAt - now },
    transitioned: true,
  };
}

/** Starts (or resumes) the countdown from the stored remaining time. */
export function start(state: TimerState, now: number): TimerState {
  return { ...state, running: true, endsAt: now + state.remainingMs };
}

/** Stops the countdown keeping the time left. */
export function pause(state: TimerState, now: number): TimerState {
  return { ...state, running: false, endsAt: null, remainingMs: remainingMs(state, now) };
}

/** Restores the current phase full time and stops, without changing phase. */
export function reset(state: TimerState): TimerState {
  return {
    ...state,
    running: false,
    endsAt: null,
    remainingMs: minutesForPhase(state) * MINUTE_MS,
  };
}

/** Sets the minutes of a phase; editing the current phase stops the timer (CA-7.5). */
export function setMinutes(state: TimerState, phase: Phase, minutes: number): TimerState {
  const updated =
    phase === 'focus' ? { ...state, focusMinutes: minutes } : { ...state, breakMinutes: minutes };

  if (phase !== updated.phase) {
    return updated;
  }
  return {
    ...updated,
    running: false,
    endsAt: null,
    remainingMs: minutesForPhase(updated) * MINUTE_MS,
  };
}

/** Formats milliseconds as `MM:SS` (rounding up so the last second is shown). */
export function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** Validates a typed value as whole minutes in 1..60; returns null when invalid. */
export function parseMinutes(value: unknown): number | null {
  const minutes = typeof value === 'number' ? value : parseNumericText(value);
  if (minutes === null || !Number.isInteger(minutes)) {
    return null;
  }
  return minutes >= MIN_MINUTES && minutes <= MAX_MINUTES ? minutes : null;
}

function minutesForPhase(
  state: Pick<TimerState, 'phase' | 'focusMinutes' | 'breakMinutes'>,
): number {
  return state.phase === 'focus' ? state.focusMinutes : state.breakMinutes;
}

function parseNumericText(value: unknown): number | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return /^\d+$/.test(trimmed) ? Number(trimmed) : null;
}
