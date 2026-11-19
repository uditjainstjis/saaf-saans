import { afterEach, describe, expect, it, vi } from 'vitest';
import worker, { compose, handle, type Bindings } from '../src/index';
import { briefFor, FAMILY } from './support/fixtures';
import { goodReply } from './support/fakes';

/**
 * The composition root, exercised end to end inside workerd: real routing,
 * real Cache API, real decorators, with only the network and the bindings
 * replaced.
 */

const GEO = {
  results: [
    { name: 'Delhi', latitude: 28.65, longitude: 77.23, country: 'India', admin1: 'Delhi' },
  ],
};
const AIR = {
  current: {
    us_aqi: 186,
    pm2_5: 149,
    pm10: 210,
    us_aqi_pm2_5: 186,
    us_aqi_pm10: 76,
    us_aqi_nitrogen_dioxide: 27,
    us_aqi_ozone: 14,
    us_aqi_sulphur_dioxide: 17,
  },
  hourly: { time: ['2026-11-20T07:00', '2026-11-20T15:00'], pm2_5: [180, 30] },
};

/** Stand in for the network: Open-Meteo answers, or is down. */
function stubNetwork(up: boolean): ReturnType<typeof vi.fn> {
  const fetch = vi.fn(async (url: string) => {
    if (!up) throw new Error('network down');
    return Response.json(url.includes('geocoding') ? GEO : AIR);
  });
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

function bindings(run: Bindings['AI']['run']): Bindings {
  return {
    AI: { run },
    ASSETS: { fetch: async () => new Response('app shell') },
    RATE_LIMITER: { limit: async () => ({ success: true }) },
  };
}

const post = (path: string, place: string): Request =>
  new Request(`https://saaf.test${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...FAMILY, place }),
  });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('the Worker', () => {
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
    const env = bindings(async () => ({ response: reply }));
    const res = await handle(post('/api/assistant', 'Delhi Two'), env);
    expect((await res.json<{ source: string }>()).source).toBe('model');
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
});
