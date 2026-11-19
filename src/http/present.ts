import { bandFor, POLLUTANT_LABEL } from '../domain/aqi';
import { impactSentence } from '../domain/explain';
import { FACTORS, factorsFor } from '../domain/factors';
import { clock, outlookFor } from '../domain/forecast';
import { asOutdoorMinutes } from '../domain/plan';
import type { HourReading } from '../domain/types';
import type { PlanBrief } from '../ports';
import { scanForInjection, type InjectionFinding } from '../security/guard';

/** An hour of the forecast as the page shows it. */
const hourView = ({ hour, pm25 }: HourReading): { time: string; pm25: number } => ({
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
export function presentPlan(brief: PlanBrief): object {
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
      outdoorMinutes: asOutdoorMinutes(
        plan.totals.inhaledAvoidedUg,
        air.pm25,
        FACTORS.breathingRest.value,
      ),
    },
    findings: findingsIn(brief),
  };
}
