/**
 * Worker entry point and composition root: the one module that touches the
 * platform (bindings, `fetch`, `caches`). It picks an adapter for every port
 * and stacks the decorators; everything else receives what it needs as arguments.
 */
import { type AppDeps, createApp } from './app';
import type { Env } from './config/env';
import { cachedAir, cachedGeocoder } from './features/air-quality/providers/cached';
import { fallbackAir, fallbackGeocoder } from './features/air-quality/providers/fallback';
import { openMeteoAir } from './features/air-quality/providers/open-meteo-air';
import { openMeteoGeocoder } from './features/air-quality/providers/open-meteo-geocoder';
import { typicalAir } from './features/air-quality/providers/typical-air';
import { typicalGeocoder } from './features/air-quality/providers/typical-geocoder';
import { cachedPlanGenerator } from './features/assistant/generators/cached';
import { fallbackPlanGenerator } from './features/assistant/generators/fallback';
import { rulePlanGenerator } from './features/assistant/generators/rules';
import { nvidia } from './features/assistant/nvidia';
import { modelPlanGenerator, modelSources } from './features/assistant/service';
import { type AiRunner, workersAi } from './features/assistant/workers-ai';
import { edgeCache } from './lib/cache';
import { systemClock } from './lib/clock';
import { consoleLogger } from './lib/logger';
import type { AssetServer, HttpGet, HttpPost } from './lib/ports';
import { type RateLimitBinding, bindingRateLimiter } from './middleware/rate-limit';

/** The bindings this Worker uses, each as narrow as its adapter needs. */
export interface Bindings {
  AI: AiRunner;
  ASSETS: AssetServer;
  RATE_LIMITER: RateLimitBinding;
  /** The one secret, and optional: when set, NVIDIA is asked first. */
  NVIDIA_API_KEY?: string;
}

const httpGet: HttpGet = (url, signal) =>
  fetch(url, { signal, headers: { accept: 'application/json' } });
const httpPost: HttpPost = (url, init) => fetch(url, { method: 'POST', ...init });

/** Wire production adapters to the ports: live sources first, fallbacks behind them. */
export function compose(env: Bindings): AppDeps {
  const cache = edgeCache(caches.default);
  const logger = consoleLogger;
  const geocoder = cachedGeocoder(openMeteoGeocoder(httpGet), cache);
  const air = cachedAir(openMeteoAir(httpGet), cache);
  const key = env.NVIDIA_API_KEY;
  const sources = modelSources(workersAi(env.AI), key ? nvidia(httpPost, key) : undefined);
  const model = cachedPlanGenerator(modelPlanGenerator(sources, logger), cache);
  return {
    geocoder: fallbackGeocoder(geocoder, typicalGeocoder, logger),
    air: fallbackAir(air, typicalAir(systemClock), logger),
    generator: fallbackPlanGenerator(model, rulePlanGenerator, logger),
    limiter: bindingRateLimiter(env.RATE_LIMITER),
    assets: env.ASSETS,
    logger,
  };
}

/** One application per set of bindings, built on the first request an isolate serves. */
const apps = new WeakMap<Bindings, ReturnType<typeof createApp>>();

/** Answer a request with the application composed for these bindings. */
export async function handle(request: Request, env: Bindings): Promise<Response> {
  const app = apps.get(env) ?? createApp(compose(env));
  apps.set(env, app);
  return app.fetch(request);
}

/** The Worker: every request the edge does not answer from static assets enters here. */
export default { fetch: handle } satisfies ExportedHandler<Env>;
