/**
 * Place search with the Open-Meteo Geocoding API: free, keyless, fetched
 * server-side under a deadline. Reply shapes are ./open-meteo-schemas.ts.
 */

import { UPSTREAM_TIMEOUT_MS } from '../../../config/runtime';
import { fetchJson } from '../../../lib/fetch-json';
import type { HttpGet } from '../../../lib/ports';
import type { Geocoder } from '../types';
import { openMeteoPlacesReply } from './open-meteo-schemas';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

/** Place search: the best match for a typed name, or null. */
export function openMeteoGeocoder(get: HttpGet, timeoutMs = UPSTREAM_TIMEOUT_MS): Geocoder {
  return {
    async find(name) {
      const query = new URLSearchParams({ name, count: '1', language: 'en', format: 'json' });
      const reply = await fetchJson(get, `${GEOCODING_URL}?${query.toString()}`, timeoutMs);
      const [top] = openMeteoPlacesReply.parse(reply).results ?? [];
      if (!top) return null;
      const region = [top.admin1, top.country].filter((part) => part !== undefined).join(', ');
      return { name: top.name, region, latitude: top.latitude, longitude: top.longitude };
    },
  };
}
