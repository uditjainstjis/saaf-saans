/**
 * Factors: masks, and the PM2.5 levels at which advice changes. Combined with
 * the other families in ./index.ts.
 */

import type { Factor } from '../types';
import { assumed, assumedFrom, published } from './factor';

const niosh = published('US CDC/NIOSH: an N95 filters at least 95% of airborne particles');
const epa = published(
  'US EPA, Final Updates to the Air Quality Index (AQI) for Particulate Matter, fact sheet (2024)',
);
const who = assumedFrom(
  'Threshold set at the 24-hour PM2.5 level of the WHO global air quality guidelines (2021)',
);

/** Mask performance and action thresholds. */
export const PROTECTION_FACTORS = {
  n95Filter: niosh('N95 filtration when worn', 0.95, 'fraction'),
  maskFit: assumed('Share of N95 filtration kept with an everyday fit', 0.7, 'fraction'),
  whoDaily: who('PM2.5 above which protective steps are advised', 15, 'µg/m³'),
  sensitiveLimit: epa('PM2.5 above which air is unhealthy for sensitive groups', 35.4, 'µg/m³'),
  generalLimit: epa('PM2.5 above which air is unhealthy for everyone', 55.4, 'µg/m³'),
} as const satisfies Record<string, Factor>;
