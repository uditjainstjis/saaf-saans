/**
 * Helpers for strategy tests: the recommendation one strategy makes for a
 * profile in some air, found by id in the plan the real planner builds.
 */

import type { AirReport } from '../../src/features/air-quality/types';
import { buildPlan } from '../../src/features/plan/planner';
import type { Profile } from '../../src/features/plan/schemas';
import type { Recommendation } from '../../src/features/plan/types';
import { SMOG, situation } from './fixtures';

/** The recommendation with this id for a profile in some air, if the strategy makes one. */
export function advice(
  id: string,
  profile: Profile,
  air: AirReport = SMOG,
): Recommendation | undefined {
  return buildPlan(situation(profile, air)).recommendations.find((r) => r.id === id);
}

/** The inhaled dose that recommendation avoids, µg a day. */
export const inhaled = (id: string, profile: Profile, air?: AirReport): number | undefined =>
  advice(id, profile, air)?.impact.inhaledAvoidedUg;
