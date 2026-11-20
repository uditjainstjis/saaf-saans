import type {
  AirQualityProvider,
  Cache,
  Clock,
  Geocoder,
  HttpGet,
  Logger,
  Narrative,
  PlanBrief,
  PlanGenerator,
  TextGenerator,
  TextRequest,
} from '../../src/lib/ports';
import { DELHI, SMOG } from './fixtures';

/**
 * Test doubles for every port in src/lib/ports.ts. Each is a plain object that
 * honours the port's contract, so it substitutes for the production adapter
 * without a cast or a mocking library.
 */

/** An in-memory cache that records what was stored and for how long. */
export function memoryCache(): Cache & {
  entries: Map<string, unknown>;
  ttls: Map<string, number>;
} {
  const entries = new Map<string, unknown>();
  const ttls = new Map<string, number>();
  return {
    entries,
    ttls,
    get: async (key) => entries.get(key),
    put: async (key, value, ttlSeconds) => {
      entries.set(key, value);
      ttls.set(key, ttlSeconds);
    },
  };
}

export const fixedClock = (iso: string): Clock => ({ now: () => new Date(iso) });

/** A logger that keeps what it was told. */
export function recordingLogger(): Logger & { events: string[] } {
  const events: string[] = [];
  return { events, warn: (event) => void events.push(event) };
}

export const foundGeocoder: Geocoder = { find: async () => DELHI };
export const emptyGeocoder: Geocoder = { find: async () => null };
export const brokenGeocoder: Geocoder = { find: async () => Promise.reject(new Error('geo down')) };

export const smogAir: AirQualityProvider = { read: async () => SMOG };
export const brokenAir: AirQualityProvider = {
  read: async () => Promise.reject(new Error('air down')),
};

/** An HTTP GET that answers every URL with one JSON body, and records the URLs asked. */
export function jsonGet(body: unknown, status = 200): HttpGet & { urls: string[] } {
  const urls: string[] = [];
  const get = async (url: string): Promise<Response> => {
    urls.push(url);
    return Response.json(body, { status });
  };
  return Object.assign(get, { urls });
}

/** A model that answers with the next queued reply, and records what it was asked. */
export function scriptedText(...replies: unknown[]): TextGenerator & { requests: TextRequest[] } {
  const requests: TextRequest[] = [];
  return {
    requests,
    complete: async (request) => {
      requests.push(request);
      const next = replies.shift();
      if (next instanceof Error) throw next;
      return next;
    },
  };
}

/** A reply a model could give that passes every check for this brief. */
export function goodReply(brief: PlanBrief): {
  summary: string;
  explanations: { id: string; text: string }[];
  encouragement: string;
} {
  return {
    summary: 'The air is poor today, so small changes will protect your family a great deal.',
    explanations: brief.plan.recommendations.map((r) => ({
      id: r.id,
      text: `This step suits your household because it lowers what you breathe. ${r.title}.`,
    })),
    encouragement: 'You are doing well; keep going.',
  };
}

export const NARRATIVE: Narrative = {
  source: 'model',
  summary: 'A summary written by a model for this household.',
  explanations: { 'clean-air-room': 'Because you sleep there.' },
  encouragement: 'Keep going.',
};

export const fixedGenerator = (narrative: Narrative = NARRATIVE): PlanGenerator => ({
  generate: async () => narrative,
});
export const brokenGenerator: PlanGenerator = {
  generate: async () => Promise.reject(new Error('model down')),
};
