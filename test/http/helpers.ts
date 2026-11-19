import { createApp, type AppDeps } from '../../src/http/app';
import { fixedGenerator, foundGeocoder, recordingLogger, smogAir } from '../support/fakes';

/** The application wired to fakes; any dependency can be swapped per test. */
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

export function post(path: string, body: unknown, headers: Record<string, string> = {}): Request {
  return new Request(`https://saaf.test${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.9', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

export interface Refusal {
  code: string;
  error: string;
  issues: { field: string; message: string }[];
}
