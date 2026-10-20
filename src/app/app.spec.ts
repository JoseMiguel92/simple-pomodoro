import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

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
});
