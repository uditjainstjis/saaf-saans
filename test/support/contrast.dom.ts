/**
 * WCAG 2.x contrast arithmetic over the shipped design tokens, for both
 * themes. axe cannot decide contrast without layout, so the tests in
 * test/a11y/contrast-*.dom.test.ts compute it from public/css/tokens.css.
 */

import { shipped } from './shipped.dom';

/** Token name to #rrggbb value. */
export type Tokens = Readonly<Record<string, string>>;

/** The custom properties declared in the first rule whose selector is `selector`. */
function tokensIn(selector: string): Tokens {
  const tokens = shipped('css/tokens.css');
  const start = tokens.indexOf(`${selector} {`);
  const block = tokens.slice(start, tokens.indexOf('\n}', start));
  return Object.fromEntries(
    [...block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6});/g)].map((m) => [m[1] ?? '', m[2] ?? '']),
  );
}

const LIGHT = tokensIn(':root');
const DARK: Tokens = { ...LIGHT, ...tokensIn(":root[data-theme='dark']") };

/** The tokens of each theme. */
export const THEME_TOKENS: Readonly<Record<'light' | 'dark', Tokens>> = {
  light: LIGHT,
  dark: DARK,
};
/** The two themes. */
export const THEMES = ['light', 'dark'] as const;
/** The three surfaces text sits on. */
export const SURFACES = ['surface-0', 'surface-1', 'surface-2'];
/** The AQI band keys the Worker can send. */
export const BANDS = ['good', 'moderate', 'sensitive', 'unhealthy', 'very-unhealthy', 'hazardous'];

/** Relative luminance of a #rrggbb colour (WCAG 2.x definition). */
function luminance(hex: string): number {
  const channel = (at: number): number => {
    const c = parseInt(hex.slice(at, at + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/** WCAG contrast ratio of two #rrggbb colours. */
export function ratio(a: string, b: string): number {
  const [hi = 0, lo = 0] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** The contrast of two tokens in a theme. */
export const contrast = (theme: 'light' | 'dark', fg: string, bg: string): number =>
  ratio(THEME_TOKENS[theme][fg] ?? 'missing', THEME_TOKENS[theme][bg] ?? 'missing');
