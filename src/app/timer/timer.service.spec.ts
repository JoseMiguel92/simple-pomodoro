import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { STORAGE_KEY } from './timer.model';
import { CONSENT_KEY } from './timer-storage.service';
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
    // Grant the choice so these 002 tests exercise the accepted path (gate since spec 003).
    localStorage.setItem(CONSENT_KEY, 'accept');
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
    // Only the state: the consent choice must stay (spec 003 gate).
    localStorage.removeItem(STORAGE_KEY);

    window.dispatchEvent(new Event('pagehide'));

    expect(localStorage.getItem(STORAGE_KEY)).toBe(
      JSON.stringify({ focusMinutes: 45, breakMinutes: 5, phase: 'focus' }),
    );
  });

  describe('chained repaints aligned to second boundaries (spec 006)', () => {
    it('paints a clean descending value under uneven clock steps (RF-1, RF-3)', () => {
      const timers = lateTimers(JITTER_MS);
      service.setFocusMinutes('1');
      service.toggle();

      // Uneven advances model Firefox's late repaints; each repaint must still
      // land on the next second boundary of the absolute clock.
      const observed: string[] = [];
      for (const step of [1_017, 700, 500, 1_300, 1_000, 600, 400, 1_000, 1_000]) {
        vi.advanceTimersByTime(step);
        observed.push(service.remaining());
      }
      const painted = observed.filter((value, index) => value !== observed[index - 1]);
      // Each value exactly once, consecutive descending, none repeated or skipped (CA-1.2).
      expect(painted).toEqual(['00:59', '00:58', '00:57', '00:56', '00:55', '00:54', '00:53']);

      // First repaint asks for the boundary delay; every later one asks for the
      // same realigned remainder: the lateness never accumulates (CA-3.1).
      expect(timers.requestedDelays[0]).toBe(1_000);
      for (const delay of timers.requestedDelays.slice(1)) {
        expect(delay).toBe(1_000 - JITTER_MS);
      }

      // The phase end fires within ±1 s of the true boundary (CA-3.2).
      vi.advanceTimersByTime(51_500); // 59_017: last focus value
      expect(service.phase()).toBe('focus');
      expect(service.remaining()).toBe('00:01');
      vi.advanceTimersByTime(1_000); // 60_017: the overdue tick fires and transitions
      expect(service.phase()).toBe('break');
      expect(service.remaining()).toBe('05:00');
      expect(Date.now()).toBe(60_000 + JITTER_MS);

      // The first value of the new phase starts a clean cadence too (CL-1).
      vi.advanceTimersByTime(1_000);
      expect(service.remaining()).toBe('04:59');

      timers.restore();
    });

    it('reschedules on pause and resume without repeats, jumps or orphan timers (CA-4.1, CA-4.2)', () => {
      const timers = lateTimers(JITTER_MS);
      service.setFocusMinutes('1');
      service.toggle();

      vi.advanceTimersByTime(3_517); // three repaints: 00:59, 00:58, 00:57
      expect(service.remaining()).toBe('00:57');

      service.toggle(); // pause
      expect(service.running()).toBe(false);
      expect(vi.getTimerCount()).toBe(0); // nothing left to fire while stopped

      vi.advanceTimersByTime(5_000); // paused time repaints nothing
      expect(service.remaining()).toBe('00:57');

      const resumeIndex = timers.requestedDelays.length;
      service.toggle(); // resume
      vi.advanceTimersByTime(1_017); // first repaint realigned to the absolute clock
      expect(service.remaining()).toBe('00:56');
      vi.advanceTimersByTime(1_000);
      expect(service.remaining()).toBe('00:55');

      // The delay requested at resume comes from the clock remainder
      // (56_483 ms left), not a dragged full second from the pre-pause chain.
      expect(timers.requestedDelays[resumeIndex]).toBe(483);
      timers.restore();
    });

    it('reschedules on RESET without dragging old repaints (CA-4.1, CA-4.2)', () => {
      const timers = lateTimers(JITTER_MS);
      service.setFocusMinutes('1');
      service.toggle();
      vi.advanceTimersByTime(3_517);

      service.reset();
      expect(vi.getTimerCount()).toBe(0);
      expect(service.remaining()).toBe('01:00');

      service.toggle(); // PLAY again from the full time
      vi.advanceTimersByTime(1_017);
      expect(service.remaining()).toBe('00:59'); // clean first value, not 00:57
      vi.advanceTimersByTime(1_000);
      expect(service.remaining()).toBe('00:58');

      // The new chain schedules from the new clock: one boundary per repaint.
      expect(timers.requestedDelays.at(-1)).toBe(1_000 - JITTER_MS);
      timers.restore();
    });

    it('reschedules on edit so the next PLAY starts clean (CA-4.1, CA-4.2)', () => {
      const timers = lateTimers(JITTER_MS);
      service.setFocusMinutes('1');
      service.toggle();
      vi.advanceTimersByTime(3_517);
      service.toggle(); // pause
      service.setBreakMinutes('10'); // edit while paused

      expect(vi.getTimerCount()).toBe(0);

      const resumeIndex = timers.requestedDelays.length;
      service.toggle(); // resume
      vi.advanceTimersByTime(1_017);
      expect(service.remaining()).toBe('00:56'); // next value, painted once
      vi.advanceTimersByTime(1_000);
      expect(service.remaining()).toBe('00:55');

      // The delay requested at resume comes from the clock remainder
      // (56_483 ms left), not a dragged full second from the pre-pause chain.
      expect(timers.requestedDelays[resumeIndex]).toBe(483);
      timers.restore();
    });

    it('starts the repaint chain aligned after a reload and PLAY (CL-4)', () => {
      const timers = lateTimers(JITTER_MS);
      service.toggle();
      vi.advanceTimersByTime(20_000);

      const reloaded = newService(); // restored: full time and stopped (CA-8.2)
      expect(reloaded.running()).toBe(false);
      expect(reloaded.remaining()).toBe('25:00');
      expect(vi.getTimerCount()).toBe(0);

      const playIndex = timers.requestedDelays.length;
      reloaded.toggle(); // PLAY
      vi.advanceTimersByTime(500); // halfway to the first boundary: same value
      expect(reloaded.remaining()).toBe('25:00');
      vi.advanceTimersByTime(517); // first repaint exactly on the next boundary
      expect(reloaded.remaining()).toBe('24:59');
      vi.advanceTimersByTime(1_000);
      expect(reloaded.remaining()).toBe('24:58');

      // The delay requested at PLAY comes from the fresh clock: a full second
      // to the first boundary, not a dragged remainder from before the reload.
      expect(timers.requestedDelays[playIndex]).toBe(1_000);
      timers.restore();
    });

    it('advances the progress one step per second (RF-2)', () => {
      service.setFocusMinutes('1');
      service.toggle();

      for (let second = 1; second <= 5; second++) {
        vi.advanceTimersByTime(1_000);
        expect(service.progress()).toBeCloseTo(second / 60, 4);
      }

      // Between boundaries the dial holds: one repaint per second, not continuous.
      const held = service.progress();
      vi.advanceTimersByTime(500);
      expect(service.progress()).toBe(held);
    });

    it('realigns the repaint when the tab becomes visible again (CL-5)', () => {
      const timers = lateTimers(JITTER_MS);
      service.setFocusMinutes('1');
      service.toggle();
      vi.advanceTimersByTime(1_500);
      expect(vi.getTimerCount()).toBe(1);

      vi.setSystemTime(45_000); // hidden time passes without repaints
      setVisibility('visible');
      document.dispatchEvent(new Event('visibilitychange'));

      expect(service.remaining()).toBe('00:15'); // correct value right away
      expect(vi.getTimerCount()).toBe(1); // stale timer gone, chain realigned
      // Back exactly on the 45_000 boundary, the next boundary is a full
      // second away: the chain is rescheduled from the clock, not dragged.
      expect(timers.requestedDelays.at(-1)).toBe(1_000);
      vi.advanceTimersByTime(500);
      expect(service.remaining()).toBe('00:15'); // holds until the boundary
      vi.advanceTimersByTime(517); // the late repaint lands just past 46_000
      expect(service.remaining()).toBe('00:14');
      timers.restore();
    });

    it('resyncs with a single adjustment after a big system clock jump and resumes the clean cadence (CL-3)', () => {
      setVisibility('visible');
      service.setFocusMinutes('1');
      service.toggle(); // endsAt = 60_000

      vi.advanceTimersByTime(3_500); // repaints at 1 s, 2 s and 3 s
      expect(service.remaining()).toBe('00:57');

      // The system clock jumps forward 5 s while the tab stays visible. The
      // pending repaint keeps its real delay (500 ms), like a monotonic timer.
      vi.setSystemTime(8_500);

      // Small slices across the resync and the following seconds, recording
      // every value the user would actually see.
      const painted: string[] = [];
      const times: number[] = [];
      let previous = service.remaining();
      for (let step = 0; step < 65; step++) {
        vi.advanceTimersByTime(100);
        const value = service.remaining();
        if (value !== previous) {
          painted.push(value);
          times.push(Date.now());
          previous = value;
        }
      }

      // One single adjustment straight to the real value: the seconds skipped
      // by the jump are exempt and the resynced value is painted only once.
      expect(painted[0]).toBe('00:51');
      expect(painted.filter((value) => value === '00:51')).toHaveLength(1);
      for (const skipped of ['00:56', '00:55', '00:54', '00:53', '00:52']) {
        expect(painted).not.toContain(skipped);
      }

      // Clean cadence resumes: consecutive descending values, 900–1100 ms apart.
      expect(painted.slice(1, 7)).toEqual(['00:50', '00:49', '00:48', '00:47', '00:46', '00:45']);
      for (let index = 1; index < times.length; index++) {
        const gap = times[index] - times[index - 1];
        expect(gap).toBeGreaterThanOrEqual(900);
        expect(gap).toBeLessThanOrEqual(1_100);
      }
    });

    it('cancels the scheduled repaint on destroy, leaving no orphan timers', () => {
      const baseline = vi.getTimerCount();
      service.toggle();
      expect(vi.getTimerCount()).toBe(baseline + 1);

      TestBed.resetTestingModule(); // destroys the root injector (DestroyRef)

      expect(vi.getTimerCount()).toBe(baseline);
    });
  });
});

/** Simulated repaint lateness, the Firefox delay the bug reports (~1005–1020 ms). */
const JITTER_MS = 17;

/**
 * Wraps the fake `setTimeout` so every timer fires `late` ms after its own
 * schedule (Firefox repaint lateness); it also records the delays the code
 * requests, which is how the tests check that lateness never accumulates.
 */
function lateTimers(late: number): { requestedDelays: number[]; restore(): void } {
  const fakeSetTimeout = setTimeout;
  const requestedDelays: number[] = [];
  const spy = vi.spyOn(globalThis, 'setTimeout').mockImplementation(((
    handler: TimerHandler,
    delay?: number,
  ) => {
    requestedDelays.push(delay ?? 0);
    return fakeSetTimeout(handler, (delay ?? 0) + late);
  }) as unknown as typeof setTimeout);
  return { requestedDelays, restore: () => spy.mockRestore() };
}
