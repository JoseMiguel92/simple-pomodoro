import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  viewChild,
} from '@angular/core';

/**
 * Blocking consent dialog (RF-1, RF-4). Presentational only: it reports the
 * user's choice and never decides anything. While visible it traps the focus
 * and only its own "Aceptar"/"Rechazar" buttons act; Escape and outside clicks
 * do nothing (CA-1.2, RNF-3).
 */
@Component({
  selector: 'app-consent-dialog',
  templateUrl: './consent-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsentDialog {
  /** Whether the blocking dialog is shown. */
  readonly visible = input(false);

  /** Emitted when the user accepts storing data in the browser. */
  readonly accept = output<void>();

  /** Emitted when the user rejects storing data in the browser. */
  readonly reject = output<void>();

  protected readonly dialog = viewChild.required<ElementRef<HTMLElement>>('dialog');

  private readonly injector = inject(Injector);

  constructor() {
    effect(() => {
      // The dialog element only exists after the template renders `visible()`.
      if (this.visible()) {
        afterNextRender(() => this.dialog().nativeElement.focus(), { injector: this.injector });
      }
    });
  }

  /** Single keyboard gate: Escape is swallowed and Tab cycles inside (RNF-3). */
  protected onKeydown(event: KeyboardEvent): void {
    // CA-1.2: the only close path is the two buttons.
    if (event.key === 'Escape') {
      event.preventDefault();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const dialog = this.dialog().nativeElement;
    const buttons = Array.from(dialog.querySelectorAll<HTMLButtonElement>('button'));
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (!first || !last) {
      return;
    }

    event.preventDefault();
    const active = document.activeElement;
    const backward = event.shiftKey;
    if (active === dialog) {
      (backward ? last : first).focus();
    } else if (backward && active === first) {
      last.focus();
    } else if (!backward && active === last) {
      first.focus();
    }
  }
}
