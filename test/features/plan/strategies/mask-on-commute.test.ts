/**
 * Tests for the mask-on-commute strategy: an N95 on an open-air commute.
 * Each expected figure is worked out by hand in the comment beside it.
 */
import { expect, it } from 'vitest';
import { COMMUNITY, FAMILY, flatAir } from '../../../support/fixtures';
import { advice, inhaled } from '../../../support/strategies';

it('mask-on-commute: dose on the way × N95 filtration × everyday fit', () => {
  // 149 µg/m³ × 0.25 m³/h × (5 km × 2 ÷ 20 km/h) × 60 commuters × 0.95 × 0.7
  expect(inhaled('mask-on-commute', COMMUNITY)).toBe(743.1);
  // Walking 3 km each way at 5 km/h, light activity: 149 × 0.72 × 1.2 h × 2 × 0.665
  expect(inhaled('mask-on-commute', { ...FAMILY, commute: 'walk', commuteKm: 3 })).toBe(171.2);
  // Cycling breathes hardest: 149 × 1.56 × (6 ÷ 15) × 2 × 0.665
  expect(inhaled('mask-on-commute', { ...FAMILY, commute: 'cycle', commuteKm: 3 })).toBe(123.7);
  expect(advice('mask-on-commute', { ...FAMILY, commute: 'bus' })).toBeDefined();
});

it('mask-on-commute: silent in a closed vehicle, with no distance, or in clean air', () => {
  expect(advice('mask-on-commute', FAMILY)).toBeUndefined();
  expect(advice('mask-on-commute', { ...FAMILY, commute: 'metro' })).toBeUndefined();
  expect(advice('mask-on-commute', { ...FAMILY, commute: 'walk', commuteKm: 0 })).toBeUndefined();
  expect(advice('mask-on-commute', { ...FAMILY, commute: 'walk' }, flatAir(10))).toBeUndefined();
});
