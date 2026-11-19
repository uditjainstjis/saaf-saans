import { describe, expect, it } from 'vitest';
import { MAX_BODY_BYTES } from '../../src/http/admission';
import { LIMITS } from '../../src/shared/constants';
import { FAMILY } from '../support/fixtures';
import { appWith, post, type Refusal } from './helpers';

describe('the admission gate', () => {
  it('refuses a body that is not declared as JSON (the CSRF control)', async () => {
    for (const type of ['text/plain', 'application/x-www-form-urlencoded']) {
      const res = await appWith().fetch(post('/api/plan', FAMILY, { 'content-type': type }));
      expect(res.status).toBe(415);
    }
    const bare = new Request('https://saaf.test/api/plan', { method: 'POST' });
    expect((await appWith().fetch(bare)).status).toBe(415);
  });

  it('refuses cross-site browser requests and admits same-origin and non-browser ones', async () => {
    const site = (value: string): Promise<Response> =>
      Promise.resolve(appWith().fetch(post('/api/plan', FAMILY, { 'sec-fetch-site': value })));
    expect((await site('cross-site')).status).toBe(403);
    expect((await site('same-site')).status).toBe(403);
    expect((await site('same-origin')).status).toBe(200);
    expect((await site('none')).status).toBe(200);
  });

  it('refuses an oversized body, by its declared and by its actual size', async () => {
    const declared = post('/api/plan', FAMILY, { 'content-length': String(MAX_BODY_BYTES + 1) });
    expect((await appWith().fetch(declared)).status).toBe(413);
    const actual = post('/api/plan', { ...FAMILY, notes: 'x'.repeat(MAX_BODY_BYTES) });
    actual.headers.delete('content-length');
    const res = await appWith().fetch(actual);
    expect(res.status).toBe(413);
    expect((await res.json<Refusal>()).code).toBe('too_large');
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
});

describe('everything else', () => {
  it('reports liveness and the public limits', async () => {
    const res = await appWith().fetch(new Request('https://saaf.test/api/health'));
    expect(await res.json()).toEqual({ status: 'ok', service: 'saaf-saans', limits: LIMITS });
  });

  it('answers 404 as JSON for unknown API paths and methods', async () => {
    expect((await appWith().fetch(new Request('https://saaf.test/api/nope'))).status).toBe(404);
    expect((await appWith().fetch(new Request('https://saaf.test/api/plan'))).status).toBe(404);
  });

  it('serves the static app for any other path', async () => {
    const res = await appWith().fetch(new Request('https://saaf.test/'));
    expect(await res.text()).toBe('<!doctype html>');
  });

  it('hardens every reply, and never lets an API reply be stored', async () => {
    const api = await appWith().fetch(post('/api/plan', FAMILY));
    expect(api.headers.get('cache-control')).toBe('no-store, no-cache, must-revalidate, private');
    expect(api.headers.get('content-security-policy')).toContain("default-src 'self'");
    expect(api.headers.get('x-content-type-options')).toBe('nosniff');
    const refused = await appWith().fetch(post('/api/plan', '{'));
    expect(refused.headers.get('cache-control')).toContain('no-store');
    const page = await appWith().fetch(new Request('https://saaf.test/'));
    expect(page.headers.get('x-frame-options')).toBe('DENY');
    expect(page.headers.get('cache-control')).toBeNull();
  });
});
