/**
 * The arithmetic of the impact engine: pure functions of their arguments,
 * with no knowledge of profiles or wording. Every number the page shows
 * beside a recommendation is produced here. Factors: ./factors/index.ts.
 */

import type { Breathing, DoseInContext, Trip } from './types';

/** A value rounded to one decimal place, as impacts are reported. */
export const round1 = (value: number): number => Math.round(value * 10) / 10;

/** PM2.5 inhaled, in µg: concentration × air breathed per hour × hours × people. */
export function inhaledDose({ pm25, rate, hours, people }: Breathing): number {
  return pm25 * rate * hours * people;
}

/**
 * The share of indoor particles an air cleaner removes at steady state, from a
 * single-zone mass balance: cleaning rate over total removal rate.
 *
 * @param cadr        clean air delivery rate, m³/h
 * @param volume      room volume, m³
 * @param naturalLoss removal without the cleaner (air exchange and settling), per hour
 */
export function cleanerReduction(cadr: number, volume: number, naturalLoss: number): number {
  const cleaning = cadr / volume;
  return cleaning / (cleaning + naturalLoss);
}

/** Kilometres travelled in a week over every traveller, there and back. */
export function weeklyKm({ oneWayKm, daysPerWeek, travellers }: Trip): number {
  return oneWayKm * 2 * daysPerWeek * travellers;
}

/** A dose per person, restated as minutes of breathing today's outdoor air at rest. */
export function asOutdoorMinutes({ doseUg, people, pm25, restRate }: DoseInContext): number {
  return pm25 > 0 ? Math.round((doseUg / people / (pm25 * restRate)) * 60) : 0;
}
