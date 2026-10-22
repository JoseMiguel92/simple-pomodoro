/**
 * Pure palette data and helpers: the single source of truth for the four
 * palettes (RF-3, RF-7). Nothing is duplicated in CSS or templates, and no
 * DOM or storage is touched here.
 */

/** The four predefined palette ids. */
export type PaletteId = 'sereno' | 'noche' | 'atardecer' | 'bosque';

/** Identity plus the seven color tokens of a palette (spec table). */
export interface Palette {
  id: PaletteId;
  name: string;
  bg: string;
  surface: string;
  text: string;
  accent: string;
  track: string;
  focus: string;
  break: string;
}

/**
 * The four palettes in spec table order, with the exact hex values of the
 * spec. Sereno comes first and is the default one (RF-3).
 */
export const PALETTES: readonly Palette[] = [
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
];

/** The palette used whenever there is no valid choice (RF-3). */
export const DEFAULT_PALETTE_ID: PaletteId = 'sereno';

/**
 * Reads a stored palette id; anything empty, corrupt or unknown is silently
 * treated as no choice (RF-7, CA-7.1).
 */
export function parsePaletteId(raw: string | null | undefined): PaletteId | null {
  const match = PALETTES.find((palette) => palette.id === raw);
  return match ? match.id : null;
}

/**
 * Resolves a palette by id; a null or unknown id degrades silently to the
 * default one (RF-7, CA-7.1).
 */
export function getPalette(id: PaletteId | null | undefined): Palette {
  return PALETTES.find((palette) => palette.id === id) ?? PALETTES[0];
}
