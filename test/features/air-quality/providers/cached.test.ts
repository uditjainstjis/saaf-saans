/**
 * Tests for the caching decorators: one upstream call per place or query,
 * stale shapes treated as misses, failures never cached.
 */
import { expect, it } from 'vitest';
import { cachedAir, cachedGeocoder } from '../../../../src/features/air-quality/providers/cached';
import { counted, countedGeocoder } from '../../../support/counting';
import {
  brokenAir,
  emptyGeocoder,
  foundGeocoder,
  memoryCache,
  smogAir,
} from '../../../support/fakes';
import { DELHI, SMOG } from '../../../support/fixtures';

it('asks upstream once per place and serves the cached report after', async () => {
  const upstream = counted(smogAir);
  const cache = memoryCache();
  const provider = cachedAir(upstream, cache);
  expect(await provider.read(DELHI)).toEqual(SMOG);
  expect(await provider.read({ ...DELHI, latitude: 28.651 })).toEqual(SMOG);
  expect(upstream.calls).toBe(1);
  expect([...cache.ttls.entries()]).toEqual([['air/28.65/77.23', 600]]);
});

it('keys by place, so another city is another lookup', async () => {
  const upstream = counted(smogAir);
  const provider = cachedAir(upstream, memoryCache());
  await provider.read(DELHI);
  await provider.read({ ...DELHI, latitude: 19.08, longitude: 72.88 });
  expect(upstream.calls).toBe(2);
});

it('treats a cached value of the wrong shape as a miss', async () => {
  const cache = memoryCache();
  cache.entries.set('air/28.65/77.23', { aqi: 'low' });
  const upstream = counted(smogAir);
  expect(await cachedAir(upstream, cache).read(DELHI)).toEqual(SMOG);
  expect(upstream.calls).toBe(1);
});

it('does not cache a failure', async () => {
  const cache = memoryCache();
  await expect(cachedAir(brokenAir, cache).read(DELHI)).rejects.toThrow('air down');
  expect(cache.entries.size).toBe(0);
});

it('caches a match, ignoring case, for a day', async () => {
  const upstream = countedGeocoder(foundGeocoder);
  const cache = memoryCache();
  const geocoder = cachedGeocoder(upstream, cache);
  expect(await geocoder.find('Delhi')).toEqual(DELHI);
  expect(await geocoder.find('DELHI')).toEqual(DELHI);
  expect(upstream.calls).toBe(1);
  expect([...cache.ttls.entries()]).toEqual([['place/delhi', 86_400]]);
});

it('caches a miss too, so a typo is not looked up again and again', async () => {
  const upstream = countedGeocoder(emptyGeocoder);
  const geocoder = cachedGeocoder(upstream, memoryCache());
  expect(await geocoder.find('zzzz')).toBeNull();
  expect(await geocoder.find('zzzz')).toBeNull();
  expect(upstream.calls).toBe(1);
});

it('builds a safe key from anything typed', async () => {
  const cache = memoryCache();
  await cachedGeocoder(foundGeocoder, cache).find('New Delhi/../x');
  expect([...cache.entries.keys()]).toEqual(['place/new%20delhi%2F..%2Fx']);
});
