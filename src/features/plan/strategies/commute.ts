/**
 * Shared arithmetic of the commute strategies: weekly distance and the
 * factors every commute calculation cites. Used by ./switch-commute.ts and
 * ./keep-commute.ts.
 */

import { FACTORS, type FactorId } from '../../impact/factors';
import { weeklyKm } from '../../impact/service';
import type { Situation } from '../types';

/** Kilometres the profile's commuters travel in a week. */
export const commuteKm = (s: Situation): number =>
  weeklyKm({
    oneWayKm: s.profile.commuteKm,
    daysPerWeek: FACTORS.commuteDays.value,
    travellers: s.travellers,
  });

/** The factors every commute calculation uses, for this kind of profile. */
export const commuteFactors = (s: Situation): FactorId[] =>
  s.profile.mode === 'family' ? ['commuteDays'] : ['commuteDays', 'groupUptake'];
