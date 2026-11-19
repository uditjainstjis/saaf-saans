/**
 * The arithmetic of the impact engine: pure functions of their arguments, with
 * no knowledge of profiles, wording or where a factor came from. Every number
 * the page shows beside a recommendation is produced here.
 */

/** A value rounded to one decimal place, as impacts are reported. */
export const round1 = (value: number): number => Math.round(value * 10) / 10;

/** What one stretch of breathing takes in: where, how hard, how long, how many people. */
export interface Breathing {
  /** PM2.5 in the air breathed, µg/m³. */
  pm25: number;
  /** Air breathed per person, m³/h. */
  rate: number;
  hours: number;
  people: number;
}

/** PM2.5 inhaled, in µg: concentration × air breathed per hour × hours × people. */
export function inhaledDose({ pm25, rate, hours, people }: Breathing): number {
  return pm25 * rate * hours * people;
}

/**
 * The share of indoor particles an air cleaner removes at steady state, from a
 * single-zone mass balance: cleaning rate over total removal rate, where the
 * cleaning rate is the cleaner's clean air delivery rate over the room volume.
 *
 * @param cadr        clean air delivery rate, m³/h
 * @param volume      room volume, m³
 * @param naturalLoss removal without the cleaner (air exchange and settling), per hour
 */
export function cleanerReduction(cadr: number, volume: number, naturalLoss: number): number {
  const cleaning = cadr / volume;
  return cleaning / (cleaning + naturalLoss);
}

/** A regular return trip: who travels, how far each way, how many days a week. */
export interface Trip {
  oneWayKm: number;
  daysPerWeek: number;
  travellers: number;
}

/** Kilometres travelled in a week over every traveller, there and back. */
export function weeklyKm({ oneWayKm, daysPerWeek, travellers }: Trip): number {
  return oneWayKm * 2 * daysPerWeek * travellers;
}

/** Greenhouse gas from a week of trips, kg CO2e, at `perKm` kg CO2e per kilometre. */
export function weeklyTravelCo2e(trip: Trip, perKm: number): number {
  return weeklyKm(trip) * perKm;
}
