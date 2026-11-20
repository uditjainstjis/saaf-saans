/**
 * Tests for the strategy registry: complete, unique, and safe to run over any
 * situation.
 */
import { expect, it } from 'vitest';
import { buildPlan } from '../../../../src/features/plan/planner';
import { STRATEGIES } from '../../../../src/features/plan/strategies/registry';
import { COMMUNITY, FAMILY, SMOG, flatAir, situation, smogDay } from '../../../support/fixtures';

it('holds every strategy once, each in one of the three categories of the brief', () => {
  const ids = STRATEGIES.map((s) => s.id);
  expect(new Set(ids).size).toBe(ids.length);
  expect(new Set(STRATEGIES.map((s) => s.category))).toEqual(
    new Set(['routine', 'indoor', 'alternative']),
  );
});

it('every strategy answers every situation without throwing, with non-negative impact', () => {
  const airs = [SMOG, flatAir(5), flatAir(400), { ...SMOG, hours: smogDay(3) }];
  for (const profile of [FAMILY, COMMUNITY]) {
    for (const air of airs) {
      for (const rec of buildPlan(situation(profile, air)).recommendations) {
        const { inhaledAvoidedUg, notEmittedG, co2eSavedKg } = rec.impact;
        expect(Math.min(inhaledAvoidedUg, notEmittedG, co2eSavedKg), rec.id).toBeGreaterThanOrEqual(
          0,
        );
        expect(rec.calculation, rec.id).not.toBe('');
        expect(rec.factorIds.length, rec.id).toBeGreaterThan(0);
      }
    }
  }
});
