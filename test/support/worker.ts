/**
 * Stand-ins for the Worker's surroundings in test/index.test.ts: Open-Meteo's
 * replies, the network, and the bindings.
 */
import { vi } from 'vitest';
import type { Bindings } from '../../src';

/** A geocoding reply that finds Delhi. */
export const GEO = {
  results: [
    { name: 'Delhi', latitude: 28.65, longitude: 77.23, country: 'India', admin1: 'Delhi' },
  ],
};

/** An air quality reply for an unhealthy day, two forecast hours long. */
export const AIR = {
  current: {
    us_aqi: 186,
    pm2_5: 149,
    pm10: 210,
    us_aqi_pm2_5: 186,
    us_aqi_pm10: 76,
    us_aqi_nitrogen_dioxide: 27,
    us_aqi_ozone: 14,
    us_aqi_sulphur_dioxide: 17,
  },
  hourly: { time: ['2026-11-20T07:00', '2026-11-20T15:00'], pm2_5: [180, 30] },
};

/** Stand in for the network: Open-Meteo answers, or is down. */
export function stubNetwork(up: boolean): ReturnType<typeof vi.fn> {
  const fetch = vi.fn(async (url: string) => {
    if (!up) throw new Error('network down');
    return Response.json(url.includes('geocoding') ? GEO : AIR);
  });
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

/** Bindings whose AI answers with `run`. */
export function bindings(run: Bindings['AI']['run']): Bindings {
  return {
    AI: { run },
    ASSETS: { fetch: async () => new Response('app shell') },
    RATE_LIMITER: { limit: async () => ({ success: true }) },
  };
}
