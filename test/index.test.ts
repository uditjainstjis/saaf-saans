/**
 * The composition root, exercised end to end inside workerd: real routing,
 * real Cache API and real decorators, with only the network and the bindings
 * replaced (test/support/worker.ts).
 */
import { afterEach, expect, it, vi } from 'vitest';
import { MODELS } from '../src/config/runtime';
import worker, { compose, handle } from '../src/index';
import { goodReply } from './support/assistant-fakes';
import { FAMILY, briefFor } from './support/fixtures';
import { bindings, stubNetwork } from './support/worker';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const post = (path: string, place: string): Request =>
  new Request(`https://saaf.test${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...FAMILY, place }),
  });

it('exports a fetch handler', () => {
  expect(worker.fetch).toBe(handle);
});

it('serves a plan from live data, and caches upstream calls at the edge', async () => {
  const network = stubNetwork(true);
  const env = bindings(async () => ({ response: '{}' }));
  const first = await handle(post('/api/plan', 'Delhi One'), env);
  expect(first.status).toBe(200);
  const body = await first.json<{ air: { source: string; aqi: number } }>();
  expect(body.air).toMatchObject({ source: 'live', aqi: 186 });
  expect(network).toHaveBeenCalledTimes(2);
  expect(network.mock.calls[0]?.[1]).toMatchObject({ headers: { accept: 'application/json' } });
  await handle(post('/api/plan', 'Delhi One'), env);
  expect(network).toHaveBeenCalledTimes(2);
});

it('lets Workers AI explain the plan when the model answers well', async () => {
  stubNetwork(true);
  const brief = briefFor({ ...FAMILY, place: 'Delhi Two' });
  const hours = [
    { hour: 7, pm25: 180 },
    { hour: 15, pm25: 30 },
  ] as const;
  const reply = goodReply(briefFor(brief.profile, { ...brief.air, hours }));
  const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
  const env = bindings(async () => ({ response: reply }));
  const res = await handle(post('/api/assistant', 'Delhi Two'), env);
  expect((await res.json<{ source: string }>()).source).toBe('model');
  expect(info).toHaveBeenCalledWith({ event: 'model_answered', model: MODELS[0] });
});

it('falls back to typical air and rule-written advice when everything upstream is down', async () => {
  stubNetwork(false);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const env = bindings(async () => Promise.reject(new Error('AI unavailable')));
  const plan = await handle(post('/api/plan', 'Mumbai'), env);
  expect((await plan.json<{ air: { source: string } }>()).air.source).toBe('typical');
  const assistant = await handle(post('/api/assistant', 'Mumbai'), env);
  expect(assistant.status).toBe(200);
  expect((await assistant.json<{ source: string }>()).source).toBe('rules');
});

it('serves static assets through the ASSETS binding', async () => {
  const res = await handle(
    new Request('https://saaf.test/'),
    bindings(async () => ({})),
  );
  expect(await res.text()).toBe('app shell');
});

it('composes every dependency the application needs', () => {
  const deps = compose(bindings(async () => ({})));
  expect(Object.keys(deps).sort()).toEqual(
    ['air', 'assets', 'generator', 'geocoder', 'limiter', 'logger'].sort(),
  );
});
