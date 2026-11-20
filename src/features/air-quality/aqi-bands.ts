/**
 * The US AQI categories (AirNow, "AQI Basics") as data: each band's name, a
 * text symbol and its advice, so the page never relies on colour to say how
 * bad the air is. Looked up by ./aqi.ts.
 */

/** One AQI category, with what it means for everyone and for sensitive people. */
export interface AqiBand {
  /** Stable key, used for the band's CSS class. */
  key: 'good' | 'moderate' | 'sensitive' | 'unhealthy' | 'very-unhealthy' | 'hazardous';
  /** Highest index value in the band. */
  upTo: number;
  label: string;
  /** A text symbol that fills as severity grows: a non-colour cue. */
  symbol: string;
  general: string;
  sensitive: string;
}

const AT_RISK = 'Children, elders and people with asthma or heart disease';

/** The bounded bands, mildest first. */
export const AQI_BANDS: readonly AqiBand[] = [
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
    sensitive: `${AT_RISK} should cut back on outdoor exertion.`,
  },
  {
    key: 'unhealthy',
    upTo: 200,
    label: 'Unhealthy',
    symbol: '◕',
    general: 'Everyone should shorten outdoor exertion and wear an N95 mask outside.',
    sensitive: `${AT_RISK} should stay indoors with windows shut.`,
  },
  {
    key: 'very-unhealthy',
    upTo: 300,
    label: 'Very unhealthy',
    symbol: '●',
    general: 'Avoid outdoor exertion. Wear an N95 mask for every trip outside.',
    sensitive: `${AT_RISK} should avoid all outdoor activity.`,
  },
];

/** Everything above the last bounded band. */
export const HAZARDOUS_BAND: AqiBand = {
  key: 'hazardous',
  upTo: Infinity,
  label: 'Hazardous',
  symbol: '⬤',
  general: 'Health emergency. Stay indoors, keep windows shut and run a purifier if you have one.',
  sensitive:
    'Health emergency. Keep children, elders and anyone with asthma or heart disease indoors in the cleanest room.',
};
