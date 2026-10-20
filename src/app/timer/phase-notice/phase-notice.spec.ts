import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { NOTICE_AUTO_HIDE_MS, PhaseNotice } from './phase-notice';

describe('PhaseNotice', () => {
  let fixture: ComponentFixture<PhaseNotice>;
  let dismiss: Mock<() => void>;

  function card(): HTMLElement | null {
    return fixture.nativeElement.querySelector('[data-testid="phase-notice"]');
  }

  function cards(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('[data-testid="phase-notice"]'));
  }

  function setMessage(message: string | null): void {
    fixture.componentRef.setInput('message', message);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({ imports: [PhaseNotice] }).compileComponents();

    fixture = TestBed.createComponent(PhaseNotice);
    dismiss = vi.fn<() => void>();
    fixture.componentInstance.dismiss.subscribe(() => dismiss());
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
    vi.useRealTimers();
  });

  it('stays hidden while there is no message', () => {
    setMessage(null);

    expect(card()).toBeNull();
    expect(dismiss).not.toHaveBeenCalled();
  });

  it('shows the message it receives', () => {
    setMessage('Fin de la concentración, ¡a descansar!');

    expect(card()?.textContent).toContain('Fin de la concentración, ¡a descansar!');
  });

  it('hides itself inside the 3–5 s window and reports the dismissal', () => {
    expect(NOTICE_AUTO_HIDE_MS).toBeGreaterThanOrEqual(3000);
    expect(NOTICE_AUTO_HIDE_MS).toBeLessThanOrEqual(5000);

    setMessage('Termina la concentración');
    vi.advanceTimersByTime(NOTICE_AUTO_HIDE_MS - 1);
    fixture.detectChanges();
    expect(card()).not.toBeNull();
    expect(dismiss).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(card()).toBeNull();
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('hides and reports the dismissal when the user taps it, without hiding twice', () => {
    setMessage('Termina el descanso');
    card()?.click();
    fixture.detectChanges();

    expect(card()).toBeNull();
    expect(dismiss).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(NOTICE_AUTO_HIDE_MS * 2);
    fixture.detectChanges();
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('replaces the previous message and restarts the countdown', () => {
    setMessage('Termina la concentración');
    vi.advanceTimersByTime(NOTICE_AUTO_HIDE_MS / 2);

    setMessage('Termina el descanso');
    expect(cards()).toHaveLength(1);
    expect(card()?.textContent).toContain('Termina el descanso');

    vi.advanceTimersByTime(NOTICE_AUTO_HIDE_MS - 1);
    fixture.detectChanges();
    expect(card()).not.toBeNull();

    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(cards()).toHaveLength(0);
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('shows consecutive messages one after another, never two at once', () => {
    setMessage('Termina la concentración');
    expect(cards()).toHaveLength(1);

    vi.advanceTimersByTime(NOTICE_AUTO_HIDE_MS);
    fixture.detectChanges();
    expect(cards()).toHaveLength(0);

    setMessage('Termina el descanso');
    expect(cards()).toHaveLength(1);
    expect(card()?.textContent).toContain('Termina el descanso');

    setMessage(null);
    expect(cards()).toHaveLength(0);
  });

  it('clears its pending timer when destroyed', () => {
    setMessage('Termina la concentración');
    fixture.destroy();

    vi.advanceTimersByTime(NOTICE_AUTO_HIDE_MS);
    expect(dismiss).not.toHaveBeenCalled();
  });
});
