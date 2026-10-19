import {
  DEFAULT_BREAK_MINUTES,
  DEFAULT_FOCUS_MINUTES,
  MAX_MINUTES,
  MIN_MINUTES,
  StoredState,
  TimerState,
} from './timer.model';

/** Extracts the persistable fields from a timer state. */
export function toStored(state: TimerState): StoredState {
  return {
    focusMinutes: state.focusMinutes,
    breakMinutes: state.breakMinutes,
    phase: state.phase,
  };
}

/**
 * Validates a stored value field by field; each invalid one falls back to its
 * default, keeping the phase when it is valid (CA-8.3).
 */
export function parseStoredState(raw: unknown): StoredState {
  const record = toRecord(raw);
  return {
    focusMinutes: readMinutes(record, 'focusMinutes', DEFAULT_FOCUS_MINUTES),
    breakMinutes: readMinutes(record, 'breakMinutes', DEFAULT_BREAK_MINUTES),
    phase: record?.['phase'] === 'break' ? 'break' : 'focus',
  };
}

function readMinutes(
  record: Record<string, unknown> | null,
  key: string,
  fallback: number,
): number {
  const value = record?.[key];
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    return fallback;
  }
  return value >= MIN_MINUTES && value <= MAX_MINUTES ? value : fallback;
}

function toRecord(raw: unknown): Record<string, unknown> | null {
  let value = raw;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}
