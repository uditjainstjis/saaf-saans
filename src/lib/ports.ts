import type { Profile } from '../features/plan/schemas';
import type { AirReport, Place, Plan } from '../features/plan/types';

/**
 * The ports: every dependency the application has on the outside world, each
 * declared as the narrowest interface its caller needs.
 *
 * Nothing below src/index.ts (the composition root) names a Cloudflare
 * binding, `fetch`, `caches`, `Date` or `console`. Code receives these ports
 * as arguments, so production adapters and the test suite's fakes are
 * interchangeable, and a new provider is a new implementation, not an edit.
 */

/** Turns a place name someone typed into coordinates. */
export interface Geocoder {
  /** The best match for `query`, or null when there is none. Rejects when the lookup fails. */
  find(query: string): Promise<Place | null>;
}

/** Reads the air at a place. Rejects when it cannot. */
export interface AirQualityProvider {
  read(place: Place): Promise<AirReport>;
}

/** Everything a plan's wording is written from: all of it already computed. */
export interface PlanBrief {
  profile: Profile;
  place: Place;
  air: AirReport;
  plan: Plan;
  /** The health advice for this air and this audience. */
  advisory: string;
}

/** The personalised wording of a plan. Numbers live in the Plan, not here. */
export interface Narrative {
  /** `model` when generative AI wrote it, `rules` when the fallback did. */
  source: 'model' | 'rules';
  summary: string;
  /** One explanation per recommendation, keyed by recommendation id. */
  explanations: Readonly<Record<string, string>>;
  encouragement: string;
}

/** Writes the personalised plan. Implementations must always resolve for a valid brief or reject; never return partial wording. */
export interface PlanGenerator {
  generate(brief: PlanBrief): Promise<Narrative>;
}

/** One chat-style request to a language model. */
export interface TextRequest {
  system: string;
  prompt: string;
  /** JSON Schema the reply must match. */
  schema: object;
  maxTokens: number;
}

/** A language model host. Resolves to the host's raw reply, unchecked. */
export interface TextGenerator {
  complete(request: TextRequest, signal: AbortSignal): Promise<unknown>;
}

/** The time. Injected so that code depending on "now" is testable. */
export interface Clock {
  now(): Date;
}

/** A key-value cache with expiry. A miss and a failure both read as undefined. */
export interface Cache {
  get(key: string): Promise<unknown>;
  put(key: string, value: unknown, ttlSeconds: number): Promise<void>;
}

/** An HTTP GET, as much of `fetch` as the Open-Meteo adapters use. */
export type HttpGet = (url: string, signal: AbortSignal) => Promise<Response>;

/** Admission control per client. */
export interface RateLimiter {
  /** True when this key may make another request now. */
  allow(key: string): Promise<boolean>;
}

/** Structured diagnostics. */
export interface Logger {
  warn(event: string, detail: Readonly<Record<string, unknown>>): void;
}

/** Serves the static single-page app. */
export interface AssetServer {
  fetch(request: Request): Promise<Response>;
}
