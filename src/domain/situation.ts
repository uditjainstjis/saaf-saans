import { FACTORS, type FactorId } from './factors';
import { outlookFor, type Outlook } from './forecast';
import type { Profile } from './profile';
import type { AirReport } from './types';

/**
 * Everything a recommendation strategy needs to know, derived once from the
 * profile and the air report so no strategy re-derives it differently.
 */
export interface Situation {
  profile: Profile;
  air: AirReport;
  outlook: Outlook;
  /** Everyone the plan covers. */
  people: number;
  /** People who make the regular commute. */
  travellers: number;
  /** True when children, elders or people with asthma or heart disease are covered. */
  vulnerable: boolean;
  /** The factor giving the share of outdoor PM2.5 that reaches indoors here. */
  infiltrationId: FactorId;
}

const HOME_INFILTRATION = {
  apartment: 'infiltrationApartment',
  house: 'infiltrationHouse',
  roadside: 'infiltrationRoadside',
} as const satisfies Record<string, FactorId>;

/** The situation of a household. */
function familySituation(
  profile: Extract<Profile, { mode: 'family' }>,
): Omit<Situation, 'profile' | 'air' | 'outlook'> {
  return {
    people: profile.adults + profile.children + profile.elders,
    travellers: profile.adults,
    vulnerable: profile.sensitive || profile.children > 0 || profile.elders > 0,
    infiltrationId: HOME_INFILTRATION[profile.homeType],
  };
}

/** The situation of a group: a stated share of it joins any shared travel change. */
function communitySituation(
  profile: Extract<Profile, { mode: 'community' }>,
): Omit<Situation, 'profile' | 'air' | 'outlook'> {
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
