import type { Pollutant } from './types';

/**
 * US AQI categories (AirNow, "AQI Basics"): what an index value means, in
 * words. A band carries its name, a text symbol and its advice, so the page
 * never has to rely on colour to say how bad the air is.
 */

/** One AQI category, with what it means for everyone and for sensitive people. */
export interface AqiBand {
  /** Stable key, used for the band's CSS class. */
  key: 'good' | 'moderate' | 'sensitive' | 'unhealthy' | 'very-unhealthy' | 'hazardous';
  /** Highest index value in the band. */
  upTo: number;
  label: string;
  /** A text symbol that grows with severity: a non-colour cue. */
  symbol: string;
  general: string;
  sensitive: string;
}

/** The bounded bands, mildest first. */
const BANDS: readonly AqiBand[] = [
  {
    key: 'good',
    upTo: 50,
    label: 'Good',
    symbol: '○',
    general: 'Air quality is good. Enjoy time outdoors.',
    sensitive: 'Air quality is good for everyone, including children and elders.',
  },
  {
    key: 'moderate',
    upTo: 100,
    label: 'Moderate',
    symbol: '◔',
    general: 'Air quality is acceptable. Outdoor activity is fine for most people.',
    sensitive: 'Unusually sensitive people should keep hard outdoor exercise short.',
  },
  {
    key: 'sensitive',
    upTo: 150,
    label: 'Unhealthy for sensitive groups',
    symbol: '◑',
    general: 'Most people can carry on; take more breaks during outdoor exercise.',
    sensitive:
      'Children, elders and people with asthma or heart disease should cut back on outdoor exertion.',
  },
  {
    key: 'unhealthy',
    upTo: 200,
    label: 'Unhealthy',
    symbol: '◕',
    general: 'Everyone should shorten outdoor exertion and wear an N95 mask outside.',
    sensitive:
      'Children, elders and people with asthma or heart disease should stay indoors with windows shut.',
  },
  {
    key: 'very-unhealthy',
    upTo: 300,
    label: 'Very unhealthy',
    symbol: '●',
    general: 'Avoid outdoor exertion. Wear an N95 mask for every trip outside.',
    sensitive:
      'Children, elders and people with asthma or heart disease should avoid all outdoor activity.',
  },
];

/** Everything above the last bounded band. */
const HAZARDOUS: AqiBand = {
  key: 'hazardous',
  upTo: Infinity,
  label: 'Hazardous',
  symbol: '⬤',
  general: 'Health emergency. Stay indoors, keep windows shut and run a purifier if you have one.',
  sensitive:
    'Health emergency. Keep children, elders and anyone with asthma or heart disease indoors in the cleanest room.',
};

/** The category a US AQI value falls in. */
export function bandFor(aqi: number): AqiBand {
  return BANDS.find((band) => aqi <= band.upTo) ?? HAZARDOUS;
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
