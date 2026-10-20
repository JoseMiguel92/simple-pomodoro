import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './app';
import { STORAGE_KEY } from './timer/timer.model';
import { TimerService } from './timer/timer.service';
import { CONSENT_KEY, TimerStorageService } from './timer/timer-storage.service';

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
});
