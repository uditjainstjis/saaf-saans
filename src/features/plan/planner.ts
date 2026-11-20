/**
 * The planner: runs whatever strategies it is given over a situation and
 * totals the result. It is closed to change; new advice is a new strategy in
 * ./strategies/registry.ts.
 */

import type { Impact } from '../impact/types';
import { STRATEGIES } from './strategies/registry';
import { impact, type Strategy } from './strategies/strategy';
import type { Plan, Recommendation, Situation } from './types';

/** The sum of the impacts of the changes still to make. */
function totalOf(recommendations: readonly Recommendation[]): Impact {
  const fresh = recommendations.filter((r) => r.status === 'new').map((r) => r.impact);
  const sum = (pick: (i: Impact) => number): number => fresh.reduce((a, i) => a + pick(i), 0);
  return impact({
    inhaledAvoidedUg: sum((i) => i.inhaledAvoidedUg),
    notEmittedG: sum((i) => i.notEmittedG),
    co2eSavedKg: sum((i) => i.co2eSavedKg),
  });
}

/** The plan for a situation: every strategy that applies, in order, and the totals. */
export function buildPlan(
  situation: Situation,
  strategies: readonly Strategy[] = STRATEGIES,
): Plan {
  const recommendations = strategies.flatMap((strategy): Recommendation[] => {
    const advice = strategy.advise(situation);
    return advice ? [{ id: strategy.id, category: strategy.category, ...advice }] : [];
  });
  return { recommendations, totals: totalOf(recommendations) };
}
