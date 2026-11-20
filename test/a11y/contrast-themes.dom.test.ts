/**
 * WCAG contrast of every colour pair the stylesheets use, in both themes:
 * text at 4.5:1 (1.4.3), boundaries and state indicators at 3:1 (1.4.11).
 * The arithmetic is test/support/contrast.dom.ts.
 */
import { expect, it } from 'vitest';
import { BANDS, SURFACES, THEMES, contrast } from '../support/contrast.dom';

const TEXT = ['ink', 'ink-soft', 'accent', 'accent-strong'];
const EDGES = ['field-border', 'field-border-hover', 'focus', 'error', 'accent'];
/** Every theme paired with every member of a list. */
const inEachTheme = (names: readonly string[]): ['light' | 'dark', string][] =>
  THEMES.flatMap((theme) => names.map((name): ['light' | 'dark', string] => [theme, name]));

it.each(inEachTheme(TEXT))('%s theme: %s text reaches 4.5:1 on every surface', (theme, fg) => {
  for (const bg of SURFACES) {
    expect(contrast(theme, fg, bg), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
  }
});

it.each(THEMES)('%s theme: body text reaches AAA (7:1) on the page background', (theme) => {
  expect(contrast(theme, 'ink', 'surface-0')).toBeGreaterThanOrEqual(7);
});

it.each(THEMES)('%s theme: button text reaches 4.5:1, at rest and on hover', (theme) => {
  expect(contrast(theme, 'on-accent', 'accent')).toBeGreaterThanOrEqual(4.5);
  expect(contrast(theme, 'on-accent', 'accent-strong')).toBeGreaterThanOrEqual(4.5);
});

it.each(THEMES)('%s theme: error text and tinted notices reach 4.5:1', (theme) => {
  for (const bg of ['surface-0', 'surface-1', 'error-bg']) {
    expect(contrast(theme, 'error', bg), `error on ${bg}`).toBeGreaterThanOrEqual(4.5);
  }
  expect(contrast(theme, 'ink', 'error-bg')).toBeGreaterThanOrEqual(4.5);
  expect(contrast(theme, 'ink', 'notice-bg')).toBeGreaterThanOrEqual(4.5);
});

it.each(inEachTheme(EDGES))('%s theme: the %s edge reaches 3:1 on every surface', (theme, edge) => {
  for (const bg of SURFACES) {
    expect(contrast(theme, edge, bg), `${edge} on ${bg}`).toBeGreaterThanOrEqual(3);
  }
});

it.each(inEachTheme(BANDS))('%s theme: AQI band %s is readable without colour', (theme, band) => {
  expect(contrast(theme, 'ink', `band-${band}-bg`)).toBeGreaterThanOrEqual(4.5);
  expect(contrast(theme, `band-${band}`, `band-${band}-bg`)).toBeGreaterThanOrEqual(3);
  expect(contrast(theme, `band-${band}`, 'surface-1')).toBeGreaterThanOrEqual(3);
});
