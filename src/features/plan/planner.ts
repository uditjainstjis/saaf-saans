import type { Situation } from './situation';
import { STRATEGIES } from './strategies/registry';
import { impact, type Strategy } from './strategies/strategy';
import type { Impact, Plan, Recommendation } from './types';

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

/**
 * The deterministic plan for a situation: every strategy that applies, in
 * registry order, and what the new changes add up to.
 *
 * @param strategies the strategies to run; the registry unless a caller supplies its own
 */
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

/** A total dose, the people it is shared by, and the air it is compared with. */
export interface DoseInContext {
  doseUg: number;
  people: number;
  /** Today's outdoor PM2.5, µg/m³. */
  pm25: number;
  /** Air breathed at rest, m³/h. */
  restRate: number;
}

/**
 * A dose restated as minutes of breathing today's outdoor air at rest, per
 * person on average, so a number of micrograms means something to a person.
 */
export function asOutdoorMinutes({ doseUg, people, pm25, restRate }: DoseInContext): number {
  return pm25 > 0 ? Math.round((doseUg / people / (pm25 * restRate)) * 60) : 0;
}
