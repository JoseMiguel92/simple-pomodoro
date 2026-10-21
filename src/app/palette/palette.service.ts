import { Injectable, inject, signal } from '@angular/core';
import { DEFAULT_PALETTE_ID, getPalette, PaletteId } from './palette.logic';
import { TimerStorageService } from '../timer/timer-storage.service';

/** The seven `--color-*` tokens that re-theme the whole app (plan §2.2). */
const COLOR_TOKENS = ['bg', 'surface', 'text', 'accent', 'track', 'focus', 'break'] as const;

/**
 * Applies the active palette to the whole app by overwriting the seven
 * `--color-*` variables on the document root (RF-2): every Tailwind utility
 * reads them through `var()`, so re-theming needs no template change and never
 * touches the timer (CA-2.2). Hex values live only in `palette.logic.ts`.
 */
@Injectable({ providedIn: 'root' })
export class PaletteService {
  private readonly storage = inject(TimerStorageService);

  /** Palette currently applied; starts from the persisted choice (RF-3, RF-4, RF-7). */
  readonly active = signal<PaletteId>(this.storage.loadPalette());

  constructor() {
    this.apply(this.active());
  }

  /** Applies the palette at once and persists it behind the consent gate (CA-2.1, CA-4.1, CA-5.1). */
  select(id: PaletteId): void {
    this.active.set(id);
    this.apply(id);
    this.storage.writePalette(id);
  }

  /** Back to Sereno, used on consent revocation (RF-6, CA-6.1). */
  restoreDefault(): void {
    this.select(DEFAULT_PALETTE_ID);
  }

  private apply(id: PaletteId): void {
    const palette = getPalette(id);
    for (const token of COLOR_TOKENS) {
      document.documentElement.style.setProperty(`--color-${token}`, palette[token]);
    }
  }
}
