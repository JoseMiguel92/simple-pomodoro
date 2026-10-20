import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { ConsentFooter } from './consent-footer';

describe('ConsentFooter', () => {
  let fixture: ComponentFixture<ConsentFooter>;

  function render(visible: boolean): void {
    fixture = TestBed.createComponent(ConsentFooter);
    fixture.componentRef.setInput('visible', visible);
    fixture.detectChanges();
  }

  function link(): HTMLButtonElement | null {
    return (fixture.nativeElement as HTMLElement).querySelector('button');
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ConsentFooter] }).compileComponents();
  });

  it('shows nothing while the shell keeps it hidden (RF-6, CA-6.1)', () => {
    render(false);

    expect(link()).toBeNull();
  });

  it('shows the Spanish link when visible and hides it again', () => {
    render(true);

    expect(link()?.textContent).toContain('Cambiar decisión de cookies');

    fixture.componentRef.setInput('visible', false);
    fixture.detectChanges();

    expect(link()).toBeNull();
  });

  it('emits revoke once per activation, without confirming here', () => {
    render(true);
    const revoke = vi.fn();
    fixture.componentInstance.revoke.subscribe(revoke);

    link()?.click();

    expect(revoke).toHaveBeenCalledTimes(1);
  });

  it('is a native button with an accessible name, reachable with the keyboard', () => {
    render(true);
    const button = link();

    expect(button?.type).toBe('button');
    expect(button?.textContent?.trim()).not.toBe('');

    button?.focus();
    expect(document.activeElement).toBe(button);
  });
});
