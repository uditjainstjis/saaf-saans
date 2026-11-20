/**
 * Tests for the edge cache adapter, against the real Workers Cache API.
 */
import { expect, it } from 'vitest';
import { edgeCache } from '../../src/lib/cache';

const cache = edgeCache(caches.default);

it('returns what was put, and undefined for a key never stored', async () => {
  await cache.put('infra-test/a', { n: 1 }, 60);
  expect(await cache.get('infra-test/a')).toEqual({ n: 1 });
  expect(await cache.get('infra-test/never')).toBeUndefined();
});

it('swallows a failing store on both paths: the cache is only an optimisation', async () => {
  const failing = edgeCache({
    match: () => Promise.reject(new Error('cache down')),
    put: () => Promise.reject(new Error('cache down')),
  });
  expect(await failing.get('k')).toBeUndefined();
  await expect(failing.put('k', 1, 60)).resolves.toBeUndefined();
});
