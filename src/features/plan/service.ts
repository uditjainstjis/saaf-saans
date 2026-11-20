/**
 * The use case both API routes share: look up the air for the profile's place
 * and compute the plan. Everything in the brief is deterministic given the air
 * report; the generative step only ever receives the finished brief.
 */

import { adviceFor, bandFor } from '../air-quality/aqi';
import { lookupAir } from '../air-quality/service';
import type { AirSources } from '../air-quality/types';
import { buildPlan } from './planner';
import type { Profile } from './schemas';
import { situationOf } from './situation';
import type { PlanBrief } from './types';

/** The brief for a validated profile: place, air, plan and health advice. */
export async function prepareBrief(sources: AirSources, profile: Profile): Promise<PlanBrief> {
  const { place, air } = await lookupAir(sources, profile.place);
  const situation = situationOf(profile, air);
  return {
    profile,
    place,
    air,
    plan: buildPlan(situation),
    advisory: adviceFor(bandFor(air.aqi), situation.vulnerable),
  };
}
