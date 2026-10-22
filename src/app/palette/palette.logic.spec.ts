import { describe, expect, it } from 'vitest';
import { DEFAULT_PALETTE_ID, getPalette, PALETTES, parsePaletteId } from './palette.logic';

describe('PALETTES', () => {
  it('defines the four palettes of the spec table, in order', () => {
    expect(PALETTES.map((palette) => palette.id)).toEqual([
      'sereno',
      'noche',
      'atardecer',
      'bosque',
    ]);
    expect(PALETTES.map((palette) => palette.name)).toEqual([
      'Sereno',
      'Noche',
      'Atardecer',
      'Bosque',
    ]);
  });

  it('stores the exact hex values of the spec table', () => {
    expect(PALETTES).toEqual([
      {
        id: 'sereno',
        name: 'Sereno',
        bg: '#f8f5ee',
        surface: '#fffdfa',
        text: '#30271f',
        accent: '#007b66',
        track: '#dfdad1',
        focus: '#b05139',
        break: '#316f97',
      },
      {
        id: 'noche',
        name: 'Noche',
        bg: '#0c121a',
        surface: '#161d29',
        text: '#e4e8ef',
        accent: '#2cc5c5',
        track: '#2d333d',
        focus: '#eba941',
        break: '#a486d7',
      },
      {
        id: 'atardecer',
        name: 'Atardecer',
        bg: '#fceeed',
        surface: '#fffaf9',
        text: '#3c2829',
        accent: '#b94642',
        track: '#ebd9d7',
        focus: '#b2417f',
        break: '#6f4fa1',
      },
      {
        id: 'bosque',
        name: 'Bosque',
        bg: '#ecf5ec',
        surface: '#f9fdf9',
        text: '#1d2a1d',
        accent: '#0b7643',
        track: '#cedcce',
        focus: '#957f23',
        break: '#207582',
      },
    ]);
  });
});

describe('DEFAULT_PALETTE_ID', () => {
  it('is Sereno (RF-3)', () => {
    expect(DEFAULT_PALETTE_ID).toBe('sereno');
  });
});

describe('parsePaletteId', () => {
  it('returns each of the four valid ids', () => {
    expect(parsePaletteId('sereno')).toBe('sereno');
    expect(parsePaletteId('noche')).toBe('noche');
    expect(parsePaletteId('atardecer')).toBe('atardecer');
    expect(parsePaletteId('bosque')).toBe('bosque');
  });

  it('returns null when there is no stored value', () => {
    expect(parsePaletteId(null)).toBeNull();
    expect(parsePaletteId(undefined)).toBeNull();
  });

  it('returns null for an empty value', () => {
    expect(parsePaletteId('')).toBeNull();
    expect(parsePaletteId(' ')).toBeNull();
  });

  it('returns null for corrupt or unknown values, silently (RF-7, CA-7.1)', () => {
    expect(parsePaletteId('verde')).toBeNull();
    expect(parsePaletteId('Sereno')).toBeNull();
    expect(parsePaletteId(' sereno ')).toBeNull();
    expect(parsePaletteId('{"id":"noche"}')).toBeNull();
    expect(parsePaletteId('sereno\0')).toBeNull();
  });
});

describe('getPalette', () => {
  it('resolves the palette for each id', () => {
    expect(getPalette('sereno').name).toBe('Sereno');
    expect(getPalette('noche').accent).toBe('#2cc5c5');
    expect(getPalette('atardecer').accent).toBe('#b94642');
    expect(getPalette('bosque').bg).toBe('#ecf5ec');
  });

  it('is stable across repeated calls', () => {
    expect(getPalette('noche')).toBe(getPalette('noche'));
  });

  it('falls back to Sereno for a null or unknown id (RF-7)', () => {
    expect(getPalette(null)).toBe(getPalette(DEFAULT_PALETTE_ID));
    expect(getPalette(undefined)).toBe(getPalette(DEFAULT_PALETTE_ID));
    expect(getPalette('verde' as never)).toBe(getPalette(DEFAULT_PALETTE_ID));
  });
});
