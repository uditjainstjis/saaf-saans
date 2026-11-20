/**
 * Fallback decorators for the air-quality ports: the primary, and when it
 * rejects, the backup. The failure is logged, never shown as an error, so the
 * assistant always has air to plan from. Caching is ./cached.ts.
 */

import type { Logger } from '../../../lib/ports';
import type { AirQualityProvider, Geocoder } from '../types';

/** `primary`, and when it rejects, `backup`. */
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
