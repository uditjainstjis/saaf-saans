/**
 * Checks that the stylesheets use the design tokens the contrast tests cover:
 * no colour outside the token file, a class per AQI band, and no opacity
 * tricks that would change a measured contrast.
 */
import { expect, it } from 'vitest';
import { BANDS } from '../support/contrast.dom';
import { css, shipped, STYLESHEETS } from '../support/shipped.dom';

const sheet = css();

it('has a class for every AQI band the Worker can send', () => {
  for (const band of BANDS) expect(sheet).toContain(`.band--${band} {`);
});

it('uses no colour outside the token file', () => {
  const others = STYLESHEETS.filter((name) => name !== 'css/tokens.css');
  expect(others.length).toBeGreaterThanOrEqual(3);
  expect(
    others
      .map(shipped)
      .join('\n')
      .match(/#[0-9a-f]{3,8}\b|rgb\(|hsl\(/gi),
  ).toBeNull();
});

it('shows placeholder text in the soft ink colour at full strength', () => {
  expect(sheet).toMatch(/::placeholder \{\s*color: var\(--ink-soft\);\s*\}/);
});

it('never dims disabled or busy controls with opacity, which would break their contrast', () => {
  expect(sheet.match(/opacity: (?!1;)/g)).toBeNull();
});
