/**
 * The facts of one plan, as text: the only source of numbers a model may
 * use. Everything numeric here was computed by the impact engine. The
 * standing instructions are ./prompt.ts; the full prompt is ./prompt-builder.ts.
 */
import { LABELS } from '../../config/labels';
import { formatNumber as n } from '../../config/limits';
import { bandFor, POLLUTANT_LABEL } from '../air-quality/aqi';
import { clock, outlookFor } from '../air-quality/forecast';
import { impactSentence } from '../impact/sentence';
import type { Profile } from '../plan/schemas';
import type { PlanBrief, Recommendation } from '../plan/types';

/** Who the plan is for, in a line. */
function describe(profile: Profile): string {
  const common = `commute: ${LABELS.commute[profile.commute]}, ${n(profile.commuteKm)} km each way; outdoor activity: ${LABELS.outdoorTime[profile.outdoorTime]}, ${n(profile.outdoorMinutes)} minutes; air purifier: ${profile.purifier ? 'yes' : 'no'}; sensitive people (asthma, heart or lung disease): ${profile.sensitive ? 'yes' : 'no'}`;
  if (profile.mode === 'family') {
    return `A family of ${n(profile.adults)} adults, ${n(profile.children)} children and ${n(profile.elders)} elders; home: ${LABELS.homeType[profile.homeType]}; cooking fuel: ${LABELS.cookingFuel[profile.cookingFuel]}; ${common}`;
  }
  return `A community: ${LABELS.groupType[profile.groupType]} of ${n(profile.people)} people; open burning of waste or leaves nearby: ${profile.wasteBurning ? 'yes' : 'no'}; ${common}`;
}

/** One recommendation as a fact line. */
const line = (r: Recommendation): string =>
  `- id: ${r.id} | ${LABELS.category[r.category]} | ${r.title} | ${r.action} | ${impactSentence(r)}`;

/** The computed facts of a brief: the only source of numbers the model may use. */
export function factsOf({ profile, air, plan, advisory }: PlanBrief): string {
  const { best, worst } = outlookFor(air.hours);
  return [
    `Air now (${air.source === 'live' ? 'live reading' : 'typical winter values, live data unavailable'}): US AQI ${n(air.aqi)}, ${bandFor(air.aqi).label}; PM2.5 ${n(air.pm25)} µg/m³; PM10 ${n(air.pm10)} µg/m³; dominant pollutant: ${POLLUTANT_LABEL[air.dominant]}.`,
    `Next day: cleanest around ${clock(best.hour)} (PM2.5 ${n(best.pm25)} µg/m³), worst around ${clock(worst.hour)} (PM2.5 ${n(worst.pm25)} µg/m³).`,
    `Health advice: ${advisory}`,
    `Profile: ${describe(profile)}.`,
    'Recommendations:',
    ...plan.recommendations.map(line),
  ].join('\n');
}
