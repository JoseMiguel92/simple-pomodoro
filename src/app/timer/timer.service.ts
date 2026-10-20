import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { Phase, TimerState } from './timer.model';
import {
  advance,
  createState,
  formatTime,
  parseMinutes,
  pause,
  progress as phaseProgress,
  remainingMs,
  reset as resetPhase,
  setMinutes,
  start,
} from './timer.logic';
import { TimerSoundService } from './timer-sound.service';
import { TimerStorageService } from './timer-storage.service';

/** Repaint trigger period; the truth is always `endsAt`/`Date.now()` (§2.1). */
const TICK_MS = 1000;

/**
 * Owns the whole Pomodoro cycle: state in signals, a `setInterval` used only as
 * a repaint trigger, phase transitions, persistence and the beep. Components
 * stay presentational and talk to it through this API only.
 */
@Injectable({ providedIn: 'root' })
export class TimerService {
  private readonly storage = inject(TimerStorageService);
  private readonly sound = inject(TimerSoundService);

  private readonly state = signal<TimerState>(this.restore());
  /** Last clock reading used to derive the remaining time while running. */
  private readonly now = signal(Date.now());

  private intervalId: ReturnType<typeof setInterval> | null = null;

  readonly phase = computed(() => this.state().phase);
  readonly running = computed(() => this.state().running);
  readonly focusMinutes = computed(() => this.state().focusMinutes);
  readonly breakMinutes = computed(() => this.state().breakMinutes);
  /** Editing is allowed while stopped or paused, blocked while running (CA-7.2/7.3). */
  readonly editable = computed(() => !this.state().running);

  readonly remaining = computed(() => formatTime(remainingMs(this.state(), this.now())));
  readonly progress = computed(() => phaseProgress(this.state(), this.now()));

  /** Message for the notice card, or `null` when there is nothing to show. */
  readonly notice = signal<string | null>(null);

  constructor() {
    const onVisibilityChange = () => this.handleVisibilityChange();
    const onPageHide = () => this.persist();
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);

    inject(DestroyRef).onDestroy(() => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
      this.stopInterval();
    });
  }

  /** PLAY/PAUSE. A phase transition triggered by this press wins (CL-1). */
  toggle(): void {
    const now = Date.now();
    const current = this.state();
    const jumped = advance(current, now);
    if (jumped.transitioned) {
      this.enter(jumped.state);
      return;
    }

    const next = current.running ? pause(current, now) : start(current, now);
    this.apply(next);
    if (next.running) {
      this.sound.unlock();
    }
  }

  /** RESET. A phase transition triggered by this press wins (CA-3.4). */
  reset(): void {
    const now = Date.now();
    const jumped = advance(this.state(), now);
    this.apply(jumped.transitioned ? jumped.state : resetPhase(this.state()));
  }

  setFocusMinutes(value: string): void {
    this.edit('focus', value);
  }

  setBreakMinutes(value: string): void {
    this.edit('break', value);
  }

  dismissNotice(): void {
    this.notice.set(null);
  }

  /** Persists the current state right away, once acceptance is granted (CA-2.1). */
  persistNow(): void {
    this.persist();
  }

  /** Restarts from the default times and phase, stopping the countdown (consent revocation, CA-6.3). */
  restoreDefaults(): void {
    this.apply(createState());
  }

  private restore(): TimerState {
    const stored = this.storage.load();
    return createState(stored.focusMinutes, stored.breakMinutes, stored.phase);
  }

  private edit(phase: Phase, value: string): void {
    const minutes = parseMinutes(value);
    const current = this.state();
    if (minutes === null || current.running) {
      // Invalid input keeps the last valid value (CA-7.4); running blocks edits.
      return;
    }
    this.apply(setMinutes(current, phase, minutes));
  }

  private handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      this.tick(Date.now());
    }
    this.persist();
  }

  private tick(now: number): void {
    const current = this.state();
    if (!current.running) {
      return;
    }
    const jumped = advance(current, now);
    this.now.set(now);
    if (jumped.transitioned) {
      this.enter(jumped.state);
    }
  }

  /** Applies a new state: repaint trigger, persistence and repaint clock. */
  private apply(next: TimerState): void {
    const previous = this.state();
    this.state.set(next);
    this.now.set(Date.now());
    if (
      previous.phase !== next.phase ||
      previous.focusMinutes !== next.focusMinutes ||
      previous.breakMinutes !== next.breakMinutes
    ) {
      this.persist();
    }
    if (next.running) {
      this.startInterval();
    } else {
      this.stopInterval();
    }
  }

  /** Phase change: exactly one card and one beep per transition (CL-8). */
  private enter(next: TimerState): void {
    this.apply(next);
    this.notice.set(noticeFor(next.phase));
    this.sound.beep();
  }

  private persist(): void {
    this.storage.save(this.state());
  }

  private startInterval(): void {
    if (this.intervalId !== null) {
      return;
    }
    this.intervalId = setInterval(() => this.tick(Date.now()), TICK_MS);
  }

  private stopInterval(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

/** Message shown for the phase we just entered (the one that ended is the other). */
function noticeFor(phase: Phase): string {
  return phase === 'break'
    ? 'Fin de la concentración, ¡a descansar!'
    : 'Fin del descanso, ¡a concentrarse!';
}
