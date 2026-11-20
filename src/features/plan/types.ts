import type { Category } from '../../config/constants';

/** A resolved location: where the air is read for. */
export interface Place {
  name: string;
  /** State and country, for telling two places with one name apart. */
  region: string;
  latitude: number;
  longitude: number;
}

/** The pollutants the air report can name as dominant. */
export const POLLUTANTS = [
  'pm2_5',
  'pm10',
  'nitrogen_dioxide',
  'ozone',
  'sulphur_dioxide',
] as const;
/** One of {@link POLLUTANTS}. */
export type Pollutant = (typeof POLLUTANTS)[number];

/** PM2.5 for one hour of the forecast, in the place's local time. */
export interface HourReading {
  /** Local hour of day, 0 to 23. */
  hour: number;
  /** PM2.5 in µg/m³. */
  pm25: number;
}

/** Air quality at a place: now, and hour by hour for the next day. */
export interface AirReport {
  /** `live` from Open-Meteo, or `typical` winter values when it cannot be reached. */
  source: 'live' | 'typical';
  /** US AQI, 0 to 500. */
  aqi: number;
  /** µg/m³. */
  pm25: number;
  /** µg/m³. */
  pm10: number;
  dominant: Pollutant;
  /** The next 24 hours, in order, starting with the current hour. */
  hours: readonly [HourReading, ...HourReading[]];
}

/** What one recommendation changes, as computed by the impact engine. */
export interface Impact {
  /** PM2.5 not breathed in, µg per day, summed over the people covered. */
  inhaledAvoidedUg: number;
  /** PM2.5 not emitted into the neighbourhood, grams per week. */
  notEmittedG: number;
  /** Greenhouse gas not emitted, kg CO2e per week. */
  co2eSavedKg: number;
}

/** One piece of advice, with the numbers behind it. */
export interface Recommendation {
  id: string;
  category: Category;
  /** `new` for a change to make; `keep` for a choice already paying off. */
  status: 'new' | 'keep';
  title: string;
  /** What to do, in one or two sentences. */
  action: string;
  impact: Impact;
  /** The arithmetic behind {@link impact}, written out with its inputs. */
  calculation: string;
  /** Ids of the factors in src/features/impact/factors.ts the arithmetic used. */
  factorIds: readonly string[];
}

/** The deterministic plan: every recommendation, and what the new ones add up to. */
export interface Plan {
  recommendations: readonly Recommendation[];
  /** Sum over recommendations with status `new`. */
  totals: Impact;
}
