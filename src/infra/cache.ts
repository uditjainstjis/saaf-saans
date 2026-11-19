import type { Cache as CachePort } from '../ports';

/**
 * The production {@link CachePort}: the Workers Cache API.
 *
 * It needs no binding, costs nothing and expires entries on its own. It is
 * per-colocation, so the hit rate is lower than a global store would give; a
 * miss costs one upstream call, never correctness.
 */

const ORIGIN = 'https://cache.saaf-saans.internal';

/** SHA-256 of `parts`, as lowercase hex: a cache key that reveals nothing of its inputs. */
export async function contentKey(parts: readonly string[]): Promise<string> {
  const data = new TextEncoder().encode(parts.join('\u0000'));
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

const requestFor = (key: string): Request => new Request(`${ORIGIN}/${key}`);

/**
 * A {@link CachePort} over a Cache API store. Failures are swallowed on both
 * paths: the cache is an optimisation and must never fail a request.
 *
 * @param store the Cache API store to use, `caches.default` in production
 */
export function edgeCache(store: Pick<Cache, 'match' | 'put'>): CachePort {
  return {
    async get(key) {
      try {
        const hit = await store.match(requestFor(key));
        return hit ? await hit.json() : undefined;
      } catch {
        return undefined;
      }
    },
    async put(key, value, ttlSeconds) {
      const headers = { 'cache-control': `max-age=${ttlSeconds}` };
      await store.put(requestFor(key), Response.json(value, { headers })).catch(() => undefined);
    },
  };
}
