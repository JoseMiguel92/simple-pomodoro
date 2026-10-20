import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';

/** Auto-hide delay in ms, kept inside the 3–5 s window required by CA-6.2. */
export const NOTICE_AUTO_HIDE_MS = 4000;

/**
 * Top toast with the phase-change notice (RF-6). It only renders the message it
 * receives and reports that it hid itself; deciding when a phase changes is not
 * its responsibility.
 */
@Component({
  selector: 'app-phase-notice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './phase-notice.html',
})
export class PhaseNotice {
  /** Message to show; `null` keeps the notice hidden. */
  readonly message = input<string | null>(null);

  /** Emitted when the notice hides itself or the user taps it. */
  readonly dismiss = output<void>();

  protected readonly visible = signal(false);

  private hideTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect((onCleanup) => {
      if (this.message() === null) {
        this.visible.set(false);
        return;
      }

      // A new message replaces the previous one and restarts the countdown (CA-6.3).
      this.visible.set(true);
      this.hideTimeoutId = setTimeout(() => this.hide(), NOTICE_AUTO_HIDE_MS);
      onCleanup(() => this.stopAutoHide());
    });
  }

  protected hide(): void {
    this.stopAutoHide();
    this.visible.set(false);
    this.dismiss.emit();
  }

  private stopAutoHide(): void {
    if (this.hideTimeoutId !== null) {
      clearTimeout(this.hideTimeoutId);
      this.hideTimeoutId = null;
    }
  }
}
