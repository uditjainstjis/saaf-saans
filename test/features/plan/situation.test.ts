/**
 * Tests for features/plan/situation.ts: who is covered, who commutes, who is
 * vulnerable, and how leaky the building is.
 */
import { expect, it } from 'vitest';
import { situationOf } from '../../../src/features/plan/situation';
import { COMMUNITY, FAMILY, SMOG } from '../../support/fixtures';

it('counts a household and treats children or elders as vulnerable', () => {
  const s = situationOf(FAMILY, SMOG);
  expect(s.people).toBe(4);
  expect(s.travellers).toBe(2);
  expect(s.vulnerable).toBe(true);
  expect(s.infiltrationId).toBe('infiltrationApartment');
  expect(s.outlook.best.hour).toBe(15);
});

it('is not vulnerable for healthy adults alone, and is when someone is sensitive', () => {
  const adults = { ...FAMILY, children: 0, elders: 0 };
  expect(situationOf(adults, SMOG).vulnerable).toBe(false);
  expect(situationOf({ ...adults, sensitive: true }, SMOG).vulnerable).toBe(true);
  expect(situationOf({ ...adults, children: 1 }, SMOG).vulnerable).toBe(true);
  expect(situationOf({ ...adults, elders: 1 }, SMOG).vulnerable).toBe(true);
});

it('maps each home type to its own infiltration factor', () => {
  expect(situationOf({ ...FAMILY, homeType: 'house' }, SMOG).infiltrationId).toBe(
    'infiltrationHouse',
  );
  expect(situationOf({ ...FAMILY, homeType: 'roadside' }, SMOG).infiltrationId).toBe(
    'infiltrationRoadside',
  );
});

it('scales a community: everyone is covered, a stated share changes its travel', () => {
  const s = situationOf(COMMUNITY, SMOG);
  expect(s.people).toBe(200);
  expect(s.travellers).toBe(60);
  expect(s.vulnerable).toBe(false);
  expect(s.infiltrationId).toBe('infiltrationShared');
});

it('treats a school, or a group with sensitive members, as vulnerable', () => {
  expect(situationOf({ ...COMMUNITY, groupType: 'school' }, SMOG).vulnerable).toBe(true);
  expect(situationOf({ ...COMMUNITY, sensitive: true }, SMOG).vulnerable).toBe(true);
});
