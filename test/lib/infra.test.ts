import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { contentKey, edgeCache } from '../../src/lib/cache';
import { systemClock } from '../../src/lib/clock';
import { consoleLogger } from '../../src/lib/logger';
import { bindingRateLimiter } from '../../src/middleware/rate-limit';
import { remember } from '../../src/lib/remember';
import { withTimeout } from '../../src/lib/timeout';
import { memoryCache } from '../support/fakes';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('edgeCache over the real Workers Cache API', () => {
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
});

describe('contentKey', () => {
  it('is a stable SHA-256 hex digest that differs when any part differs', async () => {
    const key = await contentKey(['a', 'b']);
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(await contentKey(['a', 'b'])).toBe(key);
    expect(await contentKey(['ab', ''])).not.toBe(key);
  });
});

describe('remember', () => {
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
});

describe('withTimeout', () => {
  it('resolves with the call’s value when it finishes in time', async () => {
    expect(await withTimeout(async () => 'done', 1000)).toBe('done');
  });

  it('passes a rejection through', async () => {
    await expect(withTimeout(() => Promise.reject(new Error('boom')), 1000)).rejects.toThrow(
      'boom',
    );
  });

  it('rejects with a TimeoutError and aborts the signal when the call hangs', async () => {
    let seen: AbortSignal | undefined;
    const hung = withTimeout((signal) => {
      seen = signal;
      return new Promise<never>(() => undefined);
    }, 5);
    await expect(hung).rejects.toMatchObject({ name: 'TimeoutError' });
    expect(seen?.aborted).toBe(true);
  });
});

describe('the small adapters', () => {
  it('systemClock tells the current time', () => {
    expect(Math.abs(systemClock.now().getTime() - Date.now())).toBeLessThan(5000);
  });

  it('consoleLogger writes one structured warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    consoleLogger.warn('thing_failed', { reason: 'x' });
    expect(warn).toHaveBeenCalledWith({ event: 'thing_failed', reason: 'x' });
  });

  it('bindingRateLimiter asks the binding with the key and reports its answer', async () => {
    const keys: string[] = [];
    const limiter = bindingRateLimiter({
      limit: async ({ key }) => {
        keys.push(key);
        return { success: key !== 'flood' };
      },
    });
    expect(await limiter.allow('203.0.113.9')).toBe(true);
    expect(await limiter.allow('flood')).toBe(false);
    expect(keys).toEqual(['203.0.113.9', 'flood']);
  });
});
