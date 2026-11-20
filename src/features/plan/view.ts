import { bandFor, POLLUTANT_LABEL } from '../air-quality/aqi';
import { impactSentence } from '../impact/sentence';
import { FACTORS, factorsFor, type Factor } from '../impact/factors';
import { clock, outlookFor } from '../air-quality/forecast';
import { asOutdoorMinutes } from './planner';
import { situationOf } from './situation';
import type { HourReading, Impact, Recommendation } from './types';
import type { PlanBrief } from '../../lib/ports';
import { scanForInjection, type InjectionFinding } from '../../lib/prompt-guard';

/** An hour of the forecast as the page shows it. */
export interface HourView {
  /** A clock time, "7 am". */
  time: string;
  pm25: number;
}

/** A recommendation with its impact sentence and the factors behind its arithmetic. */
export interface RecommendationView extends Omit<Recommendation, 'factorIds'> {
  impactText: string;
  factors: Factor[];
}

/** The body of a `/api/plan` reply. */
export interface PlanView {
  place: { name: string; region: string };
  air: {
    source: 'live' | 'typical';
    aqi: number;
    band: { key: string; label: string; symbol: string };
    pm25: number;
    pm10: number;
    dominant: string;
    best: HourView;
    worst: HourView;
    hours: HourView[];
  };
  advisory: string;
  recommendations: RecommendationView[];
  /** What the new changes add up to, and that dose per person restated as minutes of outdoor breathing. */
  totals: Impact & { outdoorMinutes: number };
  findings: InjectionFinding[];
}

const hourView = ({ hour, pm25 }: HourReading): HourView => ({
  time: clock(hour),
  pm25,
});

/** Text aimed at an AI reader found in the visitor's free-text fields. */
const findingsIn = ({ profile }: PlanBrief): InjectionFinding[] => [
  ...scanForInjection(profile.place, 'place'),
  ...scanForInjection(profile.notes, 'notes'),
];

/**
 * The body of a `/api/plan` reply: the brief, arranged for the page. Labels,
 * clock times and sentences are composed here so the page only places text.
 */
export function presentPlan(brief: PlanBrief): PlanView {
  const { place, air, plan, advisory } = brief;
  const band = bandFor(air.aqi);
  const { best, worst } = outlookFor(air.hours);
  return {
    place: { name: place.name, region: place.region },
    air: {
      source: air.source,
      aqi: air.aqi,
      band: { key: band.key, label: band.label, symbol: band.symbol },
      pm25: air.pm25,
      pm10: air.pm10,
      dominant: POLLUTANT_LABEL[air.dominant],
      best: hourView(best),
      worst: hourView(worst),
      hours: air.hours.map(hourView),
    },
    advisory,
    recommendations: plan.recommendations.map(({ factorIds, ...recommendation }) => ({
      ...recommendation,
      impactText: impactSentence(recommendation),
      factors: factorsFor(factorIds),
    })),
    totals: {
      ...plan.totals,
      outdoorMinutes: asOutdoorMinutes({
        doseUg: plan.totals.inhaledAvoidedUg,
        people: situationOf(brief.profile, air).people,
        pm25: air.pm25,
        restRate: FACTORS.breathingRest.value,
      }),
    },
    findings: findingsIn(brief),
  };
}
