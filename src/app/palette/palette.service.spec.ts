import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONSENT_KEY, PALETTE_KEY, TimerStorageService } from '../timer/timer-storage.service';
import { getPalette, PaletteId } from './palette.logic';
import { PaletteService } from './palette.service';

describe('PaletteService', () => {
  const tokens = ['bg', 'surface', 'text', 'accent', 'track', 'focus', 'break'] as const;

  /** Asserts that the seven `--color-*` variables on the root match a palette (CA-2.1). */
  const expectTheme = (id: PaletteId): void => {
    const palette = getPalette(id);
    for (const token of tokens) {
      expect(document.documentElement.style.getPropertyValue(`--color-${token}`)).toBe(
        palette[token],
      );
    }
  };

  /** Builds the root service after arranging storage beforehand (fresh injector). */
  const start = (): PaletteService => {
    TestBed.configureTestingModule({});
    return TestBed.inject(PaletteService);
  };

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.cssText = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts from Sereno and applies it when nothing is stored (CA-3.1)', () => {
    const service = start();

    expect(service.active()).toBe('sereno');
    expectTheme('sereno');
  });

  it('starts from the stored palette and applies it (CA-4.2)', () => {
    localStorage.setItem(CONSENT_KEY, 'accept');
    localStorage.setItem(PALETTE_KEY, 'noche');

    const service = start();

    expect(service.active()).toBe('noche');
    expectTheme('noche');
  });

  it('starts from Sereno without an accepted choice, even with a stored value (CA-5.2)', () => {
    localStorage.setItem(PALETTE_KEY, 'noche');

    const service = start();

    expect(service.active()).toBe('sereno');
    expectTheme('sereno');
  });

  it('degrades silently to Sereno when the stored value is corrupt (RF-7, CA-7.1)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem(CONSENT_KEY, 'accept');
    localStorage.setItem(PALETTE_KEY, 'gamma');

    const service = start();

    expect(service.active()).toBe('sereno');
    expectTheme('sereno');
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it('select writes the seven colour variables at once and updates the signal (CA-2.1)', () => {
    const service = start();
    const setProperty = vi.spyOn(document.documentElement.style, 'setProperty');

    service.select('bosque');

    expect(service.active()).toBe('bosque');
    expect(setProperty).toHaveBeenCalledTimes(7);
    expectTheme('bosque');
  });

  it('select persists the choice immediately once accepted (CA-4.1)', () => {
    localStorage.setItem(CONSENT_KEY, 'accept');
    const service = start();

    service.select('bosque');

    expect(localStorage.getItem(PALETTE_KEY)).toBe('bosque');
  });

  it('select applies in memory without writing while there is no choice (CA-5.1)', () => {
    const service = start();

    service.select('bosque');

    expect(service.active()).toBe('bosque');
    expectTheme('bosque');
    expect(localStorage.getItem(PALETTE_KEY)).toBeNull();

    localStorage.setItem(CONSENT_KEY, 'reject');
    service.select('noche');
    expect(localStorage.getItem(PALETTE_KEY)).toBeNull();
  });

  it('restoreDefault goes back to Sereno and re-applies it (RF-6)', () => {
    localStorage.setItem(CONSENT_KEY, 'accept');
    const service = start();
    service.select('noche');

    service.restoreDefault();

    expect(service.active()).toBe('sereno');
    expectTheme('sereno');
  });

  it('restoreDefault leaves no stored palette behind after the revocation (CA-6.1)', () => {
    localStorage.setItem(CONSENT_KEY, 'accept');
    const service = start();
    const storage = TestBed.inject(TimerStorageService);
    service.select('noche');

    // The revocation flow (T5): wipe app data, forget the choice, apply Sereno.
    storage.wipeAppData();
    storage.clearConsent();
    service.restoreDefault();

    expect(service.active()).toBe('sereno');
    expectTheme('sereno');
    expect(localStorage.getItem(PALETTE_KEY)).toBeNull();
  });
});
