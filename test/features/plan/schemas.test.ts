/**
 * Tests for the profile schema: what it accepts, trims and rejects outright.
 * Bounds on individual fields are in ./schemas-bounds.test.ts.
 */
import { expect, it } from 'vitest';
import { profileSchema } from '../../../src/features/plan/schemas';
import { COMMUNITY, FAMILY } from '../../support/fixtures';
import { messages } from '../../support/profile-messages';

it('accepts a family profile and a community profile', () => {
  expect(profileSchema.parse(FAMILY)).toEqual(FAMILY);
  expect(profileSchema.parse(COMMUNITY)).toEqual(COMMUNITY);
});

it('trims free text', () => {
  const parsed = profileSchema.parse({ ...FAMILY, place: '  Delhi  ', notes: '  hi  ' });
  expect(parsed.place).toBe('Delhi');
  expect(parsed.notes).toBe('hi');
});

it('rejects an unknown mode, naming the choice', () => {
  expect(messages({ ...FAMILY, mode: 'city' })).toEqual([
    'Choose who the plan is for: family or community.',
  ]);
  expect(messages(null)).toHaveLength(1);
});

it('rejects keys it does not know, so nothing unvalidated rides along', () => {
  expect(messages({ ...FAMILY, admin: true })).toHaveLength(1);
  expect(messages({ ...FAMILY, people: 10 })).toHaveLength(1);
});

it('reports every problem at once', () => {
  expect(messages({ ...FAMILY, place: '', adults: 99, commute: 'x' })).toHaveLength(3);
});
