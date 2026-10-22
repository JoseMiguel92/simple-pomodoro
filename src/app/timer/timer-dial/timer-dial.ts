import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Phase } from '../timer.model';

/** Ring radius in the 0..100 viewBox of the SVG. */
const RADIUS = 45;

/**
 * Presentational dial: an SVG ring that empties with the elapsed phase time
 * plus the remaining time in `MM:SS`. It only paints what it receives.
 */
@Component({
  selector: 'app-timer-dial',
  templateUrl: './timer-dial.html',
  styleUrl: './timer-dial.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimerDial {
  /** Elapsed fraction of the phase: 0 keeps the ring full, 1 empties it. */
  readonly progress = input(0);
  /** Time left, already formatted as `MM:SS` by the caller. */
  readonly remaining = input('00:00');
  /** Current phase; drives the ring colour and the label. */
  readonly phase = input<Phase>('focus');

  protected readonly radius = RADIUS;
  protected readonly circumference = 2 * Math.PI * RADIUS;
  protected readonly dashOffset = computed(() => {
    const elapsed = Math.min(1, Math.max(0, this.progress()));
    return this.circumference * elapsed;
  });
  protected readonly phaseLabel = computed(() =>
    this.phase() === 'focus' ? 'Concentración' : 'Descanso',
  );
}
