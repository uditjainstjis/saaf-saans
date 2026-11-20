/**
 * Tests for the planner: which recommendations apply, in what order, what they
 * total, and that it runs any strategy list it is given (open/closed).
 */
import { expect, it } from 'vitest';
import { buildPlan } from '../../../src/features/plan/planner';
import type { Strategy } from '../../../src/features/plan/strategies/strategy';
import { COMMUNITY, FAMILY, situation } from '../../support/fixtures';

it('lists what applies to a family, in registry order', () => {
  expect(buildPlan(situation()).recommendations.map((r) => r.id)).toEqual([
    'shift-outdoor-time',
    'air-at-cleanest-hour',
    'clean-air-room',
    'close-at-peak',
    'seal-gaps',
    'switch-commute',
  ]);
});

it('lists what applies to a community', () => {
  expect(buildPlan(situation(COMMUNITY)).recommendations.map((r) => r.id)).toEqual([
    'shift-outdoor-time',
    'mask-on-commute',
    'air-at-cleanest-hour',
    'clean-air-room',
    'close-at-peak',
    'switch-commute',
    'stop-waste-burning',
  ]);
});

it('totals the new changes', () => {
  const { totals } = buildPlan(situation());
  // 468 + 75 + 601 + 330 + 119.2
  expect(totals.inhaledAvoidedUg).toBe(1593.2);
  expect(totals.co2eSavedKg).toBe(32.6);
  expect(totals.notEmittedG).toBe(0);
});

it('leaves what a household already does out of the totals', () => {
  const plan = buildPlan(situation({ ...FAMILY, commute: 'metro' }));
  expect(plan.recommendations.find((r) => r.id === 'keep-commute')?.status).toBe('keep');
  expect(plan.totals.co2eSavedKg).toBe(0);
});

it('is open to extension: a strategy passed in runs without any change to the planner', () => {
  const drinkWater: Strategy = {
    id: 'test-extension',
    category: 'routine',
    advise: () => ({
      status: 'new',
      title: 'Extension',
      action: 'Do the new thing.',
      impact: { inhaledAvoidedUg: 5, notEmittedG: 0, co2eSavedKg: 0 },
      calculation: '5',
      factorIds: ['whoDaily'],
    }),
  };
  const silent: Strategy = { id: 'silent', category: 'indoor', advise: () => null };
  const plan = buildPlan(situation(), [drinkWater, silent]);
  expect(plan.recommendations.map((r) => r.id)).toEqual(['test-extension']);
  expect(plan.totals.inhaledAvoidedUg).toBe(5);
});
