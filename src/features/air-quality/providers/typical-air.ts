/**
 * The offline AirQualityProvider: typical winter air, so the assistant still
 * answers when Open-Meteo cannot be reached. Reports are marked `typical` and
 * the page says so in words. City data is ./typical-cities.ts.
 */

import type { Clock } from '../../../lib/ports';
import { aqiFromPm25 } from '../aqi';
import type { AirQualityProvider, AirReport, HourReading } from '../types';
import { DEFAULT_WINTER_PM25, knownCity } from './typical-cities';

/** PM10 over PM2.5 in winter smog, an illustrative ratio. */
const PM10_RATIO = 1.5;

/**
 * How a winter day's PM2.5 moves around its mean, by local hour: one daily
 * wave, 0.6 of the mean at 3 pm (when the air mixes deepest), 1.4 at 3 am.
 */
const shapeAt = (hour: number): number => 1 - 0.4 * Math.cos(((hour - 15) * Math.PI) / 12);

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
