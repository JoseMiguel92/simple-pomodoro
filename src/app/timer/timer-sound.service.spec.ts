import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { BEEP_DURATION_MS, TimerSoundService } from './timer-sound.service';

interface FakeOscillator {
  type: string;
  frequency: { value: number };
  connect: Mock;
  start: Mock;
  stop: Mock;
}

interface FakeGain {
  gain: { value: number };
  connect: Mock;
}

interface FakeAudioContext {
  state: AudioContextState;
  currentTime: number;
  destination: object;
  resume: Mock<() => Promise<void>>;
  createOscillator: Mock<() => FakeOscillator>;
  createGain: Mock<() => FakeGain>;
}

function fakeAudioContext(state: AudioContextState = 'running'): FakeAudioContext {
  const oscillator: FakeOscillator = {
    type: 'sine',
    frequency: { value: 0 },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
  const gain: FakeGain = { gain: { value: 0 }, connect: vi.fn() };

  return {
    state,
    currentTime: 1,
    destination: {},
    resume: vi.fn(async () => undefined),
    createOscillator: vi.fn(() => oscillator),
    createGain: vi.fn(() => gain),
  };
}

/** Registers a fake native constructor whose instances are the given context. */
function stubAudioContext(context: FakeAudioContext): void {
  // A plain function (not an arrow) so `new AudioContext()` returns the fake.
  vi.stubGlobal(
    'AudioContext',
    vi.fn(function FakeAudioContext() {
      return context;
    }),
  );
}

describe('TimerSoundService', () => {
  let service: TimerSoundService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimerSoundService);
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stays silent when the browser has no AudioContext (nothing throws)', () => {
    vi.stubGlobal('AudioContext', undefined);

    expect(() => {
      service.unlock();
      service.beep();
    }).not.toThrow();
  });

  it('creates the context lazily on unlock and resumes it when suspended', () => {
    const context = fakeAudioContext('suspended');
    stubAudioContext(context);

    service.unlock();

    expect(context.resume).toHaveBeenCalledTimes(1);
  });

  it('does not resume when the context is already running', () => {
    const context = fakeAudioContext('running');
    stubAudioContext(context);

    service.unlock();

    expect(context.resume).not.toHaveBeenCalled();
  });

  it('ignores a rejected resume without breaking the flow', async () => {
    const context = fakeAudioContext('suspended');
    context.resume.mockRejectedValue(new Error('blocked'));
    stubAudioContext(context);

    expect(() => service.unlock()).not.toThrow();
    await Promise.resolve();
  });

  it('plays one short beep through an oscillator and a gain', () => {
    const context = fakeAudioContext('running');
    stubAudioContext(context);

    service.beep();

    const oscillator = context.createOscillator.mock.results[0]?.value;
    expect(context.createGain).toHaveBeenCalledTimes(1);
    expect(oscillator?.start).toHaveBeenCalledTimes(1);
    expect(oscillator?.stop).toHaveBeenCalledWith(context.currentTime + BEEP_DURATION_MS / 1000);
  });

  it('does not play while the context is suspended (CL-6)', () => {
    const context = fakeAudioContext('suspended');
    stubAudioContext(context);

    service.beep();

    expect(context.createOscillator).not.toHaveBeenCalled();
  });

  it('catches a failing context and keeps the flow going (CL-6)', () => {
    vi.stubGlobal(
      'AudioContext',
      vi.fn(() => {
        throw new Error('not allowed');
      }),
    );

    expect(() => {
      service.unlock();
      service.beep();
    }).not.toThrow();
  });

  it('catches a failing oscillator without breaking the flow', () => {
    const context = fakeAudioContext('running');
    context.createOscillator.mockImplementation(() => {
      throw new Error('audio graph unavailable');
    });
    stubAudioContext(context);

    expect(() => service.beep()).not.toThrow();
  });
});
