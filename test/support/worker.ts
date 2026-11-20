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

/** The two forecast hours of {@link AIR}, as the Worker reads them. */
export const AIR_HOURS = [
  { hour: 7, pm25: 180 },
  { hour: 15, pm25: 30 },
] as const;

/** Stand in for the network: Open-Meteo answers, or is down; NVIDIA answers with `nvidia()` when given. */
export function stubNetwork(up: boolean, nvidia?: () => Response): ReturnType<typeof vi.fn> {
  const fetch = vi.fn(async (url: string) => {
    if (url.includes('integrate.api.nvidia.com')) return nvidia?.() ?? Response.error();
    if (!up) throw new Error('network down');
    return Response.json(url.includes('geocoding') ? GEO : AIR);
  });
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

/** Bindings whose AI answers with `run`, with the NVIDIA secret set when a key is given. */
export function bindings(run: Bindings['AI']['run'], nvidiaKey?: string): Bindings {
  return {
    AI: { run },
    ASSETS: { fetch: async () => new Response('app shell') },
    RATE_LIMITER: { limit: async () => ({ success: true }) },
    ...(nvidiaKey === undefined ? {} : { NVIDIA_API_KEY: nvidiaKey }),
  };
}
