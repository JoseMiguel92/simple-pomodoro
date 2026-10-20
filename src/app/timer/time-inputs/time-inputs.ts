import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MAX_MINUTES, MIN_MINUTES } from '../timer.model';

/**
 * Focus/break minutes editor (RF-7).
 *
 * Dumb component: it only shows the received values and emits what was typed.
 * Validation belongs to `parseMinutes` in the logic (CA-7.4, CA-7.6).
 */
@Component({
  selector: 'app-time-inputs',
  templateUrl: './time-inputs.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeInputs {
  readonly focusMinutes = input.required<number>();
  readonly breakMinutes = input.required<number>();
  readonly disabled = input(false);

  readonly focusChange = output<string>();
  readonly breakChange = output<string>();

  protected readonly minMinutes = MIN_MINUTES;
  protected readonly maxMinutes = MAX_MINUTES;

  protected onFocusInput(event: Event): void {
    this.focusChange.emit((event.target as HTMLInputElement).value);
  }

  protected onBreakInput(event: Event): void {
    this.breakChange.emit((event.target as HTMLInputElement).value);
  }
}
