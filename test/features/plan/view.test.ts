/**
 * Tests for the plan view's reminder links: offered for advice with a clock
 * time when the air report knows its day, and for nothing else.
 */
import { expect, it } from 'vitest';
import { presentPlan } from '../../../src/features/plan/view';
import { COMMUNITY, FAMILY, SMOG, briefFor } from '../../support/fixtures';

/** The ids of the recommendations that carry a reminder link, for a brief. */
const reminded = (brief: ReturnType<typeof briefFor>): string[] =>
  presentPlan(brief)
    .recommendations.filter((rec) => rec.calendarUrl !== undefined)
    .map((rec) => rec.id);

it('offers a reminder for airing, for shutting windows and for the outdoor shift, and nothing else', () => {
  expect(reminded(briefFor(FAMILY))).toEqual([
    'shift-outdoor-time',
    'air-at-cleanest-hour',
    'close-at-peak',
  ]);
  expect(reminded(briefFor(COMMUNITY))).toEqual([
    'shift-outdoor-time',
    'air-at-cleanest-hour',
    'close-at-peak',
  ]);
});

it('builds each link from the card’s own title, for the day after the report', () => {
  const view = presentPlan(briefFor(FAMILY));
  const peak = view.recommendations.find((rec) => rec.id === 'close-at-peak');
  const url = new URL(peak?.calendarUrl ?? '');
  expect(url.searchParams.get('text')).toBe('Shut windows from 9 pm to 12 midnight');
  expect(url.searchParams.get('dates')).toBe('20261121T210000/20261122T000000');
  expect(url.searchParams.get('ctz')).toBe('Asia/Kolkata');
});

it('offers none when the report does not know its day, as typical values do not', () => {
  const withoutDay = { ...SMOG, local: undefined };
  expect(reminded(briefFor(FAMILY, withoutDay))).toEqual([]);
  expect(reminded(briefFor(FAMILY, { ...withoutDay, source: 'typical' }))).toEqual([]);
});

it('sends the page the link, not the time of day it was built from', () => {
  const [first] = presentPlan(briefFor(FAMILY)).recommendations;
  expect(first).not.toHaveProperty('when');
  expect(first).not.toHaveProperty('factorIds');
});
