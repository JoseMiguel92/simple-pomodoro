import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { STORAGE_KEY } from './timer.model';
import { TimerService } from './timer.service';
import { TimerSoundService } from './timer-sound.service';

const FOCUS_MS = 25 * 60_000;
const BREAK_MS = 5 * 60_000;

/** Rebuilds the injector so the service reads the persisted state again (reload). */
function newService(): TimerService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({});
  return TestBed.inject(TimerService);
}

function setVisibility(state: 'visible' | 'hidden'): void {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
}

describe('TimerService', () => {
  let service: TimerService;
  let beep: Mock<() => void>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimerService);
    beep = vi.spyOn(TestBed.inject(TimerSoundService), 'beep');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts stopped on the focus phase with the default times (CA-7.1)', () => {
    expect(service.phase()).toBe('focus');
    expect(service.running()).toBe(false);
    expect(service.focusMinutes()).toBe(25);
    expect(service.breakMinutes()).toBe(5);
    expect(service.remaining()).toBe('25:00');
    expect(service.progress()).toBe(0);
  });

  it('pauses keeping the time left and resumes without resetting it (CA-2.2)', () => {
    service.toggle();
    expect(service.running()).toBe(true);

    vi.advanceTimersByTime(10_000);
    expect(service.remaining()).toBe('24:50');

    service.toggle();
    expect(service.running()).toBe(false);

    vi.advanceTimersByTime(60_000);
    expect(service.remaining()).toBe('24:50');

    service.toggle();
    vi.advanceTimersByTime(10_000);
    expect(service.remaining()).toBe('24:40');
  });

  it('unlocks the sound on PLAY, not on PAUSE', () => {
    const unlock = vi.spyOn(TestBed.inject(TimerSoundService), 'unlock');

    service.toggle();
    expect(unlock).toHaveBeenCalledTimes(1);

    service.toggle();
    expect(unlock).toHaveBeenCalledTimes(1);
  });

  it('tracks the progress proportionally to the elapsed time (CA-1.2)', () => {
    service.toggle();
    vi.advanceTimersByTime(FOCUS_MS / 2);

    expect(service.progress()).toBeCloseTo(0.5, 2);
  });

  it('returns the current phase to its full time and stops, without changing phase (CA-3.3)', () => {
    service.toggle();
    vi.advanceTimersByTime(30_000);

    service.reset();

    expect(service.phase()).toBe('focus');
    expect(service.running()).toBe(false);
    expect(service.remaining()).toBe('25:00');
    expect(service.progress()).toBe(0);
  });

  it('chains focus into break with one notice and one beep per transition (RF-4, RF-5)', () => {
    service.toggle();

    vi.advanceTimersByTime(FOCUS_MS);
    expect(service.phase()).toBe('break');
    expect(service.running()).toBe(true);
    expect(service.remaining()).toBe('05:00');
    expect(service.notice()).toBe('Fin de la concentración, ¡a descansar!');
    expect(beep).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(BREAK_MS);
    expect(service.phase()).toBe('focus');
    expect(service.remaining()).toBe('25:00');
    expect(service.notice()).toBe('Fin del descanso, ¡a concentrarse!');
    expect(beep).toHaveBeenCalledTimes(2);
  });

  it('catches up on the phase containing now with a single notice and beep (CL-8)', () => {
    service.toggle();
    vi.advanceTimersByTime(1_000);
    beep.mockClear();

    vi.setSystemTime(FOCUS_MS + BREAK_MS + 60_000);
    setVisibility('visible');
    document.dispatchEvent(new Event('visibilitychange'));

    expect(service.phase()).toBe('focus');
    expect(service.running()).toBe(true);
    expect(service.remaining()).toBe('24:00');
    expect(service.notice()).toBe('Fin del descanso, ¡a concentrarse!');
    expect(beep).toHaveBeenCalledTimes(1);
  });

  it('does not tick while the page is hidden', () => {
    service.toggle();
    vi.setSystemTime(FOCUS_MS);

    setVisibility('hidden');
    document.dispatchEvent(new Event('visibilitychange'));

    expect(service.phase()).toBe('focus');
  });

  it('lets a transition triggered by PAUSE win (CL-1)', () => {
    service.toggle();
    vi.setSystemTime(FOCUS_MS);

    service.toggle();

    expect(service.phase()).toBe('break');
    expect(service.running()).toBe(true);
    expect(service.remaining()).toBe('05:00');
  });

  it('lets a transition triggered by RESET win (CA-3.4)', () => {
    service.toggle();
    vi.setSystemTime(FOCUS_MS);

    service.reset();

    expect(service.phase()).toBe('break');
    expect(service.running()).toBe(true);
    expect(service.remaining()).toBe('05:00');
  });

  it('accepts 1 and 60 and rejects invalid values, keeping the last valid one (CA-7.4)', () => {
    service.setFocusMinutes('60');
    expect(service.focusMinutes()).toBe(60);

    service.setFocusMinutes('1');
    expect(service.focusMinutes()).toBe(1);

    for (const invalid of ['0', '61', '2.5', '', 'abc', '-3']) {
      service.setFocusMinutes(invalid);
    }

    expect(service.focusMinutes()).toBe(1);
    expect(service.remaining()).toBe('01:00');
  });

  it('editing the other phase keeps the remaining time of the current one', () => {
    service.setBreakMinutes('10');

    expect(service.breakMinutes()).toBe(10);
    expect(service.remaining()).toBe('25:00');
  });

  it('editing the current phase stops the timer with its new full time (CA-7.5)', () => {
    service.toggle();
    vi.advanceTimersByTime(60_000);
    service.toggle();
    expect(service.running()).toBe(false);

    service.setFocusMinutes('30');

    expect(service.focusMinutes()).toBe(30);
    expect(service.running()).toBe(false);
    expect(service.remaining()).toBe('30:00');
  });

  it('blocks the edits while the timer is running (CA-7.3)', () => {
    expect(service.editable()).toBe(true);
    service.toggle();
    expect(service.editable()).toBe(false);

    service.setFocusMinutes('10');
    service.setBreakMinutes('10');

    expect(service.focusMinutes()).toBe(25);
    expect(service.breakMinutes()).toBe(5);
  });

  it('clears the notice when it is dismissed', () => {
    service.toggle();
    vi.advanceTimersByTime(FOCUS_MS);
    expect(service.notice()).not.toBeNull();

    service.dismissNotice();

    expect(service.notice()).toBeNull();
  });

  it('persists the times and the phase and restores them on reload (RF-8, CL-5)', () => {
    service.setFocusMinutes('1');
    service.setBreakMinutes('2');
    service.toggle();
    vi.advanceTimersByTime(60_000);
    expect(service.phase()).toBe('break');

    const reloaded = newService();

    expect(reloaded.phase()).toBe('break');
    expect(reloaded.focusMinutes()).toBe(1);
    expect(reloaded.breakMinutes()).toBe(2);
    expect(reloaded.running()).toBe(false);
    expect(reloaded.remaining()).toBe('02:00');
  });

  it('restores 25/5 from a corrupt state, keeping a valid phase (CA-8.3)', () => {
    localStorage.setItem(STORAGE_KEY, '{"focusMinutes":"x","breakMinutes":null,"phase":"break"}');

    const reloaded = newService();

    expect(reloaded.focusMinutes()).toBe(25);
    expect(reloaded.breakMinutes()).toBe(5);
    expect(reloaded.phase()).toBe('break');
    expect(reloaded.remaining()).toBe('05:00');
  });

  it('saves the state when the page is hidden', () => {
    service.setFocusMinutes('45');
    localStorage.clear();

    window.dispatchEvent(new Event('pagehide'));

    expect(localStorage.getItem(STORAGE_KEY)).toBe(
      JSON.stringify({ focusMinutes: 45, breakMinutes: 5, phase: 'focus' }),
    );
  });
});
