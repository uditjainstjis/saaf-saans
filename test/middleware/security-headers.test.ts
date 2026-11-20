/**
 * Tests for the hardening middleware: the policy on every reply, and no API
 * reply ever stored.
 */
import { expect, it } from 'vitest';
import { harden } from '../../src/middleware/security-headers';
import { FAMILY } from '../support/fixtures';
import { appWith, post } from '../support/http';

it('keeps the status and body of the response it hardens', async () => {
  const res = harden(new Response('kept', { status: 418 }));
  expect(res.status).toBe(418);
  await expect(res.text()).resolves.toBe('kept');
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
