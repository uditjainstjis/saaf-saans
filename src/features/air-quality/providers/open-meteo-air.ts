/**
 * Live air quality from the Open-Meteo Air Quality API: free, keyless,
 * fetched server-side under a deadline. Reply shapes are
 * ./open-meteo-schemas.ts; caching and fallback wrap this in ./cached.ts and ./fallback.ts.
 */

import { UPSTREAM_TIMEOUT_MS } from '../../../config/runtime';
import { fetchJson } from '../../../lib/fetch-json';
import type { HttpGet } from '../../../lib/ports';
import { airReportSchema } from '../schemas';
import { type AirQualityProvider, type HourReading, POLLUTANTS, type Pollutant } from '../types';
import { type OpenMeteoAirReply, openMeteoAirReply } from './open-meteo-schemas';

const AIR_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const SUB_INDEX = POLLUTANTS.map((pollutant) => `us_aqi_${pollutant}` as const);
const CURRENT = ['us_aqi', 'pm2_5', 'pm10', ...SUB_INDEX].join(',');

/** The pollutant with the highest US AQI sub-index: the one driving the index. */
function dominantOf(current: OpenMeteoAirReply['current']): Pollutant {
  const index = (pollutant: Pollutant): number => current[`us_aqi_${pollutant}`] ?? -1;
  return POLLUTANTS.reduce((worst, pollutant) =>
    index(pollutant) > index(worst) ? pollutant : worst,
  );
}

/** The hourly forecast as readings in local time, skipping hours with no value. */
function hoursOf({ time, pm2_5 }: OpenMeteoAirReply['hourly']): HourReading[] {
  return time.flatMap((stamp, i) => {
    const pm25 = pm2_5[i];
    // An ISO local time, "2026-11-20T07:00": characters 11 and 12 are the hour.
    return typeof pm25 === 'number' ? [{ hour: Number(stamp.slice(11, 13)), pm25 }] : [];
  });
}

/** Live air quality for a place: current readings and the next 24 hours of PM2.5. */
export function openMeteoAir(get: HttpGet, timeoutMs = UPSTREAM_TIMEOUT_MS): AirQualityProvider {
  return {
    async read({ latitude, longitude }) {
      const query = new URLSearchParams({
        latitude: latitude.toFixed(3),
        longitude: longitude.toFixed(3),
        current: CURRENT,
        hourly: 'pm2_5',
        forecast_hours: '24',
        timezone: 'auto',
      });
      const reply = await fetchJson(get, `${AIR_URL}?${query.toString()}`, timeoutMs);
      const { timezone, current, hourly } = openMeteoAirReply.parse(reply);
      return airReportSchema.parse({
        source: 'live',
        aqi: current.us_aqi,
        pm25: current.pm2_5,
        pm10: current.pm10,
        dominant: dominantOf(current),
        hours: hoursOf(hourly),
        // Times are local to the place (`timezone=auto`), so the first one names today's date there.
        local: { timeZone: timezone, date: hourly.time[0]?.slice(0, 10) },
        observedAt: current.time,
      });
    },
  };
}
