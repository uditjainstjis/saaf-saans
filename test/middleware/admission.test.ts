/**
 * Tests for the admission gate through the real application: the CSRF control,
 * the Sec-Fetch-Site and Origin checks, and the declared body size limit.
 */
import { expect, it } from 'vitest';
import { MAX_BODY_BYTES } from '../../src/config/runtime';
import { FAMILY } from '../support/fixtures';
import { appWith, post, type Refusal } from '../support/http';

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

it('refuses a foreign or opaque Origin, and admits its own origin or none at all', async () => {
  const from = (headers: Record<string, string>): Promise<Response> =>
    Promise.resolve(appWith().fetch(post('/api/plan', FAMILY, headers)));
  const foreign = await from({ origin: 'https://evil.example' });
  expect(foreign.status).toBe(403);
  expect((await foreign.json<Refusal>()).code).toBe('cross_origin');
  expect((await from({ origin: 'null' })).status).toBe(403);
  expect((await from({ origin: 'http://saaf.test' })).status).toBe(403);
  expect((await from({ origin: 'https://saaf.test' })).status).toBe(200);
  expect((await from({})).status).toBe(200);
});

it('admits the request the page itself sends: its own Origin and Sec-Fetch-Site same-origin', async () => {
  const own = { origin: 'https://saaf.test', 'sec-fetch-site': 'same-origin' };
  expect((await appWith().fetch(post('/api/plan', FAMILY, own))).status).toBe(200);
  const mixed = { origin: 'https://evil.example', 'sec-fetch-site': 'same-origin' };
  expect((await appWith().fetch(post('/api/plan', FAMILY, mixed))).status).toBe(403);
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
