import { remember } from '../../../lib/remember';
import type { AirQualityProvider, Cache, Geocoder, Logger } from '../../../lib/ports';
import { airReportSchema, placeSchema } from '../schemas';

/**
 * Decorators that make any provider resilient: a cache in front, a fallback
 * behind. Each wraps the port it implements, so they stack in any order and
 * the code that asks for air never knows which layer answered.
 */

/** Air changes hour by hour; ten minutes keeps a busy neighbourhood to one upstream call. */
const AIR_TTL_SECONDS = 600;
/** A place does not move; a day keeps popular cities off the geocoder. */
const PLACE_TTL_SECONDS = 86_400;

/** Air reports cached per place, to about a kilometre. */
export function cachedAir(inner: AirQualityProvider, cache: Cache): AirQualityProvider {
  return {
    read: (place) =>
      remember(
        cache,
        {
          key: `air/${place.latitude.toFixed(2)}/${place.longitude.toFixed(2)}`,
          ttlSeconds: AIR_TTL_SECONDS,
          schema: airReportSchema,
        },
        () => inner.read(place),
      ),
  };
}

/** `primary`, and when it rejects, `backup`. The failure is logged, never shown as an error. */
export function fallbackAir(
  primary: AirQualityProvider,
  backup: AirQualityProvider,
  logger: Logger,
): AirQualityProvider {
  return {
    read: (place) =>
      primary.read(place).catch((err: unknown) => {
        logger.warn('air_provider_failed', { reason: String(err) });
        return backup.read(place);
      }),
  };
}

/** Geocoding results cached per query, misses included. */
export function cachedGeocoder(inner: Geocoder, cache: Cache): Geocoder {
  return {
    find: (query) =>
      remember(
        cache,
        {
          key: `place/${encodeURIComponent(query.toLowerCase())}`,
          ttlSeconds: PLACE_TTL_SECONDS,
          schema: placeSchema.nullable(),
        },
        () => inner.find(query),
      ),
  };
}

/** `primary`, and when it rejects, `backup`. */
export function fallbackGeocoder(primary: Geocoder, backup: Geocoder, logger: Logger): Geocoder {
  return {
    find: (query) =>
      primary.find(query).catch((err: unknown) => {
        logger.warn('geocoder_failed', { reason: String(err) });
        return backup.find(query);
      }),
  };
}
