import { describe, expect, it } from 'vitest';
import {
  advance,
  createState,
  formatTime,
  parseMinutes,
  pause,
  progress,
  remainingMs,
  reset,
  setMinutes,
  start,
} from './timer.logic';
import { MINUTE_MS, TimerState } from './timer.model';

const NOW = 1_700_000_000_000;
const FOCUS_MS = 25 * MINUTE_MS;
const BREAK_MS = 5 * MINUTE_MS;

function runningState(overrides: Partial<TimerState> = {}): TimerState {
  return { ...createState(), running: true, endsAt: NOW + FOCUS_MS, ...overrides };
}

describe('createState', () => {
  it('builds the default 25/5 focus state, stopped', () => {
    const state = createState();

    expect(state).toEqual({
      phase: 'focus',
      focusMinutes: 25,
      breakMinutes: 5,
      running: false,
      endsAt: null,
      remainingMs: FOCUS_MS,
    });
  });

  it('accepts custom minutes and phase', () => {
    const state = createState(50, 10, 'break');

    expect(state.remainingMs).toBe(10 * MINUTE_MS);
    expect(state.phase).toBe('break');
  });
});

describe('remainingMs', () => {
  it('derives the value from the absolute clock while running', () => {
    expect(remainingMs(runningState(), NOW + 1_000)).toBe(FOCUS_MS - 1_000);
  });

  it('never goes below zero', () => {
    expect(remainingMs(runningState(), NOW + FOCUS_MS + 5_000)).toBe(0);
  });

  it('returns the stored value while stopped', () => {
    expect(remainingMs(createState(), NOW)).toBe(FOCUS_MS);
  });
});

describe('progress', () => {
  it('is 0 when the phase starts and 1 when it ends', () => {
    expect(progress(runningState(), NOW)).toBe(0);
    expect(progress(runningState(), NOW + FOCUS_MS)).toBe(1);
  });

  it('is 0.5 at half of the phase', () => {
    expect(progress(runningState(), NOW + FOCUS_MS / 2)).toBe(0.5);
  });

  it('is clamped between 0 and 1', () => {
    expect(progress(runningState(), NOW - FOCUS_MS)).toBe(0);
    expect(progress(runningState(), NOW + FOCUS_MS * 2)).toBe(1);
  });

  it('stays at 0 for a phase with no duration', () => {
    expect(progress(createState(0, 0), NOW)).toBe(0);
  });
});

describe('advance', () => {
  it('does nothing while there is time left', () => {
    const state = runningState();
    const result = advance(state, NOW + FOCUS_MS - 1);

    expect(result.transitioned).toBe(false);
    expect(result.state).toBe(state);
  });

  it('does nothing when the timer is stopped', () => {
    const result = advance(createState(), NOW + FOCUS_MS);

    expect(result.transitioned).toBe(false);
  });

  it('advances exactly at 0 ms left', () => {
    const result = advance(runningState(), NOW + FOCUS_MS);

    expect(result.transitioned).toBe(true);
    expect(result.state.phase).toBe('break');
    expect(result.state.remainingMs).toBe(BREAK_MS);
    expect(result.state.running).toBe(true);
  });

  it('chains back to focus when the break ends', () => {
    const state = runningState({ phase: 'break', endsAt: NOW + BREAK_MS });
    const result = advance(state, NOW + BREAK_MS);

    expect(result.state.phase).toBe('focus');
    expect(result.state.remainingMs).toBe(FOCUS_MS);
  });

  it('jumps several phases and reports a single transition (CL-8)', () => {
    const focusAndBreak = FOCUS_MS + BREAK_MS;
    const result = advance(runningState(), NOW + focusAndBreak + 1_000);

    expect(result.transitioned).toBe(true);
    expect(result.state.phase).toBe('focus');
    expect(result.state.remainingMs).toBe(FOCUS_MS - 1_000);
    expect(result.state.running).toBe(true);
  });

  it('lands on the phase that contains now after a long jump', () => {
    // focus 25 + break 5 + focus 25 + 2 min into the next break -> phase break
    const result = advance(runningState(), NOW + FOCUS_MS + BREAK_MS + FOCUS_MS + 2 * MINUTE_MS);

    expect(result.state.phase).toBe('break');
    expect(result.state.remainingMs).toBe(BREAK_MS - 2 * MINUTE_MS);
  });
});

describe('start, pause and reset', () => {
  it('starts from the remaining time and sets the end instant', () => {
    const state = start(createState(), NOW);

    expect(state.running).toBe(true);
    expect(state.endsAt).toBe(NOW + FOCUS_MS);
  });

  it('resumes without restarting the phase (CA-2.2)', () => {
    const paused = pause(runningState(), NOW + 10_000);

    expect(paused.remainingMs).toBe(FOCUS_MS - 10_000);
    expect(start(paused, NOW + 60_000).endsAt).toBe(NOW + 60_000 + FOCUS_MS - 10_000);
  });

  it('pauses conserving the time left', () => {
    const paused = pause(runningState(), NOW + 2_000);

    expect(paused.running).toBe(false);
    expect(paused.endsAt).toBeNull();
    expect(paused.remainingMs).toBe(FOCUS_MS - 2_000);
  });

  it('reset restores the current phase full time without changing phase', () => {
    const stopped = reset(runningState({ phase: 'break', endsAt: NOW + BREAK_MS }));

    expect(stopped.phase).toBe('break');
    expect(stopped.running).toBe(false);
    expect(stopped.remainingMs).toBe(BREAK_MS);
  });

  it('CL-1: when time reaches zero the transition wins over pause', () => {
    const result = advance(runningState(), NOW + FOCUS_MS);

    // The caller honours the transition and skips the user action.
    const after = result.transitioned ? result.state : pause(result.state, NOW + FOCUS_MS);

    expect(after.phase).toBe('break');
    expect(after.remainingMs).toBe(BREAK_MS);
    expect(after.running).toBe(true);
  });
});

describe('setMinutes', () => {
  it('edits the current phase, stops the timer and shows the new time (CA-7.5)', () => {
    const updated = setMinutes(runningState(), 'focus', 50);

    expect(updated.focusMinutes).toBe(50);
    expect(updated.running).toBe(false);
    expect(updated.endsAt).toBeNull();
    expect(updated.remainingMs).toBe(50 * MINUTE_MS);
  });

  it('edits the current phase while paused too (CL-4)', () => {
    const updated = setMinutes(pause(runningState(), NOW + 60_000), 'focus', 1);

    expect(updated.remainingMs).toBe(MINUTE_MS);
    expect(updated.running).toBe(false);
  });

  it('edits the other phase without touching the current countdown', () => {
    const state = runningState();
    const updated = setMinutes(state, 'break', 10);

    expect(updated.breakMinutes).toBe(10);
    expect(updated.remainingMs).toBe(state.remainingMs);
    expect(updated.running).toBe(true);
  });
});

describe('formatTime', () => {
  it('formats minutes and seconds as MM:SS', () => {
    expect(formatTime(FOCUS_MS)).toBe('25:00');
    expect(formatTime(61_000)).toBe('01:01');
    expect(formatTime(MINUTE_MS)).toBe('01:00');
  });

  it('rounds the last second up and floors at 00:00', () => {
    expect(formatTime(999)).toBe('00:01');
    expect(formatTime(1_500)).toBe('00:02');
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(-5_000)).toBe('00:00');
  });
});

describe('parseMinutes', () => {
  it('accepts whole values inside 1..60', () => {
    expect(parseMinutes('1')).toBe(1);
    expect(parseMinutes('60')).toBe(60);
    expect(parseMinutes(25)).toBe(25);
    expect(parseMinutes(' 30 ')).toBe(30);
  });

  it('rejects out of range values (CL-2)', () => {
    expect(parseMinutes('0')).toBeNull();
    expect(parseMinutes('61')).toBeNull();
    expect(parseMinutes(-5)).toBeNull();
    expect(parseMinutes(0)).toBeNull();
    expect(parseMinutes(90)).toBeNull();
  });

  it('rejects decimals, empty and non numeric text (CL-2)', () => {
    expect(parseMinutes('7.5')).toBeNull();
    expect(parseMinutes(7.5)).toBeNull();
    expect(parseMinutes('')).toBeNull();
    expect(parseMinutes('   ')).toBeNull();
    expect(parseMinutes('abc')).toBeNull();
    expect(parseMinutes('12abc')).toBeNull();
  });

  it('rejects missing or non textual values', () => {
    expect(parseMinutes(null)).toBeNull();
    expect(parseMinutes(undefined)).toBeNull();
    expect(parseMinutes(Number.NaN)).toBeNull();
    expect(parseMinutes({})).toBeNull();
  });
});
