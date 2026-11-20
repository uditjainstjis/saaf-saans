/**
 * Derives the situation a plan is built for from a profile and an air report,
 * once, so no strategy re-derives it differently. The type is ./types.ts.
 */

import { outlookFor } from '../air-quality/forecast';
import type { AirReport } from '../air-quality/types';
import { type FactorId, FACTORS } from '../impact/factors';
import type { CommunityProfile, FamilyProfile, Profile } from './schemas';
import type { Situation } from './types';

const HOME_INFILTRATION = {
  apartment: 'infiltrationApartment',
  house: 'infiltrationHouse',
  roadside: 'infiltrationRoadside',
} as const satisfies Record<string, FactorId>;

type Derived = Omit<Situation, 'profile' | 'air' | 'outlook'>;

/** A household: everyone is covered, the adults commute. */
function familySituation(profile: FamilyProfile): Derived {
  return {
    people: profile.adults + profile.children + profile.elders,
    travellers: profile.adults,
    vulnerable: profile.sensitive || profile.children > 0 || profile.elders > 0,
    infiltrationId: HOME_INFILTRATION[profile.homeType],
  };
}

/** A group: everyone is covered, a stated share of it joins any shared travel change. */
function communitySituation(profile: CommunityProfile): Derived {
  return {
    people: profile.people,
    travellers: Math.round(profile.people * FACTORS.groupUptake.value),
    vulnerable: profile.sensitive || profile.groupType === 'school',
    infiltrationId: 'infiltrationShared',
  };
}

/** The situation a plan is built for. */
export function situationOf(profile: Profile, air: AirReport): Situation {
  const derived =
    profile.mode === 'family' ? familySituation(profile) : communitySituation(profile);
  return { profile, air, outlook: outlookFor(air.hours), ...derived };
}
