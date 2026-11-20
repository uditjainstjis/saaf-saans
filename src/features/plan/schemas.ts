/**
 * The request schema of the plan feature: the lifestyle profile a plan is
 * tailored to. Everything a visitor sends is parsed here before any other code
 * sees it: unknown keys rejected, numbers bounded, text trimmed and capped.
 */
import * as z from 'zod';
import { LIMITS, rangeMessage } from '../../config/limits';
import {
  COMMUTE_MODES,
  COOKING_FUELS,
  GROUP_TYPES,
  HOME_TYPES,
  OUTDOOR_TIMES,
} from '../../config/options';

/** A whole number within a range, with the shared wording when it is not. */
const count = (label: string, range: { min: number; max: number }): z.ZodNumber =>
  z
    .number(rangeMessage(label, range))
    .int(rangeMessage(label, range))
    .min(range.min, rangeMessage(label, range))
    .max(range.max, rangeMessage(label, range));

const yesNo = (label: string): z.ZodBoolean => z.boolean(`${label}: choose yes or no.`);

const choice = <T extends readonly [string, ...string[]]>(
  label: string,
  values: T,
): z.ZodEnum<{ [K in T[number]]: K }> =>
  z.enum(values, `${label}: choose one of the listed options.`);

/** What both kinds of profile share: the place, the commute, outdoor habits. */
const shared = {
  place: z
    .string('Enter your city or locality.')
    .trim()
    .min(LIMITS.place.min, 'Enter your city or locality.')
    .max(LIMITS.place.max, `Keep the place name under ${LIMITS.place.max} characters.`),
  notes: z
    .string('Notes must be text.')
    .trim()
    .max(LIMITS.notes.max, `Keep your notes under ${LIMITS.notes.max} characters.`),
  commute: choice('Commute', COMMUTE_MODES),
  commuteKm: z
    .number(rangeMessage('Commute distance', LIMITS.commuteKm))
    .min(LIMITS.commuteKm.min, rangeMessage('Commute distance', LIMITS.commuteKm))
    .max(LIMITS.commuteKm.max, rangeMessage('Commute distance', LIMITS.commuteKm)),
  purifier: yesNo('Air purifier'),
  sensitive: yesNo('Sensitive people'),
  outdoorTime: choice('Outdoor time', OUTDOOR_TIMES),
  outdoorMinutes: count('Outdoor minutes', LIMITS.outdoorMinutes),
};

const family = z.strictObject({
  mode: z.literal('family'),
  ...shared,
  adults: count('Adults', LIMITS.adults),
  children: count('Children', LIMITS.children),
  elders: count('Elders', LIMITS.elders),
  cookingFuel: choice('Cooking fuel', COOKING_FUELS),
  homeType: choice('Home type', HOME_TYPES),
});

const community = z.strictObject({
  mode: z.literal('community'),
  ...shared,
  groupType: choice('Group type', GROUP_TYPES),
  people: count('People in the group', LIMITS.people),
  wasteBurning: yesNo('Open burning'),
});

/** The request schema: a family profile or a community profile, told apart by `mode`. */
export const profileSchema = z.discriminatedUnion('mode', [family, community], {
  error: 'Choose who the plan is for: family or community.',
});

/** A household's profile. */
export type FamilyProfile = z.infer<typeof family>;
/** A community group's profile. */
export type CommunityProfile = z.infer<typeof community>;
/** A validated lifestyle profile. */
export type Profile = z.infer<typeof profileSchema>;
