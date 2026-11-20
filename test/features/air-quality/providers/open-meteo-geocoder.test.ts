/**
 * Tests for the place search adapter: the top match, misses, encoding and
 * upstream errors.
 */
import { expect, it } from 'vitest';
import { openMeteoGeocoder } from '../../../../src/features/air-quality/providers/open-meteo-geocoder';
import { jsonGet } from '../../../support/fakes';

const HIT = {
  name: 'Delhi',
  latitude: 28.65195,
  longitude: 77.23149,
  country: 'India',
  admin1: 'National Capital Territory of Delhi',
};

it('returns the top match with its region', async () => {
  const get = jsonGet({ results: [HIT, { ...HIT, name: 'Delhi, NY' }] });
  expect(await openMeteoGeocoder(get).find('Delhi')).toEqual({
    name: 'Delhi',
    region: 'National Capital Territory of Delhi, India',
    latitude: 28.65195,
    longitude: 77.23149,
  });
  const url = new URL(get.urls[0] ?? '');
  expect(url.origin).toBe('https://geocoding-api.open-meteo.com');
  expect(url.searchParams.get('name')).toBe('Delhi');
  expect(url.searchParams.get('count')).toBe('1');
});

it('copes with a match that has no region', async () => {
  const get = jsonGet({ results: [{ name: 'Atlantis', latitude: 0, longitude: 0 }] });
  expect((await openMeteoGeocoder(get).find('Atlantis'))?.region).toBe('');
});

it('returns null when nothing matches, as the API signals by omitting results', async () => {
  expect(await openMeteoGeocoder(jsonGet({ generationtime_ms: 0.2 })).find('zzzz')).toBeNull();
});

it('URL-encodes whatever was typed', async () => {
  const get = jsonGet({});
  await openMeteoGeocoder(get).find('a&b=c #d');
  expect(get.urls[0]).toContain('name=a%26b%3Dc+%23d');
});

it('rejects an error status', async () => {
  await expect(openMeteoGeocoder(jsonGet({}, 500)).find('Delhi')).rejects.toThrow('500');
});
