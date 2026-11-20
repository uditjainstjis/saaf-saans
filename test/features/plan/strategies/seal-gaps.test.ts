/**
 * Tests for the seal-gaps strategy: sealing door and window gaps at home.
 * Each expected figure is worked out by hand in the comment beside it.
 */
import { expect, it } from 'vitest';
import { COMMUNITY, FAMILY, flatAir } from '../../../support/fixtures';
import { advice, inhaled } from '../../../support/strategies';

it('seal-gaps: a home-only hack, sized by how leaky the home is', () => {
  // 149 × 0.5 × 0.2 × 0.25 × 8 × 4
  expect(inhaled('seal-gaps', FAMILY)).toBe(119.2);
  // A roadside home leaks more: 149 × 0.7 × 0.2 × 0.25 × 8 × 4
  expect(inhaled('seal-gaps', { ...FAMILY, homeType: 'roadside' })).toBe(166.9);
  expect(advice('seal-gaps', COMMUNITY)).toBeUndefined();
  expect(advice('seal-gaps', FAMILY, flatAir(10))).toBeUndefined();
});
