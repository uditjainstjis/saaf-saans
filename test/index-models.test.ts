/**
 * The composition root's choice of models, inside workerd: Workers AI alone
 * without the Gemini secret, Gemini first with it, and no Google call unless
 * a key is configured.
 */
import { afterEach, expect, it, vi } from 'vitest';
import { GEMINI_MODEL, MODELS } from '../src/config/runtime';
import { GEMINI_URL } from '../src/features/assistant/gemini';
import { type Bindings, handle } from '../src/index';
import { goodReply, interaction } from './support/assistant-fakes';
import { FAMILY, briefFor } from './support/fixtures';
import { AIR_HOURS, bindings, stubNetwork } from './support/worker';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const KEY = 'test-key';
/** A reply that passes the checks for the plan the Worker builds from the stubbed air. */
const reply = goodReply(briefFor(FAMILY, { ...briefFor().air, hours: AIR_HOURS }));
const ask = (place: string): Request =>
  new Request('https://saaf.test/api/assistant', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...FAMILY, place }),
  });
/** A Workers AI binding that answers well and records which model it was asked for. */
const answering = () => vi.fn<Bindings['AI']['run']>(async () => ({ response: reply }));
/** The calls the stubbed network received for Google's API. */
const toGoogle = (network: ReturnType<typeof stubNetwork>): unknown[][] =>
  network.mock.calls.filter(([url]) => String(url).includes('google'));

it.each([undefined, ''])('asks Workers AI alone when the key is %j', async (key) => {
  const network = stubNetwork(true);
  const run = answering();
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
  const res = await handle(ask(`Jaipur ${String(key)}`), bindings(run, key));
  expect((await res.json<{ source: string }>()).source).toBe('model');
  expect(run.mock.calls.map(([model]) => model)).toEqual([MODELS[0]]);
  expect(toGoogle(network)).toEqual([]);
});

it('asks Gemini first when a key is configured, with the key in a header only', async () => {
  const network = stubNetwork(true, () => Response.json(interaction(reply)));
  const run = answering();
  const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
  const res = await handle(ask('Pune'), bindings(run, KEY));
  expect((await res.json<{ source: string }>()).source).toBe('model');
  expect(run).not.toHaveBeenCalled();
  expect(info).toHaveBeenCalledWith({ event: 'model_answered', model: GEMINI_MODEL });
  const [url, init] = toGoogle(network)[0] ?? [];
  expect(url).toBe(GEMINI_URL);
  expect(init).toMatchObject({ method: 'POST', headers: { 'x-goog-api-key': KEY } });
  // Once, in the header: so not in the body, and the URL above holds no key at all.
  expect(JSON.stringify(init).split(KEY)).toHaveLength(2);
});

it('asks Workers AI’s first model once, never its second, when Gemini refuses', async () => {
  const network = stubNetwork(true, () => new Response('quota', { status: 429 }));
  const run = answering();
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
  const res = await handle(ask('Kanpur'), bindings(run, KEY));
  expect((await res.json<{ source: string }>()).source).toBe('model');
  expect(toGoogle(network)).toHaveLength(1);
  expect(run.mock.calls.map(([model]) => model)).toEqual([MODELS[0]]);
  expect(warn).toHaveBeenCalledWith({
    event: 'model_call_failed',
    model: GEMINI_MODEL,
    reason: 'Error: Gemini answered 429',
  });
});
