/**
 * Tests for the clean-cooking strategy: replacing a solid-fuel stove.
 * Each expected figure is worked out by hand in the comment beside it.
 */
import { expect, it } from 'vitest';
import { COMMUNITY, FAMILY } from '../../../support/fixtures';
import { advice } from '../../../support/strategies';

it('clean-cooking: fuel burned in a week × PM2.5 per kg, for solid-fuel kitchens only', () => {
  // 4 kg/day × 7 × 6.64 g/kg
  expect(advice('clean-cooking', { ...FAMILY, cookingFuel: 'biomass' })?.impact.notEmittedG).toBe(
    185.9,
  );
  expect(advice('clean-cooking', FAMILY)).toBeUndefined();
  expect(advice('clean-cooking', COMMUNITY)).toBeUndefined();
});
