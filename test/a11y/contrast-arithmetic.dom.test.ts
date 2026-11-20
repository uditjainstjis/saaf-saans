/**
 * Checks on the contrast arithmetic itself, so a wrong formula cannot make
 * the theme tests pass: published ratios, and that real tokens were read.
 */
import { expect, it } from 'vitest';
import { ratio, THEME_TOKENS } from '../support/contrast.dom';

it('agrees with published ratios', () => {
  expect(ratio('#000000', '#ffffff')).toBeCloseTo(21, 5);
  expect(ratio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
  // #767676 on white is the well-known 4.54:1 boundary grey; #ff0000 on white is 4.00:1.
  expect(ratio('#767676', '#ffffff')).toBeCloseTo(4.54, 2);
  expect(ratio('#ff0000', '#ffffff')).toBeCloseTo(4.0, 2);
});

it('read real tokens for both themes', () => {
  const { light, dark } = THEME_TOKENS;
  expect(Object.keys(light).length).toBeGreaterThan(25);
  const changed = Object.keys(light).filter((name) => light[name] !== dark[name]);
  expect(changed.length).toBeGreaterThan(25);
});
