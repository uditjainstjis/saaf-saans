/**
 * Reading the US AQI: which band an index falls in, what to advise, how each
 * pollutant is named, and the index for a PM2.5 concentration. The band data
 * is ./aqi-bands.ts.
 */

import { type AqiBand, AQI_BANDS, HAZARDOUS_BAND } from './aqi-bands';
import type { Pollutant } from './types';

/** The category a US AQI value falls in. */
export function bandFor(aqi: number): AqiBand {
  return AQI_BANDS.find((band) => aqi <= band.upTo) ?? HAZARDOUS_BAND;
}

/** The band's advice for this audience. */
export function adviceFor(band: AqiBand, vulnerable: boolean): string {
  return vulnerable ? band.sensitive : band.general;
}

/** How each pollutant is named on the page. */
export const POLLUTANT_LABEL: Readonly<Record<Pollutant, string>> = {
  pm2_5: 'PM2.5 (fine particles)',
  pm10: 'PM10 (coarse particles)',
  nitrogen_dioxide: 'Nitrogen dioxide',
  ozone: 'Ozone',
  sulphur_dioxide: 'Sulphur dioxide',
};

/**
 * US EPA PM2.5 breakpoints (2024): concentration range in µg/m³, then the
 * index range it maps to. EPA's table ends at "225.5+"; spreading 301 to 500
 * up to 325.4 µg/m³ is this project's assumption, used only for offline values.
 */
const PM25_BREAKPOINTS: readonly (readonly [number, number, number, number])[] = [
  [0, 9, 0, 50],
  [9, 35.4, 50, 100],
  [35.4, 55.4, 100, 150],
  [55.4, 125.4, 150, 200],
  [125.4, 225.4, 200, 300],
  [225.4, 325.4, 300, 500],
];

/** The US AQI for a PM2.5 concentration, interpolated within its range; 500 above the scale. */
export function aqiFromPm25(pm25: number): number {
  const range = PM25_BREAKPOINTS.find(([, high]) => pm25 <= high);
  if (!range) return 500;
  const [low, high, indexLow, indexHigh] = range;
  return Math.round(indexLow + ((pm25 - low) / (high - low)) * (indexHigh - indexLow));
}
