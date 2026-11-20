/**
 * The offline Geocoder: place search over the built-in cities only, for when
 * the geocoding API cannot be reached. City data is ./typical-cities.ts.
 */

import type { Geocoder } from '../types';
import { knownCity } from './typical-cities';

/** Finds a place among the known cities; null for any other name. */
export const typicalGeocoder: Geocoder = {
  find: (query) => {
    const match = knownCity(query);
    if (!match) return Promise.resolve(null);
    const { name, region, latitude, longitude } = match;
    return Promise.resolve({ name, region, latitude, longitude });
  },
};
