/**
 * Tests for the check against a reply that plays the air down: in unhealthy
 * air a claim that nobody is at risk is rejected with a reason a model can act
 * on, and the same words stand when the air is good.
 */
import { expect, it } from 'vitest';
import { riskIssues } from '../../../src/features/assistant/risk-claims';
import { FAMILY, briefFor, flatAir } from '../../support/fixtures';

const smog = briefFor();
const REASON =
  'The summary says nobody is at risk, but the air is Unhealthy; say who the Health advice in the FACTS names.';

it.each([
  'The air is Very unhealthy, and no one in your family is at immediate risk.',
  'US AQI is high and no sensitive people are at risk.',
  'Your household is not at risk today.',
  'Today the air is safe for a walk.',
])('rejects %j in unhealthy air', (text) => {
  expect(riskIssues([['The summary', text]], smog)).toEqual([REASON]);
});

it('accepts a text that names who is at risk', () => {
  const text = 'The air is Unhealthy and the elders are most at risk.';
  expect(riskIssues([['The summary', text]], smog)).toEqual([]);
});

it('lets the same words stand when the air is good', () => {
  const clean = briefFor(FAMILY, flatAir(5));
  expect(riskIssues([['The summary', 'Nobody is at risk from the air today.']], clean)).toEqual([]);
});
