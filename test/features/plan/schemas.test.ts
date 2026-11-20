import { describe, expect, it } from 'vitest';
import { profileSchema } from '../../../src/features/plan/schemas';
import { COMMUNITY, FAMILY } from '../../support/fixtures';

const messages = (input: unknown): string[] => {
  const parsed = profileSchema.safeParse(input);
  return parsed.success ? [] : parsed.error.issues.map((i) => i.message);
};

describe('profileSchema', () => {
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

  it('reports every problem at once', () => {
    expect(messages({ ...FAMILY, place: '', adults: 99, commute: 'x' })).toHaveLength(3);
  });
});
