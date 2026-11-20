/**
 * The production Cache port: the Workers Cache API. It needs no binding, costs
 * nothing and expires entries itself. Failures are swallowed on both paths,
 * because a cache is an optimisation. Keys are hashed by ./content-key.ts.
 */
import type { Cache } from './ports';

const ORIGIN = 'https://cache.saaf-saans.internal';
const requestFor = (key: string): Request => new Request(`${ORIGIN}/${key}`);

/** As much of a Cache API store as the adapter calls. */
export interface EdgeStore {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
}

/** A Cache port over a Cache API store: the default edge cache in production. */
export function edgeCache(store: EdgeStore): Cache {
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
