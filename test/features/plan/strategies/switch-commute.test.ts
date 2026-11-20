/**
 * Tests for the switch-commute strategy: swapping a driven commute for the metro.
 * Each expected figure is worked out by hand in the comment beside it.
 */
import { expect, it } from 'vitest';
import { COMMUNITY, FAMILY } from '../../../support/fixtures';
import { advice } from '../../../support/strategies';

it('switch-commute: weekly km × (driving − metro) kg CO2e per km', () => {
  // 12 km × 2 × 5 days × 2 adults = 240 km × (0.1645 − 0.0286)
  expect(advice('switch-commute', FAMILY)?.impact.co2eSavedKg).toBe(32.6);
  // 5 × 2 × 5 × 60 riders = 3,000 km × (0.1137 − 0.0286)
  expect(advice('switch-commute', COMMUNITY)?.impact.co2eSavedKg).toBe(255.3);
  expect(advice('switch-commute', COMMUNITY)?.factorIds).toContain('groupUptake');
  expect(advice('switch-commute', FAMILY)?.factorIds).not.toContain('groupUptake');
});

it('switch-commute: silent for a clean commute or no distance', () => {
  expect(advice('switch-commute', { ...FAMILY, commute: 'metro' })).toBeUndefined();
  expect(advice('switch-commute', { ...FAMILY, commuteKm: 0 })).toBeUndefined();
});
