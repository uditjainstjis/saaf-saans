/**
 * Factors: how much air a person breathes by activity. Short-term inhalation
 * rates from the US EPA Exposure Factors Handbook, converted from m³/minute.
 * Combined with the other families in ./index.ts.
 */

import type { Factor } from '../types';
import { published } from './factor';

const efh = published(
  'US EPA Exposure Factors Handbook (2011), Table 6-2, adults 21 to <31 years, mean',
);

/** Air breathed per hour, by activity level. */
export const BREATHING_FACTORS = {
  breathingSleep: efh('Air breathed while asleep', 0.26, 'm³/h'),
  breathingRest: efh('Air breathed while sitting', 0.25, 'm³/h'),
  breathingLight: efh('Air breathed in light activity or walking', 0.72, 'm³/h'),
  breathingActive: efh('Air breathed in moderate exercise', 1.56, 'm³/h'),
} as const satisfies Record<string, Factor>;
