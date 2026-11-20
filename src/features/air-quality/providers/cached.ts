/**
 * Caching decorators for the air-quality ports. Each wraps the port it
 * implements, so it stacks with ./fallback.ts in any order and callers never
 * know which layer answered. Lifetimes are in config/runtime.ts.
 */
import { AIR_TTL_SECONDS, PLACE_TTL_SECONDS } from '../../../config/runtime';
import type { Cache } from '../../../lib/ports';
import { remember } from '../../../lib/remember';
import { airReportSchema, placeSchema } from '../schemas';
import type { AirQualityProvider, Geocoder } from '../types';

/** Air reports cached per place, to about a kilometre. */
export function cachedAir(inner: AirQualityProvider, cache: Cache): AirQualityProvider {
  return {
    read: (place) => {
      const key = `air/${place.latitude.toFixed(2)}/${place.longitude.toFixed(2)}`;
      const entry = { key, ttlSeconds: AIR_TTL_SECONDS, schema: airReportSchema };
      return remember(cache, entry, () => inner.read(place));
    },
  };
}

/** Geocoding results cached per query, misses included. */
export function cachedGeocoder(inner: Geocoder, cache: Cache): Geocoder {
  return {
    find: (query) => {
      const key = `place/${encodeURIComponent(query.toLowerCase())}`;
      const entry = { key, ttlSeconds: PLACE_TTL_SECONDS, schema: placeSchema.nullable() };
      return remember(cache, entry, () => inner.find(query));
    },
  };
}
