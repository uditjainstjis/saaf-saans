/**
 * Wrappers that count how often an air-quality port is asked, for asserting
 * that a cache really saved an upstream call.
 */

import type { AirQualityProvider, Geocoder, Place } from '../../src/features/air-quality/types';

/** A provider that counts its reads. */
export function counted(inner: AirQualityProvider): AirQualityProvider & { calls: number } {
  const provider = {
    calls: 0,
    read: (place: Place) => {
      provider.calls++;
      return inner.read(place);
    },
  };
  return provider;
}

/** A geocoder that counts its lookups. */
export function countedGeocoder(inner: Geocoder): Geocoder & { calls: number } {
  const geocoder = {
    calls: 0,
    find: (query: string) => {
      geocoder.calls++;
      return inner.find(query);
    },
  };
  return geocoder;
}
