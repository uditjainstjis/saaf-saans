/**
 * Read-through caching over the Cache port: serve the cached value while it
 * still matches its schema, else load, store and return. A cached value is
 * untrusted until parsed, so a stale shape is simply a miss.
 */
import type * as z from 'zod';
import type { Cache } from './ports';

/** Where a value is cached, for how long, and the shape a cached copy must still have. */
export interface CacheEntry<T> {
  key: string;
  ttlSeconds: number;
  schema: z.ZodType<T>;
}

/** The cached value for `entry`, or the loaded one, stored for next time. */
export async function remember<T>(
  cache: Cache,
  { key, ttlSeconds, schema }: CacheEntry<T>,
  load: () => Promise<T>,
): Promise<T> {
  const hit = schema.safeParse(await cache.get(key));
  if (hit.success) return hit.data;
  const fresh = await load();
  await cache.put(key, fresh, ttlSeconds);
  return fresh;
}
