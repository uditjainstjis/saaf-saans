/**
 * Tests for the bounds the profile schema puts on each field, in the wording
 * the form shares.
 */
import { expect, it } from 'vitest';
import { COMMUNITY, FAMILY } from '../../support/fixtures';
import { messages } from '../../support/profile-messages';

it('bounds every number, in the shared wording', () => {
  expect(messages({ ...FAMILY, adults: 0 })).toEqual(['Adults must be between 1 and 12.']);
  expect(messages({ ...FAMILY, children: 13 })).toEqual(['Children must be between 0 and 12.']);
  expect(messages({ ...FAMILY, elders: 1.5 })).toEqual(['Elders must be between 0 and 12.']);
  expect(messages({ ...FAMILY, commuteKm: -1 })).toEqual([
    'Commute distance must be between 0 and 150.',
  ]);
  expect(messages({ ...FAMILY, commuteKm: 151 })).toEqual([
    'Commute distance must be between 0 and 150.',
  ]);
  expect(messages({ ...FAMILY, commuteKm: 'far' })).toEqual([
    'Commute distance must be between 0 and 150.',
  ]);
  expect(messages({ ...FAMILY, outdoorMinutes: 241 })).toEqual([
    'Outdoor minutes must be between 0 and 240.',
  ]);
  expect(messages({ ...COMMUNITY, people: 4 })).toEqual([
    'People in the group must be between 5 and 50,000.',
  ]);
  expect(messages({ ...FAMILY, adults: '2' })).toEqual(['Adults must be between 1 and 12.']);
});

it('bounds text', () => {
  expect(messages({ ...FAMILY, place: 'D' })).toEqual(['Enter your city or locality.']);
  expect(messages({ ...FAMILY, place: 7 })).toEqual(['Enter your city or locality.']);
  expect(messages({ ...FAMILY, place: 'x'.repeat(81) })).toEqual([
    'Keep the place name under 80 characters.',
  ]);
  expect(messages({ ...FAMILY, notes: 'x'.repeat(301) })).toEqual([
    'Keep your notes under 300 characters.',
  ]);
  expect(messages({ ...FAMILY, notes: null })).toEqual(['Notes must be text.']);
});

it('rejects choices and flags outside their lists', () => {
  expect(messages({ ...FAMILY, commute: 'helicopter' })).toEqual([
    'Commute: choose one of the listed options.',
  ]);
  expect(messages({ ...FAMILY, cookingFuel: 'kerosene' })).toEqual([
    'Cooking fuel: choose one of the listed options.',
  ]);
  expect(messages({ ...FAMILY, purifier: 'yes' })).toEqual(['Air purifier: choose yes or no.']);
  expect(messages({ ...COMMUNITY, groupType: 'army' })).toEqual([
    'Group type: choose one of the listed options.',
  ]);
});
