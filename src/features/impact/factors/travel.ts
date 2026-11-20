/**
 * Factors: greenhouse gas per kilometre by way of travelling (UK government
 * conversion factors, 2024) and the assumptions that turn a commute into a
 * weekly distance. Combined with the other families in ./index.ts.
 */

import type { Factor } from '../types';
import { assumed, published } from './factor';

const desnz = published(
  'UK DESNZ/DEFRA Greenhouse Gas Conversion Factors 2024, Business travel – land',
);

/** Emissions per kilometre, and the shape of a commuting week. */
export const TRAVEL_FACTORS = {
  carCo2e: desnz('Average petrol car', 0.1645, 'kg CO2e/km'),
  twoWheelerCo2e: desnz('Average motorbike', 0.1137, 'kg CO2e/km'),
  busCo2e: desnz('Average local bus', 0.1085, 'kg CO2e/passenger-km'),
  metroCo2e: desnz('Light rail and tram', 0.0286, 'kg CO2e/passenger-km'),
  commuteDays: assumed('Commuting days', 5, 'days/week'),
  walkSpeed: assumed('Walking speed', 5, 'km/h'),
  cycleSpeed: assumed('Cycling speed', 15, 'km/h'),
  roadSpeed: assumed('City speed by scooter or bus', 20, 'km/h'),
  groupUptake: assumed('Share of a group that joins a shared change', 0.3, 'fraction'),
} as const satisfies Record<string, Factor>;
