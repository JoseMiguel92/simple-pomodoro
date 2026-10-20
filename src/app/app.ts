import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PhaseNotice } from './timer/phase-notice/phase-notice';
import { TimeInputs } from './timer/time-inputs/time-inputs';
import { TimerControls } from './timer/timer-controls/timer-controls';
import { TimerDial } from './timer/timer-dial/timer-dial';
import { TimerService } from './timer/timer.service';

/**
 * Application shell: it only wires the timer service to the presentational
 * components and shows the phase-change notice above them.
 */
@Component({
  selector: 'app-root',
  imports: [PhaseNotice, TimerDial, TimerControls, TimeInputs],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly timer = inject(TimerService);
}
