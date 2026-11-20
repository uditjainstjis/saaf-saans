/**
 * The direct impact of a choice, in a sentence: fixed wording around the
 * engine's figures. The page shows this line under every recommendation
 * whether or not a model wrote anything, so no number depends on generative AI.
 */
import { formatNumber as n } from '../../config/limits';
import type { Impact, ImpactStatus } from './types';

/** One clause per non-zero figure of an impact. */
function clauses(impact: Impact): string[] {
  const parts: string[] = [];
  if (impact.inhaledAvoidedUg > 0) {
    parts.push(
      `about ${n(impact.inhaledAvoidedUg)} µg of PM2.5 a day not breathed in, counting everyone in the plan`,
    );
  }
  if (impact.notEmittedG > 0) {
    parts.push(
      `about ${n(impact.notEmittedG)} g of PM2.5 a week kept out of the neighbourhood’s air`,
    );
  }
  if (impact.co2eSavedKg > 0) {
    parts.push(`about ${n(impact.co2eSavedKg)} kg CO2e a week not emitted`);
  }
  return parts;
}

/** The direct impact of one recommendation, as a sentence. */
export function impactSentence({
  impact,
  status,
}: {
  impact: Impact;
  status: ImpactStatus;
}): string {
  const parts = clauses(impact);
  if (parts.length === 0) return 'Too small to measure in today’s air; worth keeping as a habit.';
  const lead = status === 'keep' ? 'Already saving' : 'Direct impact';
  return `${lead}: ${parts.join(', and ')}.`;
}
