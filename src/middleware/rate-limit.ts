import type { RateLimiter } from '../lib/ports';

/** As much of the Workers rate limiting binding as this adapter calls. */
export interface RateLimitBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

/** The production {@link RateLimiter}: the binding configured in wrangler.jsonc. */
export function bindingRateLimiter(binding: RateLimitBinding): RateLimiter {
  return { allow: async (key) => (await binding.limit({ key })).success };
}
