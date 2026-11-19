import type { z } from 'zod';
import type { Cache } from '../ports';

/** Where a value is cached, for how long, and the shape a cached copy must still have. */
export interface CacheEntry<T> {
  key: string;
  ttlSeconds: number;
  schema: z.ZodType<T>;
}

/**
 * Read-through caching: the cached value when there is one and it still
 * matches the schema, else the loaded value, stored for next time. A cached
 * value is untrusted until parsed, so a stale shape is simply a miss.
 */
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
