import { aqiFromPm25 } from '../domain/aqi';
import type { AirReport, HourReading, Place } from '../domain/types';
import type { AirQualityProvider, Clock, Geocoder } from '../ports';

/**
 * The offline fallback: typical winter air for when Open-Meteo cannot be
 * reached, so the assistant still answers. Reports from here are marked
 * `typical`, and the page says so in words; they are illustrative round
 * figures for a north-Indian smog season, not measurements.
 */

/** A city the fallback knows: where it is, and its illustrative winter-mean PM2.5 (µg/m³). */
interface KnownCity extends Place {
  winterPm25: number;
}

const city = (
  name: string,
  region: string,
  at: [number, number],
  winterPm25: number,
): KnownCity => ({
  name,
  region: `${region}, India`,
  latitude: at[0],
  longitude: at[1],
  winterPm25,
});

const CITIES: readonly KnownCity[] = [
  city('Delhi', 'National Capital Territory of Delhi', [28.65, 77.23], 180),
  city('Gurugram', 'Haryana', [28.46, 77.03], 160),
  city('Noida', 'Uttar Pradesh', [28.58, 77.33], 170),
  city('Lucknow', 'Uttar Pradesh', [26.85, 80.95], 130),
  city('Kanpur', 'Uttar Pradesh', [26.45, 80.33], 140),
  city('Patna', 'Bihar', [25.59, 85.14], 150),
  city('Jaipur', 'Rajasthan', [26.91, 75.79], 100),
  city('Kolkata', 'West Bengal', [22.57, 88.36], 100),
  city('Mumbai', 'Maharashtra', [19.08, 72.88], 70),
  city('Bengaluru', 'Karnataka', [12.97, 77.59], 40),
];

/** PM2.5 assumed for a place the fallback does not know. */
const DEFAULT_WINTER_PM25 = 100;
/** PM10 over PM2.5 in winter smog, an illustrative ratio. */
const PM10_RATIO = 1.5;

/**
 * How a winter day's PM2.5 moves around its mean, by local hour: a single
 * daily wave, lowest in mid-afternoon (0.6 of the mean at 3 pm, when the air
 * mixes deepest) and highest in the small hours (1.4 of the mean at 3 am).
 */
const shapeAt = (hour: number): number => 1 - 0.4 * Math.cos(((hour - 15) * Math.PI) / 12);

/** The known city with this name, compared without case or surrounding space. */
const knownCity = (name: string): KnownCity | undefined =>
  CITIES.find((known) => known.name.toLowerCase() === name.trim().toLowerCase());

/** Place search over the built-in cities only. */
export const typicalGeocoder: Geocoder = {
  find: (query) => {
    const match = knownCity(query);
    if (!match) return Promise.resolve(null);
    const { name, region, latitude, longitude } = match;
    return Promise.resolve({ name, region, latitude, longitude });
  },
};

/** The local hour at a longitude, from solar time: 15 degrees to the hour. */
function localHour(now: Date, longitude: number): number {
  return (((now.getUTCHours() + Math.round(longitude / 15)) % 24) + 24) % 24;
}

/** Typical winter air for a place, shaped over the next 24 hours from the clock's time. */
export function typicalAir(clock: Clock): AirQualityProvider {
  return {
    read: (place) => {
      const mean = knownCity(place.name)?.winterPm25 ?? DEFAULT_WINTER_PM25;
      const start = localHour(clock.now(), place.longitude);
      const at = (offset: number): HourReading => {
        const hour = (start + offset) % 24;
        return { hour, pm25: Math.round(mean * shapeAt(hour)) };
      };
      const now = at(0);
      const report: AirReport = {
        source: 'typical',
        aqi: aqiFromPm25(now.pm25),
        pm25: now.pm25,
        pm10: Math.round(now.pm25 * PM10_RATIO),
        dominant: 'pm2_5',
        hours: [now, ...Array.from({ length: 23 }, (_, i) => at(i + 1))],
      };
      return Promise.resolve(report);
    },
  };
}
