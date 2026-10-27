import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { DEFAULT_PALETTE_ID, PALETTES, type PaletteId } from '../palette.logic';
import { PalettePicker } from './palette-picker';

describe('PalettePicker', () => {
  let fixture: ComponentFixture<PalettePicker>;
  let select: Mock<(id: PaletteId) => void>;

  function root(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function trigger(): HTMLButtonElement {
    const button = root().querySelector<HTMLButtonElement>(
      'button[aria-label="Elegir paleta de colores"]',
    );
    if (!button) {
      throw new Error('Palette trigger button not found');
    }
    return button;
  }

  function list(): HTMLElement {
    const list = root().querySelector<HTMLElement>(
      '[role="group"][aria-label="Paletas de colores"]',
    );
    if (!list) {
      throw new Error('Palette list not found');
    }
    return list;
  }

  function options(): HTMLButtonElement[] {
    return Array.from(list().querySelectorAll<HTMLButtonElement>('button'));
  }

  function option(name: string): HTMLButtonElement {
    const found = options().find((candidate) => candidate.textContent?.includes(name));
    if (!found) {
      throw new Error(`No option found with name "${name}"`);
    }
    return found;
  }

  /** jsdom normalizes inline hex colours to their rgb() form. */
  function rgb(hex: string): string {
    const value = parseInt(hex.slice(1), 16);
    return `rgb(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255})`;
  }

  function keydown(key: string, shiftKey = false): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true });
    root().dispatchEvent(event);
    return event;
  }

  async function render(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  async function open(): Promise<void> {
    trigger().click();
    await render();
  }

  async function setActive(id: PaletteId): Promise<void> {
    fixture.componentRef.setInput('active', id);
    await render();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PalettePicker] }).compileComponents();

    fixture = TestBed.createComponent(PalettePicker);
    select = vi.fn<(id: PaletteId) => void>();
    fixture.componentInstance.select.subscribe((id) => select(id));
    fixture.componentRef.setInput('active', DEFAULT_PALETTE_ID);
    await render();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  it('renders one option per predefined palette, in order (RF-1)', () => {
    const names = options().map((candidate) =>
      (candidate.textContent ?? '').replace('✓', '').trim(),
    );

    expect(options()).toHaveLength(PALETTES.length);
    expect(names).toEqual(PALETTES.map((palette) => palette.name));
  });

  it('paints every option with its own palette colours, no hex literals here (CA-1.3)', () => {
    for (const palette of PALETTES) {
      expect(option(palette.name).style.backgroundColor).toBe(rgb(palette.bg));
      expect(option(palette.name).style.color).toBe(rgb(palette.text));
      // The focus border colour is exposed as a custom property for the CSS.
      expect(option(palette.name).style.getPropertyValue('--option-focus-color')).toBe(
        palette.focus,
      );
    }
  });

  it('labels the trigger in Spanish, starts collapsed and points at the list (CA-1.2)', () => {
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(trigger().getAttribute('aria-controls')).toBe(list().id);
    expect(list().id).not.toBe('');
  });

  it('toggles the dropdown open and closed from the trigger (CA-1.2)', async () => {
    await open();
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(list().classList.contains('is-open')).toBe(true);
    // Anchored to the trigger and centred under it, not left-aligned (005, CA-2.1).
    expect(list().classList.contains('top-full')).toBe(true);
    expect(list().classList.contains('left-1/2')).toBe(true);
    expect(list().classList.contains('-translate-x-1/2')).toBe(true);

    trigger().click();
    await render();
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(list().classList.contains('is-open')).toBe(false);
  });

  it('marks only the active palette with a check and aria-current, not colour alone (RF-8, CA-8.1)', async () => {
    await setActive('noche');

    expect(option('Noche').getAttribute('aria-current')).toBe('true');
    expect(option('Noche').textContent).toContain('✓');
    for (const palette of PALETTES.filter((candidate) => candidate.id !== 'noche')) {
      expect(option(palette.name).getAttribute('aria-current')).toBeNull();
      expect(option(palette.name).textContent).not.toContain('✓');
    }

    await setActive('bosque');
    expect(option('Bosque').getAttribute('aria-current')).toBe('true');
    expect(option('Noche').getAttribute('aria-current')).toBeNull();
    expect(option('Noche').textContent).not.toContain('✓');
  });

  it('emits (select) with the palette id when an option is clicked', async () => {
    await open();

    for (const palette of PALETTES) {
      vi.clearAllMocks();
      option(palette.name).click();
      await render();

      expect(select).toHaveBeenCalledTimes(1);
      expect(select).toHaveBeenCalledWith(palette.id);
    }

    // Picking an option also closes the dropdown.
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
  });

  it('closes on Escape and returns the focus to the trigger (RNF-3)', async () => {
    await open();
    option('Bosque').focus();

    keydown('Escape');
    await render();

    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger());

    // Escape while already closed is a no-op, not an error.
    keydown('Escape');
    await render();
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
  });

  it('leaves Tab to the browser, which walks trigger then options in order (RNF-3)', async () => {
    await open();

    // An unconditional preventDefault on Tab would break the natural order.
    expect(keydown('Tab').defaultPrevented).toBe(false);
    expect(keydown('Tab', true).defaultPrevented).toBe(false);

    const allButtons = Array.from(root().querySelectorAll('button'));
    expect(allButtons[0]).toBe(trigger());
    expect(allButtons.slice(1)).toEqual(options());
  });
});
