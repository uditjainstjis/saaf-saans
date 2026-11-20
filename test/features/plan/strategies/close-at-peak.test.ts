/**
 * Tests for the close-at-peak strategy: shutting windows through the peak.
 * Each expected figure is worked out by hand in the comment beside it.
 */
import { expect, it } from 'vitest';
import { COMMUNITY, FAMILY, flatAir } from '../../../support/fixtures';
import { advice, inhaled } from '../../../support/strategies';

it('close-at-peak: worst hour × share kept out × resting breathing × three hours × people', () => {
  // 220 × (1 − 0.5) × 0.25 × 3 × 4
  expect(inhaled('close-at-peak', FAMILY)).toBe(330);
  expect(advice('close-at-peak', FAMILY)?.title).toBe('Shut windows from 9 pm to 12 midnight');
  // 220 × (1 − 0.6) × 0.25 × 3 × 200
  expect(inhaled('close-at-peak', COMMUNITY)).toBe(13_200);
  expect(advice('close-at-peak', FAMILY, flatAir(12))).toBeUndefined();
});
