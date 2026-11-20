/**
 * Profiles, a place and air reports shared by the suite, and the two helpers
 * that turn them into a situation or a brief exactly as production code does.
 */

import { adviceFor, bandFor } from '../../src/features/air-quality/aqi';
import type { AirReport, HourReading, Place } from '../../src/features/air-quality/types';
import { buildPlan } from '../../src/features/plan/planner';
import type { CommunityProfile, FamilyProfile, Profile } from '../../src/features/plan/schemas';
import { situationOf } from '../../src/features/plan/situation';
import type { PlanBrief, Situation } from '../../src/features/plan/types';

/** The place every fixture is in. */
export const DELHI: Place = {
  name: 'Delhi',
  region: 'National Capital Territory of Delhi, India',
  latitude: 28.65,
  longitude: 77.23,
};

/** A household of four: two adults who drive, a child and an elder. */
export const FAMILY: FamilyProfile = {
  mode: 'family',
  place: 'Delhi',
  notes: 'Grandmother has asthma.',
  commute: 'car',
  commuteKm: 12,
  purifier: false,
  sensitive: false,
  outdoorTime: 'morning',
  outdoorMinutes: 30,
  adults: 2,
  children: 1,
  elders: 1,
  cookingFuel: 'lpg_png',
  homeType: 'apartment',
};

/** A residents’ association of 200 that burns waste nearby. */
export const COMMUNITY: CommunityProfile = {
  mode: 'community',
  place: 'Delhi',
  notes: '',
  commute: 'two_wheeler',
  commuteKm: 5,
  purifier: false,
  sensitive: false,
  outdoorTime: 'morning',
  outdoorMinutes: 20,
  groupType: 'rwa',
  people: 200,
  wasteBurning: true,
};

/** PM2.5 by hour on the fixture day: dirty at night and at 7 am, cleanest at 3 pm. */
const SMOG_BY_HOUR: Readonly<Record<number, number>> = { 7: 180, 15: 30, 22: 220 };

/** Twenty-four hours from midnight, optionally scaled. */
export function smogDay(scale = 1): AirReport['hours'] {
  const at = (hour: number): HourReading => ({
    hour,
    pm25: Math.round(scale * (SMOG_BY_HOUR[hour] ?? 120)),
  });
  return [at(0), ...Array.from({ length: 23 }, (_, i) => at(i + 1))];
}

/** A live report for an unhealthy winter day. */
export const SMOG: AirReport = {
  source: 'live',
  aqi: 186,
  pm25: 149,
  pm10: 210,
  dominant: 'pm2_5',
  hours: smogDay(),
};

/** A report with every hour at one concentration. */
export const flatAir = (pm25: number): AirReport => ({
  source: 'live',
  aqi: 20,
  pm25,
  pm10: pm25,
  dominant: 'pm2_5',
  hours: [{ hour: 0, pm25 }, ...Array.from({ length: 23 }, (_, i) => ({ hour: i + 1, pm25 }))],
});

/** The situation of a profile in some air, as production derives it. */
export const situation = (profile: Profile = FAMILY, air: AirReport = SMOG): Situation =>
  situationOf(profile, air);

/** The brief for a profile in some air, built by the real planner. */
export function briefFor(profile: Profile = FAMILY, air: AirReport = SMOG): PlanBrief {
  const s = situationOf(profile, air);
  return {
    profile,
    place: DELHI,
    air,
    plan: buildPlan(s),
    advisory: adviceFor(bandFor(air.aqi), s.vulnerable),
  };
}
