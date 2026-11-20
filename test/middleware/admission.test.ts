/**
 * Tests for the admission gate through the real application: the CSRF control,
 * cross-site refusal and the body size limit.
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

it('refuses an oversized body, by its declared and by its actual size', async () => {
  const declared = post('/api/plan', FAMILY, { 'content-length': String(MAX_BODY_BYTES + 1) });
  expect((await appWith().fetch(declared)).status).toBe(413);
  const actual = post('/api/plan', { ...FAMILY, notes: 'x'.repeat(MAX_BODY_BYTES) });
  actual.headers.delete('content-length');
  const res = await appWith().fetch(actual);
  expect(res.status).toBe(413);
  expect((await res.json<Refusal>()).code).toBe('too_large');
});
