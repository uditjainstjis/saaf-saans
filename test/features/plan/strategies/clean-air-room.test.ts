/**
 * Tests for the clean-air-room strategy: a purifier or box-fan filter where people spend longest.
 * Each expected figure is worked out by hand in the comment beside it.
 */
import { expect, it } from 'vitest';
import { cleanerReduction } from '../../../../src/features/impact/service';
import { COMMUNITY, FAMILY } from '../../../support/fixtures';
import { advice, inhaled } from '../../../support/strategies';

it('clean-air-room: a box-fan filter in the bedroom for a family without a purifier', () => {
  const removed = cleanerReduction(1019, 32, 1);
  // 149 × 0.5 indoors × removed × 0.26 m³/h asleep × 8 h × 4 people
  expect(inhaled('clean-air-room', FAMILY)).toBeCloseTo(74.5 * removed * 0.26 * 8 * 4, 1);
  expect(advice('clean-air-room', FAMILY)?.title).toBe('Build a box-fan filter for the bedroom');
});

it('clean-air-room: uses the purifier a family already owns', () => {
  const removed = cleanerReduction(150, 32, 1);
  const owned = { ...FAMILY, purifier: true };
  expect(inhaled('clean-air-room', owned)).toBeCloseTo(74.5 * removed * 0.26 * 8 * 4, 1);
  expect(advice('clean-air-room', owned)?.title).toBe('Run the purifier where you sleep');
  expect(advice('clean-air-room', owned)?.factorIds).toContain('purifierCadr');
});

it('clean-air-room: one shared room for a community, capped at the people it holds', () => {
  const removed = cleanerReduction(1019, 170, 1);
  // 149 × 0.6 indoors × removed × 0.25 m³/h × 6 h × 40 people (of 200)
  expect(inhaled('clean-air-room', COMMUNITY)).toBeCloseTo(89.4 * removed * 0.25 * 6 * 40, 1);
  expect(advice('clean-air-room', COMMUNITY)?.title).toBe('Make one clean-air room for the group');
  const small = { ...COMMUNITY, people: 10, purifier: true };
  expect(inhaled('clean-air-room', small)).toBeCloseTo(89.4 * removed * 0.25 * 6 * 10, 1);
  expect(advice('clean-air-room', small)?.title).toBe('Add a box-fan filter to the shared room');
});
