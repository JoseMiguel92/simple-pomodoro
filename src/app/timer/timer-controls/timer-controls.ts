import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Timer controls: a single PLAY/PAUSE button plus a RESET button on its right.
 * Presentational only — it emits events and never touches the timer logic.
 */
@Component({
  selector: 'app-timer-controls',
  templateUrl: './timer-controls.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimerControls {
  readonly running = input.required<boolean>();
  // `toggle` and `reset` are the frozen interface names of the plan (§4), even
  // though they match native DOM event names.
  // eslint-disable-next-line @angular-eslint/no-output-native
  readonly toggle = output<void>();
  // eslint-disable-next-line @angular-eslint/no-output-native
  readonly reset = output<void>();
}
