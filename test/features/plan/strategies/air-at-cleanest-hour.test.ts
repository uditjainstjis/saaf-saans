/**
 * Tests for the air-at-cleanest-hour strategy: airing rooms at the cleanest hour.
 * Each expected figure is worked out by hand in the comment beside it.
 */
import { expect, it } from 'vitest';
import { FAMILY, flatAir } from '../../../support/fixtures';
import { advice, inhaled } from '../../../support/strategies';

it('air-at-cleanest-hour: (7 am − best) × resting breathing × half an hour × people', () => {
  // (180 − 30) × 0.25 × 0.5 × 4
  expect(inhaled('air-at-cleanest-hour', FAMILY)).toBe(75);
  expect(advice('air-at-cleanest-hour', FAMILY, flatAir(40))).toBeUndefined();
});
