/**
 * The body of a `/api/plan` reply: the brief arranged for the page, with
 * every sentence and label composed here. The air part is
 * features/air-quality/view.ts; injection findings come from lib/prompt-guard.
 */

import { scanForInjection } from '../../lib/prompt-guard/scan';
import type { InjectionFinding } from '../../lib/prompt-guard/types';
import type { LocalDay } from '../air-quality/types';
import { type AirView, airView } from '../air-quality/view';
import { FACTORS, factorsFor } from '../impact/factors';
import { impactSentence } from '../impact/sentence';
import { asOutdoorMinutes } from '../impact/service';
import type { Factor, Impact } from '../impact/types';
import { calendarUrl } from './calendar';
import { situationOf } from './situation';
import type { PlanBrief, Recommendation } from './types';

/** A recommendation with its impact sentence and the factors behind its arithmetic. */
export interface RecommendationView extends Omit<Recommendation, 'factorIds' | 'when'> {
  impactText: string;
  factors: Factor[];
  /** A Google Calendar reminder, for advice with a clock time in a report that knows its day. */
  calendarUrl?: string;
}

/** The body of a `/api/plan` reply. */
export interface PlanView {
  place: { name: string; region: string };
  air: AirView;
  advisory: string;
  recommendations: RecommendationView[];
  /** What the new changes add up to, and that dose per person as minutes of outdoor breathing. */
  totals: Impact & { outdoorMinutes: number };
  findings: InjectionFinding[];
}

/** The page's view of one recommendation, in a report read on `local`. */
const recommendationView =
  (local: LocalDay | undefined) =>
  ({ factorIds, when, ...rest }: Recommendation): RecommendationView => ({
    ...rest,
    impactText: impactSentence(rest),
    factors: factorsFor(factorIds),
    ...(when && local ? { calendarUrl: calendarUrl({ ...rest, when }, local) } : {}),
  });

/** The plan's totals, with the inhaled dose restated per person. */
function totalsView({ profile, air, plan }: PlanBrief): PlanView['totals'] {
  const outdoorMinutes = asOutdoorMinutes({
    doseUg: plan.totals.inhaledAvoidedUg,
    people: situationOf(profile, air).people,
    pm25: air.pm25,
    restRate: FACTORS.breathingRest.value,
  });
  return { ...plan.totals, outdoorMinutes };
}

/** The page's view of a brief. */
export function presentPlan(brief: PlanBrief): PlanView {
  const { place, air, plan, advisory, profile } = brief;
  return {
    place: { name: place.name, region: place.region },
    air: airView(air),
    advisory,
    recommendations: plan.recommendations.map(recommendationView(air.local)),
    totals: totalsView(brief),
    findings: [
      ...scanForInjection(profile.place, 'place'),
      ...scanForInjection(profile.notes, 'notes'),
    ],
  };
}
