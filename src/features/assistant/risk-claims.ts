/**
 * The check against a reply that plays the air down: in air worse than
 * moderate, a text saying that nobody is at risk, or that the air is safe,
 * contradicts the health advice in the facts. Applied by ./reply-issues.ts.
 */
import { bandFor } from '../air-quality/aqi';
import type { PlanBrief } from '../plan/types';

/** A claim that nobody is at risk, or that the air is safe. */
const NO_RISK =
  /\b(?:no one|nobody|none of|no sensitive)\b[^.]*\brisk\b|\bnot at (?:any |immediate )?risk\b|\bair is safe\b/i;

/** One reason per named text that makes such a claim; none when the air is good or moderate. */
export function riskIssues(
  texts: readonly (readonly [string, string])[],
  brief: PlanBrief,
): string[] {
  const band = bandFor(brief.air.aqi);
  if (band.key === 'good' || band.key === 'moderate') return [];
  return texts
    .filter(([, text]) => NO_RISK.test(text))
    .map(
      ([name]) =>
        `${name} says nobody is at risk, but the air is ${band.label}; say who the Health advice in the FACTS names.`,
    );
}
