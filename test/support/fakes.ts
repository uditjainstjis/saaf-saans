/**
 * Test doubles for the cross-cutting and air-quality ports. Each is a plain
 * object that honours its port's contract, so it substitutes for the
 * production adapter without a cast or a mocking library.
 */
import type { AirQualityProvider, Geocoder } from '../../src/features/air-quality/types';
import type { Cache, Clock, HttpGet, Logger } from '../../src/lib/ports';
import { DELHI, SMOG } from './fixtures';

/** An in-memory cache that records what was stored and for how long. */
export function memoryCache(): Cache & {
  entries: Map<string, unknown>;
  ttls: Map<string, number>;
} {
  const entries = new Map<string, unknown>();
  const ttls = new Map<string, number>();
  return {
    entries,
    ttls,
    get: async (key) => entries.get(key),
    put: async (key, value, ttlSeconds) => {
      entries.set(key, value);
      ttls.set(key, ttlSeconds);
    },
  };
}

/** A clock stopped at one instant. */
export const fixedClock = (iso: string): Clock => ({ now: () => new Date(iso) });

/** One thing a recording logger was told. */
export interface LogEntry {
  level: 'info' | 'warn';
  event: string;
  detail: Readonly<Record<string, unknown>>;
}

/** A logger that keeps what it was told: the names of its warnings, and every entry in full. */
export function recordingLogger(): Logger & { events: string[]; entries: LogEntry[] } {
  const events: string[] = [];
  const entries: LogEntry[] = [];
  return {
    events,
    entries,
    info: (event, detail) => void entries.push({ level: 'info', event, detail }),
    warn: (event, detail) => {
      events.push(event);
      entries.push({ level: 'warn', event, detail });
    },
  };
}

/** A geocoder that finds Delhi for any name. */
export const foundGeocoder: Geocoder = { find: async () => DELHI };
/** A geocoder that finds nothing. */
export const emptyGeocoder: Geocoder = { find: async () => null };
/** A geocoder whose upstream is down. */
export const brokenGeocoder: Geocoder = { find: async () => Promise.reject(new Error('geo down')) };

/** A provider that reads the fixture smog day. */
export const smogAir: AirQualityProvider = { read: async () => SMOG };
/** A provider whose upstream is down. */
export const brokenAir: AirQualityProvider = {
  read: async () => Promise.reject(new Error('air down')),
};

/** An HTTP GET that answers every URL with one JSON body, and records the URLs asked. */
export function jsonGet(body: unknown, status = 200): HttpGet & { urls: string[] } {
  const urls: string[] = [];
  const get = async (url: string): Promise<Response> => {
    urls.push(url);
    return Response.json(body, { status });
  };
  return Object.assign(get, { urls });
}
