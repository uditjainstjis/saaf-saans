/**
 * Every number the impact engine multiplies by, in one table assembled from
 * the factor families in this folder. A new family is a new file and one
 * spread here; recommendations cite factors by id.
 */

import type { Factor } from '../types';
import { BREATHING_FACTORS } from './breathing';
import { BUILDING_FACTORS } from './buildings';
import { BURNING_FACTORS } from './burning';
import { CLEANER_FACTORS } from './cleaners';
import { PROTECTION_FACTORS } from './protection';
import { TRAVEL_FACTORS } from './travel';

/** The factor table. Keys are the ids recommendations cite. */
export const FACTORS = {
  ...BREATHING_FACTORS,
  ...TRAVEL_FACTORS,
  ...BURNING_FACTORS,
  ...PROTECTION_FACTORS,
  ...CLEANER_FACTORS,
  ...BUILDING_FACTORS,
} as const;

/** The id of a factor in {@link FACTORS}. */
export type FactorId = keyof typeof FACTORS;

/** The factors with these ids, for showing beside a recommendation. */
export function factorsFor(ids: readonly string[]): Factor[] {
  return Object.entries(FACTORS)
    .filter(([id]) => ids.includes(id))
    .map(([, factor]) => factor);
}
