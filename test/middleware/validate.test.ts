/**
 * Tests for body validation through the real application: every invalid field
 * reported, bodies that are not JSON, and a body read that stops at the limit.
 */
import { expect, it } from 'vitest';
import { MAX_BODY_BYTES } from '../../src/config/runtime';
import { FAMILY } from '../support/fixtures';
import { appWith, post, type Refusal } from '../support/http';

it('answers 400 with every invalid field, so the form can show them all', async () => {
  const res = await appWith().fetch(post('/api/plan', { ...FAMILY, adults: 0, commute: 'jet' }));
  expect(res.status).toBe(400);
  const body = await res.json<Refusal>();
  expect(body.code).toBe('invalid_input');
  expect(body.issues).toEqual([
    { field: 'commute', message: 'Commute: choose one of the listed options.' },
    { field: 'adults', message: 'Adults must be between 1 and 12.' },
  ]);
  expect(body.error).toContain('Adults must be between');
});

it('files a problem with the request as a whole under the form itself', async () => {
  const res = await appWith().fetch(post('/api/plan', '"just a string"'));
  expect((await res.json<Refusal>()).issues[0]?.field).toBe('form');
});

it('answers 400 for a body that is not JSON', async () => {
  const res = await appWith().fetch(post('/api/plan', '{not json'));
  expect(res.status).toBe(400);
  expect((await res.json<Refusal>()).code).toBe('bad_json');
});

/** A JSON POST whose body is a stream, so it carries no declared length. */
const streamed = (body: ReadableStream<Uint8Array>): Request =>
  new Request('https://saaf.test/api/plan', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  });

it('stops reading a body with no declared length once it passes the limit, and cancels it', async () => {
  let pulls = 0;
  let cancelled = false;
  const endless = new ReadableStream<Uint8Array>({
    pull(controller) {
      pulls++;
      controller.enqueue(new TextEncoder().encode('x'.repeat(1024)));
    },
    cancel() {
      cancelled = true;
    },
  });
  const res = await appWith().fetch(streamed(endless));
  expect(res.status).toBe(413);
  expect((await res.json<Refusal>()).code).toBe('too_large');
  expect(cancelled).toBe(true);
  expect(pulls * 1024).toBeLessThan(MAX_BODY_BYTES * 3);
});

it('counts bytes, not characters', async () => {
  // 1,400 Devanagari letters are 1,400 characters but 4,200 bytes.
  const wide = post('/api/plan', { ...FAMILY, notes: 'द'.repeat(1400) });
  wide.headers.delete('content-length');
  expect((await appWith().fetch(wide)).status).toBe(413);
});

it('keeps a character whole when it arrives split across two chunks', async () => {
  const bytes = new TextEncoder().encode(JSON.stringify({ ...FAMILY, notes: 'दिल्ली की हवा' }));
  const cut = bytes.indexOf(0xe0) + 1;
  const halves = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes.slice(0, cut));
      controller.enqueue(bytes.slice(cut));
      controller.close();
    },
  });
  expect((await appWith().fetch(streamed(halves))).status).toBe(200);
});

it('answers 400 for a JSON request with no body at all', async () => {
  const empty = new Request('https://saaf.test/api/plan', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
  });
  const res = await appWith().fetch(empty);
  expect(res.status).toBe(400);
  expect((await res.json<Refusal>()).code).toBe('bad_json');
});
