/**
 * Tests for read-through caching: load once, reload on a stale shape.
 */
import { expect, it, vi } from 'vitest';
import { z } from 'zod';
import { remember } from '../../src/lib/remember';
import { memoryCache } from '../support/fakes';

const entry = { key: 'k', ttlSeconds: 30, schema: z.number() };

it('loads once, then serves the cached value', async () => {
  const cache = memoryCache();
  const load = vi.fn(async () => 7);
  expect(await remember(cache, entry, load)).toBe(7);
  expect(await remember(cache, entry, load)).toBe(7);
  expect(load).toHaveBeenCalledTimes(1);
  expect(cache.ttls.get('k')).toBe(30);
});

it('reloads when the cached value no longer matches the schema', async () => {
  const cache = memoryCache();
  cache.entries.set('k', 'seven');
  expect(await remember(cache, entry, async () => 8)).toBe(8);
});
