/**
 * Tests for the shift-outdoor-time strategy: moving outdoor time to the cleanest hour.
 * Each expected figure is worked out by hand in the comment beside it.
 */
import { expect, it } from 'vitest';
import { COMMUNITY, FAMILY, flatAir } from '../../../support/fixtures';
import { advice, inhaled } from '../../../support/strategies';

it('shift-outdoor-time: (usual − best) × moderate breathing × hours × people', () => {
  // (180 − 30) µg/m³ × 1.56 m³/h × 0.5 h × 4 people
  expect(inhaled('shift-outdoor-time', FAMILY)).toBe(468);
  expect(advice('shift-outdoor-time', FAMILY)?.title).toBe('Move outdoor time to 3 pm');
  // (180 − 30) × 1.56 × (20/60) h × 200 people
  expect(inhaled('shift-outdoor-time', COMMUNITY)).toBe(15_600);
});

it('shift-outdoor-time: is for the cleanest hour, for as long as the session lasts', () => {
  expect(advice('shift-outdoor-time', FAMILY)?.when).toEqual({ hour: 15, minutes: 30 });
  expect(advice('shift-outdoor-time', COMMUNITY)?.when).toEqual({ hour: 15, minutes: 20 });
});

it('shift-outdoor-time: uses the evening hour for an evening habit', () => {
  // 7 pm is 120 µg/m³ on the fixture day: (120 − 30) × 1.56 × 0.5 × 4
  expect(inhaled('shift-outdoor-time', { ...FAMILY, outdoorTime: 'evening' })).toBe(280.8);
});

it('shift-outdoor-time: silent with no outdoor habit, no minutes, or nothing to gain', () => {
  expect(advice('shift-outdoor-time', { ...FAMILY, outdoorTime: 'none' })).toBeUndefined();
  expect(advice('shift-outdoor-time', { ...FAMILY, outdoorMinutes: 0 })).toBeUndefined();
  expect(advice('shift-outdoor-time', FAMILY, flatAir(20))).toBeUndefined();
});
