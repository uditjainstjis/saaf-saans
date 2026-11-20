import { z } from 'zod';
import { POLLUTANTS, type AirReport, type HourReading, type Pollutant } from '../../plan/types';
import { withTimeout } from '../../../lib/timeout';
import type { AirQualityProvider, Geocoder, HttpGet } from '../../../lib/ports';
import { airReportSchema } from '../schemas';

/**
 * The Open-Meteo adapters: live air quality and geocoding from a free API
 * that needs no key. Both are fetched server-side under a timeout, and both
 * replies are parsed against a schema before any value is used.
 */

const AIR_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
/** Upper bound on one upstream call; past it the fallback answers instead. */
export const UPSTREAM_TIMEOUT_MS = 4000;

const SUB_INDEX = POLLUTANTS.map((pollutant) => `us_aqi_${pollutant}` as const);
const CURRENT = ['us_aqi', 'pm2_5', 'pm10', ...SUB_INDEX].join(',');

const reading = z.number().nullable();
const airReply = z.object({
  current: z.object({
    us_aqi: z.number(),
    pm2_5: z.number(),
    pm10: z.number(),
    us_aqi_pm2_5: reading,
    us_aqi_pm10: reading,
    us_aqi_nitrogen_dioxide: reading,
    us_aqi_ozone: reading,
    us_aqi_sulphur_dioxide: reading,
  }),
  hourly: z.object({ time: z.array(z.string()), pm2_5: z.array(reading) }),
});
type AirReply = z.infer<typeof airReply>;

/** The pollutant with the highest US AQI sub-index: the one driving the index. */
function dominantOf(current: AirReply['current']): Pollutant {
  const index = (pollutant: Pollutant): number => current[`us_aqi_${pollutant}`] ?? -1;
  return POLLUTANTS.reduce((worst, pollutant) =>
    index(pollutant) > index(worst) ? pollutant : worst,
  );
}

/** The hourly forecast as readings in local time, skipping hours with no value. */
function hoursOf({ time, pm2_5 }: AirReply['hourly']): HourReading[] {
  return time.flatMap((stamp, i) => {
    const pm25 = pm2_5[i];
    // An ISO local time, "2026-11-20T07:00": characters 11 and 12 are the hour.
    return typeof pm25 === 'number' ? [{ hour: Number(stamp.slice(11, 13)), pm25 }] : [];
  });
}

/** A successful reply's JSON, or a rejection naming the status. */
async function jsonFrom(get: HttpGet, url: string, timeoutMs: number): Promise<unknown> {
  const res = await withTimeout((signal) => get(url, signal), timeoutMs);
  if (!res.ok) throw new Error(`Open-Meteo answered ${res.status}`);
  return res.json();
}

/** Live air quality for a place: current readings and the next 24 hours of PM2.5. */
export function openMeteoAir(get: HttpGet, timeoutMs = UPSTREAM_TIMEOUT_MS): AirQualityProvider {
  return {
    async read({ latitude, longitude }): Promise<AirReport> {
      const query = new URLSearchParams({
        latitude: latitude.toFixed(3),
        longitude: longitude.toFixed(3),
        current: CURRENT,
        hourly: 'pm2_5',
        forecast_hours: '24',
        timezone: 'auto',
      });
      const { current, hourly } = airReply.parse(
        await jsonFrom(get, `${AIR_URL}?${query.toString()}`, timeoutMs),
      );
      return airReportSchema.parse({
        source: 'live',
        aqi: current.us_aqi,
        pm25: current.pm2_5,
        pm10: current.pm10,
        dominant: dominantOf(current),
        hours: hoursOf(hourly),
      });
    },
  };
}

const geocodingReply = z.object({
  results: z
    .array(
      z.object({
        name: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        admin1: z.string().optional(),
        country: z.string().optional(),
      }),
    )
    .optional(),
});

/** Place search: the best match for a typed name. */
export function openMeteoGeocoder(get: HttpGet, timeoutMs = UPSTREAM_TIMEOUT_MS): Geocoder {
  return {
    async find(name) {
      const query = new URLSearchParams({ name, count: '1', language: 'en', format: 'json' });
      const { results = [] } = geocodingReply.parse(
        await jsonFrom(get, `${GEOCODING_URL}?${query.toString()}`, timeoutMs),
      );
      const [top] = results;
      if (!top) return null;
      const region = [top.admin1, top.country].filter((part) => part !== undefined).join(', ');
      return { name: top.name, region, latitude: top.latitude, longitude: top.longitude };
    },
  };
}
