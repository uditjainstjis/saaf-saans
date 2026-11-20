/**
 * Tests for the application shell in src/app.ts: health, unknown API paths and
 * static assets. Feature routes are tested beside their features.
 */
import { expect, it } from 'vitest';
import { LIMITS } from '../src/config/limits';
import { appWith } from './support/http';

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
