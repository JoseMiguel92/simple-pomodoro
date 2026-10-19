import { describe, expect, it } from 'vitest';
import { createState } from './timer.logic';
import { parseStoredState, toStored } from './timer-storage';

describe('toStored', () => {
  it('keeps only the persistable fields', () => {
    const stored = toStored({ ...createState(30, 8, 'break'), running: true });

    expect(stored).toEqual({ focusMinutes: 30, breakMinutes: 8, phase: 'break' });
  });
});

describe('parseStoredState', () => {
  it('reads a valid stored state', () => {
    const stored = parseStoredState('{"focusMinutes":50,"breakMinutes":10,"phase":"break"}');

    expect(stored).toEqual({ focusMinutes: 50, breakMinutes: 10, phase: 'break' });
  });

  it('accepts an object as well as its JSON text', () => {
    expect(parseStoredState({ focusMinutes: 1, breakMinutes: 60, phase: 'focus' })).toEqual({
      focusMinutes: 1,
      breakMinutes: 60,
      phase: 'focus',
    });
  });

  it('falls back to 25/5 when there is nothing stored', () => {
    expect(parseStoredState(null)).toEqual({ focusMinutes: 25, breakMinutes: 5, phase: 'focus' });
    expect(parseStoredState(undefined)).toEqual({
      focusMinutes: 25,
      breakMinutes: 5,
      phase: 'focus',
    });
  });

  it('falls back to 25/5 when the stored value is corrupt', () => {
    expect(parseStoredState('not json')).toEqual({
      focusMinutes: 25,
      breakMinutes: 5,
      phase: 'focus',
    });
    expect(parseStoredState('42')).toEqual({ focusMinutes: 25, breakMinutes: 5, phase: 'focus' });
    expect(parseStoredState('{}')).toEqual({ focusMinutes: 25, breakMinutes: 5, phase: 'focus' });
  });

  it('falls back per field when a value is out of range (CA-8.3)', () => {
    const stored = parseStoredState('{"focusMinutes":0,"breakMinutes":61,"phase":"focus"}');

    expect(stored).toEqual({ focusMinutes: 25, breakMinutes: 5, phase: 'focus' });
  });

  it('falls back per field when a value is not a whole number', () => {
    const stored = parseStoredState({ focusMinutes: 7.5, breakMinutes: '10', phase: 'break' });

    expect(stored).toEqual({ focusMinutes: 25, breakMinutes: 5, phase: 'break' });
  });

  it('keeps a valid phase while the times are corrupt (CA-8.3)', () => {
    const stored = parseStoredState('{"focusMinutes":"x","breakMinutes":null,"phase":"break"}');

    expect(stored).toEqual({ focusMinutes: 25, breakMinutes: 5, phase: 'break' });
  });

  it('defaults the phase to focus when it is not valid', () => {
    const stored = parseStoredState('{"focusMinutes":30,"breakMinutes":10,"phase":"other"}');

    expect(stored).toEqual({ focusMinutes: 30, breakMinutes: 10, phase: 'focus' });
  });
});
