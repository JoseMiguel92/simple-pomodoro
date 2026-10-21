import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ConsentDialog } from './consent/consent-dialog/consent-dialog';
import { ConsentFooter } from './consent/consent-footer/consent-footer';
import { ConsentChoice } from './consent/consent.logic';
import { PalettePicker } from './palette/palette-picker/palette-picker';
import { PaletteService } from './palette/palette.service';
import { PhaseNotice } from './timer/phase-notice/phase-notice';
import { TimeInputs } from './timer/time-inputs/time-inputs';
import { TimerControls } from './timer/timer-controls/timer-controls';
import { TimerDial } from './timer/timer-dial/timer-dial';
import { TimerService } from './timer/timer.service';
import { TimerStorageService } from './timer/timer-storage.service';

/**
 * Application shell: wires the timer service to the presentational components
 * and orchestrates the consent flow (RF-1, RF-2, RF-3, RF-6) around them.
 */
@Component({
  selector: 'app-root',
  imports: [
    PhaseNotice,
    TimerDial,
    TimerControls,
    TimeInputs,
    ConsentDialog,
    ConsentFooter,
    PalettePicker,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly timer = inject(TimerService);
  private readonly storage = inject(TimerStorageService);
  protected readonly palette = inject(PaletteService);

  /** Stored choice; `null` (missing or corrupt) keeps the dialog open (RF-1, RF-7). */
  protected readonly choice = signal<ConsentChoice | null>(this.storage.readConsent());

  /** Stores the choice first, then persists the current times and phase at once (RF-2, CA-2.1). */
  protected onAccept(): void {
    this.storage.writeConsent('accept');
    this.timer.persistNow();
    this.choice.set('accept');
  }

  /** Wipes previous data before storing the choice; the app keeps running in memory (CA-3.1, CA-3.2). */
  protected onReject(): void {
    this.storage.wipeAppData();
    this.storage.writeConsent('reject');
    this.choice.set('reject');
  }

  /** Deletes data and choice, restores default times and palette, brings the dialog back (CA-6.2, CA-6.3). */
  protected onRevoke(): void {
    this.storage.wipeAppData();
    this.storage.clearConsent();
    this.timer.restoreDefaults();
    // Sereno once the consent is cleared, so its gated write stays off (CA-6.1).
    this.palette.restoreDefault();
    this.choice.set(null);
  }
}
