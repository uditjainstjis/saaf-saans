/**
 * Tests for the exercise-indoors strategy: taking the session indoors on the worst days.
 * Each expected figure is worked out by hand in the comment beside it.
 */
import { expect, it } from 'vitest';
import type { AirReport } from '../../../../src/features/air-quality/types';
import { FAMILY, SMOG, smogDay } from '../../../support/fixtures';
import { advice, inhaled } from '../../../support/strategies';

it('exercise-indoors: replaces the shift when even the best hour is over the limit', () => {
  const heavy: AirReport = { ...SMOG, hours: smogDay(2) };
  // Best hour is 60 µg/m³, above 35.4 for a vulnerable household.
  expect(advice('shift-outdoor-time', FAMILY, heavy)).toBeUndefined();
  // 360 µg/m³ × (1 − 0.5) × 1.56 × 0.5 h × 4
  expect(inhaled('exercise-indoors', FAMILY, heavy)).toBe(561.6);
  expect(advice('exercise-indoors', FAMILY, heavy)?.action).toContain('35.4 µg/m³ limit');
});

it('exercise-indoors: healthy adults get the higher limit', () => {
  const adults = { ...FAMILY, children: 0, elders: 0 };
  // Best hour 45 µg/m³: over 35.4 but under 55.4.
  const air: AirReport = { ...SMOG, hours: smogDay(1.5) };
  expect(advice('exercise-indoors', adults, air)).toBeUndefined();
  expect(advice('exercise-indoors', FAMILY, air)).toBeDefined();
  expect(advice('exercise-indoors', { ...FAMILY, outdoorTime: 'none' }, air)).toBeUndefined();
});
