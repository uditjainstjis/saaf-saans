/**
 * Tests for rate limiting: the binding adapter, and the rule keyed on the
 * connecting address, run after the cheaper checks.
 */
import { expect, it } from 'vitest';
import { bindingRateLimiter } from '../../src/middleware/rate-limit';
import { FAMILY } from '../support/fixtures';
import { appWith, post, type Refusal } from '../support/http';

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

it('rate-limits per connecting address, after the cheaper checks', async () => {
  const keys: string[] = [];
  const limiter = {
    allow: async (key: string) => {
      keys.push(key);
      return false;
    },
  };
  const app = appWith({ limiter });
  const res = await app.fetch(post('/api/plan', FAMILY));
  expect(res.status).toBe(429);
  expect((await res.json<Refusal>()).code).toBe('rate_limited');
  await app.fetch(post('/api/plan', FAMILY, { 'sec-fetch-site': 'cross-site' }));
  const anonymous = post('/api/plan', FAMILY);
  anonymous.headers.delete('cf-connecting-ip');
  await app.fetch(anonymous);
  expect(keys).toEqual(['203.0.113.9', 'local']);
});
