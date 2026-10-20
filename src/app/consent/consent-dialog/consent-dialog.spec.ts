import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { ConsentDialog } from './consent-dialog';

describe('ConsentDialog', () => {
  let fixture: ComponentFixture<ConsentDialog>;
  let accept: Mock<() => void>;
  let reject: Mock<() => void>;

  function root(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function dialog(): HTMLElement | null {
    return root().querySelector('[data-testid="consent-dialog"]');
  }

  function button(label: 'Aceptar' | 'Rechazar'): HTMLButtonElement {
    const button = Array.from(root().querySelectorAll<HTMLButtonElement>('button')).find(
      (candidate) => candidate.textContent?.trim() === label,
    );
    if (!button) {
      throw new Error(`No button found with label "${label}"`);
    }
    return button;
  }

  function keydown(init: KeyboardEventInit & { key: string }): void {
    dialog()?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...init }));
  }

  function setVisible(visible: boolean): void {
    fixture.componentRef.setInput('visible', visible);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ConsentDialog] }).compileComponents();

    fixture = TestBed.createComponent(ConsentDialog);
    accept = vi.fn<() => void>();
    reject = vi.fn<() => void>();
    fixture.componentInstance.accept.subscribe(() => accept());
    fixture.componentInstance.reject.subscribe(() => reject());
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  it('renders nothing while it is not visible', () => {
    setVisible(false);

    expect(dialog()).toBeNull();
  });

  it('renders a blocking modal dialog while it is visible (RF-1)', () => {
    setVisible(true);

    const modal = dialog();
    expect(modal).not.toBeNull();
    expect(modal?.getAttribute('aria-modal')).toBe('true');
  });

  it('shows the Spanish consequence notice next to the buttons (RF-4)', () => {
    setVisible(true);

    const notice = root().querySelector('#consent-notice');
    expect(notice?.textContent).toContain('ajustes');
    expect(notice?.textContent).toContain('progreso');
    expect(notice?.textContent).toContain('no se guardará nada');
  });

  it('labels both buttons with readable Spanish text, not colour alone (RNF-3)', () => {
    setVisible(true);

    expect(button('Aceptar').textContent?.trim()).toBe('Aceptar');
    expect(button('Rechazar').textContent?.trim()).toBe('Rechazar');
  });

  it('emits accept only when "Aceptar" is pressed', () => {
    setVisible(true);

    button('Aceptar').click();
    fixture.detectChanges();

    expect(accept).toHaveBeenCalledTimes(1);
    expect(reject).not.toHaveBeenCalled();
  });

  it('emits reject only when "Rechazar" is pressed', () => {
    setVisible(true);

    button('Rechazar').click();
    fixture.detectChanges();

    expect(reject).toHaveBeenCalledTimes(1);
    expect(accept).not.toHaveBeenCalled();
  });

  it('does not close nor emit when the user clicks outside the dialog (CA-1.2)', () => {
    setVisible(true);

    root().dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(dialog()).not.toBeNull();
    expect(accept).not.toHaveBeenCalled();
    expect(reject).not.toHaveBeenCalled();
  });

  it('does not close nor emit on Escape (CA-1.2)', () => {
    setVisible(true);

    keydown({ key: 'Escape' });
    fixture.detectChanges();

    expect(dialog()).not.toBeNull();
    expect(accept).not.toHaveBeenCalled();
    expect(reject).not.toHaveBeenCalled();
  });

  it('moves the initial focus inside the dialog when it opens (RNF-3)', () => {
    setVisible(true);

    expect(root().contains(document.activeElement)).toBe(true);
    expect(dialog()?.contains(document.activeElement)).toBe(true);
  });

  it('keeps Tab inside the dialog while it is open (RNF-3)', () => {
    setVisible(true);

    // Forward Tab on the last button wraps around to the first one.
    button('Aceptar').focus();
    keydown({ key: 'Tab' });
    expect(document.activeElement).toBe(button('Rechazar'));

    // Backward Tab on the first button wraps around to the last one.
    button('Rechazar').focus();
    keydown({ key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(button('Aceptar'));

    expect(dialog()?.contains(document.activeElement)).toBe(true);
  });
});
