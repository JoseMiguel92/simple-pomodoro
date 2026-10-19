import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { TimerControls } from './timer-controls';

describe('TimerControls', () => {
  let fixture: ComponentFixture<TimerControls>;

  function render(running: boolean): void {
    fixture = TestBed.createComponent(TimerControls);
    fixture.componentRef.setInput('running', running);
    fixture.detectChanges();
  }

  function buttons(): HTMLButtonElement[] {
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'));
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TimerControls] }).compileComponents();
  });

  it('shows the PLAY state with Spanish text when stopped', () => {
    render(false);

    const playPause = buttons()[0];
    expect(playPause.textContent).toContain('Empezar');
    expect(playPause.getAttribute('aria-label')).toBe('Empezar');
  });

  it('shows the PAUSE state with Spanish text when running', () => {
    render(true);

    const playPause = buttons()[0];
    expect(playPause.textContent).toContain('Pausar');
    expect(playPause.getAttribute('aria-label')).toBe('Pausar');
  });

  it('uses a different icon in each state, not only colour', () => {
    render(false);
    const playIcon = buttons()[0].querySelector('svg')?.innerHTML;
    const resetIcon = buttons()[1].querySelector('svg')?.innerHTML;

    render(true);
    const pauseIcon = buttons()[0].querySelector('svg')?.innerHTML;

    expect(playIcon).toBeTruthy();
    expect(pauseIcon).toBeTruthy();
    expect(pauseIcon).not.toBe(playIcon);
    expect(resetIcon).toBeTruthy();
  });

  it('emits toggle on every PLAY/PAUSE click', () => {
    render(false);
    const toggle = vi.fn();
    fixture.componentInstance.toggle.subscribe(toggle);

    buttons()[0].click();

    fixture.componentRef.setInput('running', true);
    fixture.detectChanges();
    buttons()[0].click();

    expect(toggle).toHaveBeenCalledTimes(2);
  });

  it('keeps RESET disabled and labelled while the timer is not running', () => {
    render(false);

    const reset = buttons()[1];
    expect(reset.disabled).toBe(true);
    expect(reset.textContent).toContain('Reiniciar');
    expect(reset.getAttribute('aria-label')).toBe('Reiniciar');
  });

  it('enables RESET while the timer is running', () => {
    render(true);

    expect(buttons()[1].disabled).toBe(false);
  });

  it('emits reset only when enabled', () => {
    render(true);
    const reset = vi.fn();
    fixture.componentInstance.reset.subscribe(reset);

    expect(buttons()[1].disabled).toBe(false);
    buttons()[1].click();

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('places RESET to the right of PLAY/PAUSE', () => {
    render(false);

    const [playPause, reset] = buttons();
    const position = playPause.compareDocumentPosition(reset);

    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
