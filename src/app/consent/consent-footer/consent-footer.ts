import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Footer revocation link (RF-6): a small native button at the bottom of the
 * screen that reports `(revoke)` when activated. The shell decides when it is
 * visible and performs the deletion; this component never confirms nor deletes.
 */
@Component({
  selector: 'app-consent-footer',
  templateUrl: './consent-footer.html',
  styleUrl: './consent-footer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsentFooter {
  /** Whether the link is shown; the shell hides it while the popup is open. */
  readonly visible = input(false);

  /** Emitted on activation, with no payload and no confirmation here. */
  readonly revoke = output<void>();
}
