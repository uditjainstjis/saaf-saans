import { describe, expect, it } from 'vitest';
import { css, shipped } from '../support/page.dom';

/**
 * Colour contrast, enforced on the shipped design tokens.
 *
 * axe cannot decide contrast without layout, so every colour pair the
 * stylesheets use is checked here: the WCAG 2.x contrast ratio is computed
 * from the token values in public/css/tokens.css, for both themes. Text must
 * reach 4.5:1 (1.4.3) and interface boundaries and state indicators 3:1
 * (1.4.11).
 */

type Tokens = Readonly<Record<string, string>>;

/** The custom properties declared in the first rule whose selector is `selector`. */
function tokensIn(selector: string): Tokens {
  const sheet = shipped('css/tokens.css');
  const start = sheet.indexOf(`${selector} {`);
  const block = sheet.slice(start, sheet.indexOf('\n}', start));
  return Object.fromEntries(
    [...block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6});/g)].map((m) => [m[1] ?? '', m[2] ?? '']),
  );
}

const LIGHT = tokensIn(':root');
const DARK: Tokens = { ...LIGHT, ...tokensIn(":root[data-theme='dark']") };

/** Relative luminance of a #rrggbb colour (WCAG 2.x definition). */
function luminance(hex: string): number {
  const channel = (at: number): number => {
    const c = parseInt(hex.slice(at, at + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/** WCAG contrast ratio of two #rrggbb colours. */
function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

const contrast = (tokens: Tokens, fg: string, bg: string): number =>
  ratio(tokens[fg] ?? 'missing', tokens[bg] ?? 'missing');

const SURFACES = ['surface-0', 'surface-1', 'surface-2'];
const BANDS = ['good', 'moderate', 'sensitive', 'unhealthy', 'very-unhealthy', 'hazardous'];

describe('the contrast arithmetic', () => {
  it('agrees with published ratios', () => {
    expect(ratio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(ratio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
    // #767676 on white is the well-known 4.54:1 boundary grey; #ff0000 on white is 4.00:1.
    expect(ratio('#767676', '#ffffff')).toBeCloseTo(4.54, 2);
    expect(ratio('#ff0000', '#ffffff')).toBeCloseTo(4.0, 2);
  });

  it('read real tokens for both themes', () => {
    expect(Object.keys(LIGHT).length).toBeGreaterThan(25);
    const changed = Object.keys(LIGHT).filter((name) => LIGHT[name] !== DARK[name]);
    expect(changed.length).toBeGreaterThan(25);
  });
});

describe.each([
  ['light', LIGHT],
  ['dark', DARK],
] as const)('contrast in the %s theme', (_name, tokens) => {
  it.each(['ink', 'ink-soft', 'accent', 'accent-strong'])(
    '%s text reaches 4.5:1 on every surface',
    (fg) => {
      for (const bg of SURFACES) {
        expect(contrast(tokens, fg, bg), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
      }
    },
  );

  it('body text reaches AAA (7:1) on the page background', () => {
    expect(contrast(tokens, 'ink', 'surface-0')).toBeGreaterThanOrEqual(7);
  });

  it('button text reaches 4.5:1 on the button, at rest and on hover', () => {
    expect(contrast(tokens, 'on-accent', 'accent')).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tokens, 'on-accent', 'accent-strong')).toBeGreaterThanOrEqual(4.5);
  });

  it('error text reaches 4.5:1 where it appears, and ink on the error and notice tints', () => {
    for (const bg of ['surface-0', 'surface-1', 'error-bg']) {
      expect(contrast(tokens, 'error', bg), `error on ${bg}`).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrast(tokens, 'ink', 'error-bg')).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tokens, 'ink', 'notice-bg')).toBeGreaterThanOrEqual(4.5);
  });

  it('field borders, their hover state, the error border and the focus ring reach 3:1', () => {
    for (const edge of ['field-border', 'field-border-hover', 'focus', 'error', 'accent']) {
      for (const bg of SURFACES) {
        expect(contrast(tokens, edge, bg), `${edge} on ${bg}`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it.each(BANDS)('AQI band %s: text 4.5:1 on its tint, marker 3:1 on tint and card', (band) => {
    expect(contrast(tokens, 'ink', `band-${band}-bg`)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tokens, `band-${band}`, `band-${band}-bg`)).toBeGreaterThanOrEqual(3);
    expect(contrast(tokens, `band-${band}`, 'surface-1')).toBeGreaterThanOrEqual(3);
  });
});

describe('how the stylesheets use the tokens', () => {
  const sheet = css();

  it('has a class for every AQI band the Worker can send', () => {
    for (const band of BANDS) expect(sheet).toContain(`.band--${band} {`);
  });

  it('uses no colour outside the token file', () => {
    const rest = ['base.css', 'form.css', 'results.css'].map((n) => shipped(`css/${n}`)).join('\n');
    expect(rest.match(/#[0-9a-f]{3,8}\b|rgb\(|hsl\(/gi)).toBeNull();
  });

  it('shows placeholder text in the soft ink colour at full strength', () => {
    expect(sheet).toMatch(/::placeholder \{\s*color: var\(--ink-soft\);\s*\}/);
  });

  it('never dims disabled or busy controls with opacity, which would break their contrast', () => {
    expect(sheet.match(/opacity: (?!1;)/g)).toBeNull();
  });
});
