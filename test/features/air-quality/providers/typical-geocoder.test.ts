/**
 * Tests for the offline geocoder: the built-in cities, and nothing else.
 */
import { expect, it } from 'vitest';
import { typicalGeocoder } from '../../../../src/features/air-quality/providers/typical-geocoder';

it('knows the big smog-season cities, however the name is typed', async () => {
  const place = await typicalGeocoder.find('  dElHi ');
  expect(place).toEqual({
    name: 'Delhi',
    region: 'National Capital Territory of Delhi, India',
    latitude: 28.65,
    longitude: 77.23,
  });
});

it('returns null for a place it does not know', async () => {
  expect(await typicalGeocoder.find('Springfield')).toBeNull();
});
