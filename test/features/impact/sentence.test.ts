/**
 * Tests for features/impact/sentence.ts: the fixed wording around the figures.
 */
import { expect, it } from 'vitest';
import { impactSentence } from '../../../src/features/impact/sentence';

const zero = { inhaledAvoidedUg: 0, notEmittedG: 0, co2eSavedKg: 0 };

it('names every non-zero figure with its unit', () => {
  expect(
    impactSentence({
      status: 'new',
      impact: { inhaledAvoidedUg: 468, notEmittedG: 137.2, co2eSavedKg: 20.3 },
    }),
  ).toBe(
    'Direct impact: about 468 µg of PM2.5 a day not breathed in, counting everyone in the plan, and about 137.2 g of PM2.5 a week kept out of the neighbourhood’s air, and about 20.3 kg CO2e a week not emitted.',
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
