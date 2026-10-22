import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './app';
import { getPalette } from './palette/palette.logic';
import { PalettePicker } from './palette/palette-picker/palette-picker';
import { PaletteService } from './palette/palette.service';
import { STORAGE_KEY } from './timer/timer.model';
import { TimerService } from './timer/timer.service';
import { CONSENT_KEY, PALETTE_KEY, TimerStorageService } from './timer/timer-storage.service';

const DEFAULTS_JSON = '{"focusMinutes":25,"breakMinutes":5,"phase":"focus"}';
const CUSTOM_JSON = '{"focusMinutes":40,"breakMinutes":10,"phase":"break"}';

describe('App', () => {
  let storage: TimerStorageService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
    storage = TestBed.inject(TimerStorageService);
  });

  /** Renders the shell with its first change-detection cycle done. */
  async function render(): Promise<{ fixture: ComponentFixture<App>; element: HTMLElement }> {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  /** Flushes change detection after a click that flips the signal-driven template. */
  async function settle(fixture: ComponentFixture<App>): Promise<void> {
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function dialogOf(element: HTMLElement): Element | null {
    return element.querySelector('[data-testid="consent-dialog"]');
  }

  function footerOf(element: HTMLElement): Element | null {
    return element.querySelector('app-consent-footer button');
  }

  function clickButton(element: HTMLElement, label: string): void {
    const button = Array.from(element.querySelectorAll('button')).find(
      (candidate) => candidate.textContent?.trim() === label,
    );
    expect(button).toBeDefined();
    button?.click();
  }

  function pickerTrigger(element: HTMLElement): HTMLButtonElement | null {
    return element.querySelector(
      'app-palette-picker button[aria-label="Elegir paleta de colores"]',
    );
  }

  function dropdownOf(element: HTMLElement): HTMLElement | null {
    return element.querySelector('app-palette-picker [role="group"]');
  }

  /** Reads the numeric z-index Tailwind class of an element (0 when it has none). */
  function zIndex(element: Element | null): number {
    const className = (element as HTMLElement | null)?.className;
    if (typeof className !== 'string') {
      return 0;
    }
    return Number(/\bz-(\d+)\b/.exec(className)?.[1] ?? 0);
  }

  /** Opens the dropdown and picks a palette by name, with change detection settled. */
  async function choosePalette(
    fixture: ComponentFixture<App>,
    element: HTMLElement,
    name: string,
  ): Promise<void> {
    const trigger = pickerTrigger(element);
    expect(trigger).not.toBeNull();
    trigger?.click();
    await settle(fixture);

    const option = Array.from(
      element.querySelectorAll<HTMLButtonElement>('app-palette-picker [role="group"] button'),
    ).find((candidate) => candidate.textContent?.includes(name));
    expect(option).toBeDefined();
    option?.click();
    await settle(fixture);
  }

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should compose the timer screen (dial, controls and inputs)', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('app-timer-dial')).toBeTruthy();
    expect(element.querySelector('app-timer-controls')).toBeTruthy();
    expect(element.querySelector('app-time-inputs')).toBeTruthy();
    expect(element.querySelector('app-phase-notice')).toBeTruthy();
  });

  it('should render the Spanish title and the default remaining time', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('Pomodoro');
    expect(element.querySelector('app-timer-dial')?.textContent).toContain('25:00');
  });

  it('shows the blocking dialog while no choice is stored (RF-1)', async () => {
    const { element } = await render();

    expect(dialogOf(element)).not.toBeNull();
    expect(footerOf(element)).toBeNull();
  });

  it('treats a corrupt stored choice as none and shows the dialog (RF-7, CL-1)', async () => {
    localStorage.setItem(CONSENT_KEY, 'not-a-choice');

    const { element } = await render();

    expect(dialogOf(element)).not.toBeNull();
  });

  it('accept stores the choice first, saves the state at once and shows the footer (RF-2, CA-2.1)', async () => {
    const write = vi.spyOn(storage, 'writeConsent');
    const save = vi.spyOn(storage, 'save');
    const { fixture, element } = await render();

    clickButton(element, 'Aceptar');
    await settle(fixture);

    expect(write).toHaveBeenCalledWith('accept');
    expect(save).toHaveBeenCalledTimes(1);
    // The choice must be stored before saving or the gate would swallow the write.
    expect(write.mock.invocationCallOrder[0]).toBeLessThan(save.mock.invocationCallOrder[0]);
    expect(localStorage.getItem(CONSENT_KEY)).toBe('accept');
    expect(localStorage.getItem(STORAGE_KEY)).toBe(DEFAULTS_JSON);
    expect(dialogOf(element)).toBeNull();
    expect(footerOf(element)).not.toBeNull();
  });

  it('reject wipes previous data before storing the choice and stays silent (RF-3, CA-3.1, CA-3.2)', async () => {
    localStorage.setItem(STORAGE_KEY, CUSTOM_JSON);
    const wipe = vi.spyOn(storage, 'wipeAppData');
    const write = vi.spyOn(storage, 'writeConsent');
    const timer = TestBed.inject(TimerService);
    const { fixture, element } = await render();

    clickButton(element, 'Rechazar');
    await settle(fixture);

    expect(wipe).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledWith('reject');
    expect(wipe.mock.invocationCallOrder[0]).toBeLessThan(write.mock.invocationCallOrder[0]);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(CONSENT_KEY)).toBe('reject');
    expect(dialogOf(element)).toBeNull();
    expect(footerOf(element)).not.toBeNull(); // CA-6.1: any stored choice shows the footer

    // The app keeps working while the gate blocks every write (CA-3.2).
    timer.setFocusMinutes('30');
    expect(timer.focusMinutes()).toBe(30);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('revoke deletes choice and data, restores 25/5 focus and brings the dialog back (RF-6, CA-6.2, CA-6.3)', async () => {
    localStorage.setItem(CONSENT_KEY, 'accept');
    localStorage.setItem(STORAGE_KEY, CUSTOM_JSON);
    const wipe = vi.spyOn(storage, 'wipeAppData');
    const clear = vi.spyOn(storage, 'clearConsent');
    const timer = TestBed.inject(TimerService);
    const { fixture, element } = await render();

    // Stored choice with the dialog closed: the footer is reachable (CA-6.1).
    expect(timer.focusMinutes()).toBe(40);
    expect(dialogOf(element)).toBeNull();
    expect(footerOf(element)).not.toBeNull();

    clickButton(element, 'Cambiar decisión de cookies');
    await settle(fixture);

    expect(wipe).toHaveBeenCalledTimes(1);
    expect(clear).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(CONSENT_KEY)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull(); // defaults must not be written back
    expect(timer.focusMinutes()).toBe(25);
    expect(timer.breakMinutes()).toBe(5);
    expect(timer.phase()).toBe('focus');
    expect(dialogOf(element)).not.toBeNull();
    expect(footerOf(element)).toBeNull();
  });

  it('revoking while the countdown is running stops it, restores 25/5 and wipes data (CL-3)', async () => {
    localStorage.setItem(CONSENT_KEY, 'accept');
    localStorage.setItem(STORAGE_KEY, CUSTOM_JSON);
    const timer = TestBed.inject(TimerService);
    const { fixture, element } = await render();

    // Stored choice with the dialog closed: PLAY starts the countdown (CA-6.1).
    expect(dialogOf(element)).toBeNull();
    expect(footerOf(element)).not.toBeNull();
    timer.toggle();
    expect(timer.running()).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(CUSTOM_JSON); // running alone must not persist

    clickButton(element, 'Cambiar decisión de cookies');
    await settle(fixture);

    expect(timer.running()).toBe(false); // the repaint interval must not survive the revocation
    expect(timer.focusMinutes()).toBe(25);
    expect(timer.breakMinutes()).toBe(5);
    expect(timer.phase()).toBe('focus');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(CONSENT_KEY)).toBeNull();
    expect(dialogOf(element)).not.toBeNull();
    expect(footerOf(element)).toBeNull();
  });

  it('accepting again after revoking saves the defaults (CL-6)', async () => {
    localStorage.setItem(CONSENT_KEY, 'accept');
    localStorage.setItem(STORAGE_KEY, CUSTOM_JSON);
    const { fixture, element } = await render();

    clickButton(element, 'Cambiar decisión de cookies');
    await settle(fixture);
    clickButton(element, 'Aceptar');
    await settle(fixture);

    expect(localStorage.getItem(CONSENT_KEY)).toBe('accept');
    expect(localStorage.getItem(STORAGE_KEY)).toBe(DEFAULTS_JSON);
    expect(dialogOf(element)).toBeNull();
    expect(footerOf(element)).not.toBeNull();
  });

  it('mounts the picker left of the card with the stored palette active (RF-1, CA-1.1, CA-4.2)', async () => {
    localStorage.setItem(CONSENT_KEY, 'accept');
    localStorage.setItem(PALETTE_KEY, 'noche');

    const { fixture, element } = await render();

    const picker = fixture.debugElement.query(By.directive(PalettePicker));
    expect(picker).not.toBeNull();
    expect(picker.componentInstance.active()).toBe('noche');

    // The control sits at the left of the timer card inside main (RF-1).
    const children = Array.from(element.querySelector('main')?.children ?? []).map((child) =>
      child.tagName.toLowerCase(),
    );
    const pickerIndex = children.indexOf('app-palette-picker');
    const cardIndex = children.indexOf('section');
    expect(pickerIndex).toBeGreaterThanOrEqual(0);
    expect(cardIndex).toBeGreaterThan(pickerIndex);
    expect(pickerTrigger(element)).not.toBeNull();
  });

  it('routes (select) to the palette service, applies the colours and stores the choice (RF-2, CA-2.1, CA-4.1)', async () => {
    localStorage.setItem(CONSENT_KEY, 'accept');
    const palette = TestBed.inject(PaletteService);
    const select = vi.spyOn(palette, 'select');
    const { fixture, element } = await render();

    await choosePalette(fixture, element, 'Noche');

    expect(select).toHaveBeenCalledWith('noche');
    expect(palette.active()).toBe('noche');
    expect(localStorage.getItem(PALETTE_KEY)).toBe('noche');
    expect(document.documentElement.style.getPropertyValue('--color-bg')).toBe(
      getPalette('noche').bg,
    );
  });

  it('keeps a running countdown untouched when the palette changes (CA-2.2, CL-1)', async () => {
    localStorage.setItem(CONSENT_KEY, 'accept');
    const timer = TestBed.inject(TimerService);
    const palette = TestBed.inject(PaletteService);
    const { fixture, element } = await render();
    timer.toggle();
    const toggle = vi.spyOn(timer, 'toggle');
    const reset = vi.spyOn(timer, 'reset');
    const restore = vi.spyOn(timer, 'restoreDefaults');

    await choosePalette(fixture, element, 'Atardecer');

    expect(palette.active()).toBe('atardecer');
    expect(timer.running()).toBe(true);
    expect(timer.editable()).toBe(false);
    expect(timer.phase()).toBe('focus');
    expect(timer.focusMinutes()).toBe(25);
    expect(timer.breakMinutes()).toBe(5);
    expect(toggle).not.toHaveBeenCalled();
    expect(reset).not.toHaveBeenCalled();
    expect(restore).not.toHaveBeenCalled();
  });

  it('hides the picker behind the blocking overlay while the popup is open (CL-2, CA-1.1)', async () => {
    const { fixture, element } = await render();

    // No stored choice → the dialog shows and its overlay spans the viewport.
    const dialog = dialogOf(element);
    expect(dialog).not.toBeNull();
    const overlay = dialog?.parentElement ?? null;
    expect(overlay?.classList.contains('fixed')).toBe(true);
    expect(overlay?.classList.contains('inset-0')).toBe(true);

    // The overlay stacks above the dropdown (z-50 vs z-10), so the picker sits behind it.
    const dropdown = dropdownOf(element);
    expect(dropdown).not.toBeNull();
    expect(zIndex(overlay)).toBeGreaterThan(zIndex(dropdown));

    // The click a real pointer would land on the overlay never reaches the picker.
    expect(pickerTrigger(element)).not.toBeNull();
    overlay?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await settle(fixture);
    expect(dropdown?.classList.contains('is-open')).toBe(false);
    expect(TestBed.inject(PaletteService).active()).toBe('sereno');
  });

  it('applies the chosen palette in memory without persisting it without consent (RF-5, CA-5.1)', async () => {
    localStorage.setItem(CONSENT_KEY, 'reject');
    const palette = TestBed.inject(PaletteService);
    const select = vi.spyOn(palette, 'select');
    const { fixture, element } = await render();

    // A stored choice keeps the dialog closed, so the picker is reachable.
    expect(dialogOf(element)).toBeNull();
    await choosePalette(fixture, element, 'Bosque');

    expect(select).toHaveBeenCalledWith('bosque');
    expect(palette.active()).toBe('bosque');
    expect(localStorage.getItem(PALETTE_KEY)).toBeNull();
    expect(document.documentElement.style.getPropertyValue('--color-bg')).toBe(
      getPalette('bosque').bg,
    );
  });

  it('revoking restores Sereno at once and leaves no stored palette (RF-6, CA-6.1)', async () => {
    localStorage.setItem(CONSENT_KEY, 'accept');
    localStorage.setItem(PALETTE_KEY, 'noche');
    const palette = TestBed.inject(PaletteService);
    const restore = vi.spyOn(palette, 'restoreDefault');
    const { fixture, element } = await render();
    expect(palette.active()).toBe('noche');

    clickButton(element, 'Cambiar decisión de cookies');
    await settle(fixture);

    expect(restore).toHaveBeenCalledTimes(1);
    expect(palette.active()).toBe('sereno');
    expect(localStorage.getItem(PALETTE_KEY)).toBeNull();
    expect(document.documentElement.style.getPropertyValue('--color-bg')).toBe(
      getPalette('sereno').bg,
    );
    expect(dialogOf(element)).not.toBeNull();
  });
});
