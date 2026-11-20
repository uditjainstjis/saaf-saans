/**
 * Per-client rate limiting: the port, its Workers binding adapter, and the
 * admission rule that applies it. The limit itself (requests per minute) is
 * configured in wrangler.jsonc. Run by ./admission.ts.
 */

import { refuse } from '../lib/app-error';
import type { AdmissionRule } from './admission';

/** Admission control per client. */
export interface RateLimiter {
  /** True when this key may make another request now. */
  allow(key: string): Promise<boolean>;
}

/** As much of the Workers rate limiting binding as the adapter calls. */
export interface RateLimitBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

/** The production RateLimiter: the binding configured in wrangler.jsonc. */
export function bindingRateLimiter(binding: RateLimitBinding): RateLimiter {
  return { allow: async (key) => (await binding.limit({ key })).success };
}

/** The rule that refuses a client over its limit, keyed on the connecting address. */
export const withinRateLimit =
  (limiter: RateLimiter): AdmissionRule =>
  async (request) =>
    (await limiter.allow(request.headers.get('cf-connecting-ip') ?? 'local'))
      ? undefined
      : refuse(429, 'rate_limited', 'Too many requests. Please wait a minute and try again.');
