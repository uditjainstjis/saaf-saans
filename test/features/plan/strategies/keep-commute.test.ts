/**
 * Tests for the keep-commute strategy: crediting a commute that is already low-emission.
 * Each expected figure is worked out by hand in the comment beside it.
 */
import { expect, it } from 'vitest';
import { FAMILY } from '../../../support/fixtures';
import { advice } from '../../../support/strategies';

it('keep-commute: credits what a low-emission commute already saves against a petrol car', () => {
  // 240 km × (0.1645 − 0.0286)
  const metro = advice('keep-commute', { ...FAMILY, commute: 'metro' });
  expect(metro?.status).toBe('keep');
  expect(metro?.impact.co2eSavedKg).toBe(32.6);
  // 240 km × (0.1645 − 0.1085)
  expect(advice('keep-commute', { ...FAMILY, commute: 'bus' })?.impact.co2eSavedKg).toBe(13.4);
  // 240 km × 0.1645
  expect(advice('keep-commute', { ...FAMILY, commute: 'cycle' })?.impact.co2eSavedKg).toBe(39.5);
  expect(advice('keep-commute', { ...FAMILY, commute: 'walk' })?.impact.co2eSavedKg).toBe(39.5);
});

it('keep-commute: silent for drivers, for no commute and for no distance', () => {
  expect(advice('keep-commute', FAMILY)).toBeUndefined();
  expect(advice('keep-commute', { ...FAMILY, commute: 'none' })).toBeUndefined();
  expect(advice('keep-commute', { ...FAMILY, commute: 'metro', commuteKm: 0 })).toBeUndefined();
});
