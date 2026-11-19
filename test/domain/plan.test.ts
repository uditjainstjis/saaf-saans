import { describe, expect, it } from 'vitest';
import { impactSentence } from '../../src/domain/explain';
import { asOutdoorMinutes, buildPlan } from '../../src/domain/plan';
import type { Strategy } from '../../src/domain/strategies/strategy';
import { COMMUNITY, FAMILY, situation } from '../support/fixtures';

describe('buildPlan', () => {
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
});

describe('asOutdoorMinutes', () => {
  it('restates a dose as minutes of breathing outdoor air at rest', () => {
    // 100 µg ÷ (200 µg/m³ × 0.25 m³/h) = 2 h
    expect(asOutdoorMinutes(100, 200, 0.25)).toBe(120);
  });

  it('is zero in perfectly clean air, where no amount of breathing reaches the dose', () => {
    expect(asOutdoorMinutes(100, 0, 0.25)).toBe(0);
  });
});

describe('impactSentence', () => {
  const zero = { inhaledAvoidedUg: 0, notEmittedG: 0, co2eSavedKg: 0 };

  it('names every non-zero figure with its unit', () => {
    expect(
      impactSentence({
        status: 'new',
        impact: { inhaledAvoidedUg: 468, notEmittedG: 137.2, co2eSavedKg: 20.3 },
      }),
    ).toBe(
      'Direct impact: about 468 µg of PM2.5 a day kept out of your lungs, and about 137.2 g of PM2.5 a week kept out of the neighbourhood’s air, and about 20.3 kg CO2e a week not emitted.',
    );
  });

  it('words a choice already made as a saving already won', () => {
    expect(impactSentence({ status: 'keep', impact: { ...zero, co2eSavedKg: 32.6 } })).toBe(
      'Already saving: about 32.6 kg CO2e a week not emitted.',
    );
  });

  it('says so when the effect is too small to state', () => {
    expect(impactSentence({ status: 'new', impact: zero })).toContain('Too small to measure');
  });
});
