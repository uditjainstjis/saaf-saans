/**
 * Types of the air-quality feature (location tailoring): a resolved place, an
 * air report, and the two ports that produce them. Adapters are in
 * ./providers/, the lookup that combines them in ./service.ts.
 */

/** A resolved location: where the air is read for. */
export interface Place {
  name: string;
  /** State and country, for telling two places with one name apart. */
  region: string;
  latitude: number;
  longitude: number;
}

/** The pollutants an air report can name as dominant. */
export const POLLUTANTS = [
  'pm2_5',
  'pm10',
  'nitrogen_dioxide',
  'ozone',
  'sulphur_dioxide',
] as const;
/** One of {@link POLLUTANTS}. */
export type Pollutant = (typeof POLLUTANTS)[number];

/** PM2.5 (µg/m³) for one hour of the forecast, by local hour of day (0 to 23). */
export interface HourReading {
  hour: number;
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

/** Turns a place name someone typed into coordinates; null when there is no match. */
export interface Geocoder {
  find(query: string): Promise<Place | null>;
}

/** Reads the air at a place. Rejects when it cannot. */
export interface AirQualityProvider {
  read(place: Place): Promise<AirReport>;
}

/** What a lookup depends on: somewhere to find places, somewhere to read air. */
export interface AirSources {
  geocoder: Geocoder;
  air: AirQualityProvider;
}

/** A place and the air there. */
export interface LocatedAir {
  place: Place;
  air: AirReport;
}
