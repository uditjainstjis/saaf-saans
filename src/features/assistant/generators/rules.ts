/**
 * The deterministic PlanGenerator: the same narrative shape as the model's,
 * written from the plan by rule. It is what the assistant says when neither
 * model gives a usable answer, so the assistant always answers. Model path:
 * ../service.ts.
 */
import { formatNumber as n } from '../../../config/limits';
import { bandFor } from '../../air-quality/aqi';
import { impactSentence } from '../../impact/sentence';
import type { Narrative, PlanGenerator } from '../types';

/** Writes the narrative from the plan alone, quoting only computed figures. */
export const rulePlanGenerator: PlanGenerator = {
  generate({ place, air, plan, advisory }) {
    const fresh = plan.recommendations.filter((r) => r.status === 'new').length;
    const band = bandFor(air.aqi).label.toLowerCase();
    const narrative: Narrative = {
      source: 'rules',
      summary: `Air in ${place.name} is ${band} right now, with a US AQI of ${n(air.aqi)}. ${advisory} The ${n(fresh)} changes below would keep everyone in the plan from breathing in about ${n(plan.totals.inhaledAvoidedUg)} µg of PM2.5 a day, and save about ${n(plan.totals.co2eSavedKg)} kg CO2e a week.`,
      explanations: Object.fromEntries(plan.recommendations.map((r) => [r.id, impactSentence(r)])),
      encouragement:
        'Start with the one step that is easiest today; clean air adds up breath by breath.',
    };
    return Promise.resolve(narrative);
  },
};
