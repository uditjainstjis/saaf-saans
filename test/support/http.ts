/**
 * The application wired to fakes, and requests to send it: the harness for
 * tests of routes and middleware. Any dependency can be swapped per test.
 */

import { type AppDeps, createApp } from '../../src/app';
import { fixedGenerator } from './assistant-fakes';
import { foundGeocoder, recordingLogger, smogAir } from './fakes';

/** The application with fake dependencies, overridden as a test needs. */
export function appWith(overrides: Partial<AppDeps> = {}): ReturnType<typeof createApp> {
  return createApp({
    geocoder: foundGeocoder,
    air: smogAir,
    generator: fixedGenerator(),
    limiter: { allow: async () => true },
    assets: { fetch: async () => new Response('<!doctype html>', { status: 200 }) },
    logger: recordingLogger(),
    ...overrides,
  });
}

/** A JSON POST as the page would send it. */
export function post(path: string, body: unknown, headers: Record<string, string> = {}): Request {
  return new Request(`https://saaf.test${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.9', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

/** The body of a refusal. */
export interface Refusal {
  code: string;
  error: string;
  issues: { field: string; message: string }[];
}
