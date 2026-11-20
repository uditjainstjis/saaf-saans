/**
 * The cities the offline fallback knows, with illustrative winter-mean PM2.5
 * for each. These are round figures for a north-Indian smog season, not
 * measurements, and every report built from them is marked `typical`.
 */

import type { Place } from '../types';

/** A known city: a place, and its illustrative winter-mean PM2.5 (µg/m³). */
export interface KnownCity extends Place {
  winterPm25: number;
}

/** Name, state, latitude, longitude, winter-mean PM2.5. */
type Row = readonly [string, string, number, number, number];

const ROWS: readonly Row[] = [
  ['Delhi', 'National Capital Territory of Delhi', 28.65, 77.23, 180],
  ['Gurugram', 'Haryana', 28.46, 77.03, 160],
  ['Noida', 'Uttar Pradesh', 28.58, 77.33, 170],
  ['Lucknow', 'Uttar Pradesh', 26.85, 80.95, 130],
  ['Kanpur', 'Uttar Pradesh', 26.45, 80.33, 140],
  ['Patna', 'Bihar', 25.59, 85.14, 150],
  ['Jaipur', 'Rajasthan', 26.91, 75.79, 100],
  ['Kolkata', 'West Bengal', 22.57, 88.36, 100],
  ['Mumbai', 'Maharashtra', 19.08, 72.88, 70],
  ['Bengaluru', 'Karnataka', 12.97, 77.59, 40],
];

const CITIES: readonly KnownCity[] = ROWS.map(([name, state, latitude, longitude, winterPm25]) => ({
  name,
  region: `${state}, India`,
  latitude,
  longitude,
  winterPm25,
}));

/** PM2.5 assumed for a place the fallback does not know. */
export const DEFAULT_WINTER_PM25 = 100;

/** The known city with this name, compared without case or surrounding space. */
export const knownCity = (name: string): KnownCity | undefined =>
  CITIES.find((known) => known.name.toLowerCase() === name.trim().toLowerCase());
