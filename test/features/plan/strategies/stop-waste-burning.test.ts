/**
 * Tests for the stop-waste-burning strategy: ending open burning in a neighbourhood.
 * Each expected figure is worked out by hand in the comment beside it.
 */
import { expect, it } from 'vitest';
import { COMMUNITY, FAMILY } from '../../../support/fixtures';
import { advice } from '../../../support/strategies';

it('stop-waste-burning: waste burned in a week × PM2.5 and CO2 per kg', () => {
  // 1 kg per 100 people per day × 200 people × 7 days = 14 kg
  const rec = advice('stop-waste-burning', COMMUNITY);
  expect(rec?.impact.notEmittedG).toBe(137.2);
  expect(rec?.impact.co2eSavedKg).toBe(20.3);
  expect(advice('stop-waste-burning', { ...COMMUNITY, wasteBurning: false })).toBeUndefined();
  expect(advice('stop-waste-burning', FAMILY)).toBeUndefined();
});
