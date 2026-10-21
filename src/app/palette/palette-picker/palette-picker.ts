import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { PALETTES, type PaletteId } from '../palette.logic';

/**
 * Palette picker (RF-1, RF-8): a trigger button with a palette icon that
 * toggles an animated dropdown with the four predefined palettes. Purely
 * presentational (frozen contract, plan §4): it receives the active palette
 * and reports the chosen one; open/closed state, focus and Escape live here.
 */
@Component({
  selector: 'app-palette-picker',
  templateUrl: './palette-picker.html',
  styleUrl: './palette-picker.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Keydown on the host catches Escape from the trigger or any option.
  host: { '(keydown)': 'onKeydown($event)' },
})
export class PalettePicker {
  /** Palette currently applied (frozen contract, plan §4). */
  readonly active = input.required<PaletteId>();

  /** Emitted when the user picks a palette (frozen contract, plan §4). */
  // `select` is the frozen interface name of the plan (§4), even though it
  // matches a native DOM event name.
  // eslint-disable-next-line @angular-eslint/no-output-native
  readonly select = output<PaletteId>();

  /** The four palettes, from the single source of data (plan §2.1). */
  protected readonly palettes = PALETTES;

  /** Id shared by the trigger's aria-controls and the dropdown (RNF-3). */
  protected readonly listId = 'palette-picker-list';

  /** Whether the dropdown is shown (CA-1.2). */
  protected readonly open = signal(false);

  // A non-required query: a required one throws NG0951 when read too early.
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');

  /** Whether a palette is the active one (RF-8). */
  protected isActive(id: PaletteId): boolean {
    return this.active() === id;
  }

  /** Opens or closes the dropdown from the trigger button. */
  protected toggleOpen(): void {
    this.open.update((open) => !open);
  }

  /** Reports the chosen palette and closes the dropdown. */
  protected choose(id: PaletteId): void {
    this.open.set(false);
    this.select.emit(id);
  }

  /** Escape closes the dropdown and returns the focus to the trigger (RNF-3). */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !this.open()) {
      return;
    }
    event.preventDefault();
    this.open.set(false);
    this.trigger()?.nativeElement.focus();
  }
}
