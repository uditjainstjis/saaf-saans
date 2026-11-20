import {
  cachedPlanGenerator,
  fallbackPlanGenerator,
  modelPlanGenerator,
  rulePlanGenerator,
} from './features/assistant/service';
import { workersAi, type AiRunner } from './features/assistant/workers-ai';
import { openMeteoAir, openMeteoGeocoder } from './features/air-quality/providers/open-meteo';
import {
  cachedAir,
  cachedGeocoder,
  fallbackAir,
  fallbackGeocoder,
} from './features/air-quality/providers/resilient';
import { typicalAir, typicalGeocoder } from './features/air-quality/providers/typical';
import type { Env } from './config/env';
import { createApp, type AppDeps } from './app';
import { edgeCache } from './lib/cache';
import { systemClock } from './lib/clock';
import { consoleLogger } from './lib/logger';
import { bindingRateLimiter, type RateLimitBinding } from './middleware/rate-limit';
import type { AssetServer, HttpGet } from './lib/ports';

/**
 * Saaf Saans — Worker entry point and composition root.
 *
 * This is the one module that touches the platform: bindings, `fetch`,
 * `caches`. It chooses a concrete implementation for every port in
 * src/lib/ports.ts and stacks the decorators; everything else receives what it
 * needs as arguments and can be run with fakes.
 */

/** The bindings this Worker uses, each as narrow as its adapter needs. */
export interface Bindings {
  AI: AiRunner;
  ASSETS: AssetServer;
  RATE_LIMITER: RateLimitBinding;
}

const httpGet: HttpGet = (url, signal) =>
  fetch(url, { signal, headers: { accept: 'application/json' } });

/** Wire production adapters to the ports. */
export function compose(env: Bindings): AppDeps {
  const cache = edgeCache(caches.default);
  const logger = consoleLogger;
  return {
    geocoder: fallbackGeocoder(
      cachedGeocoder(openMeteoGeocoder(httpGet), cache),
      typicalGeocoder,
      logger,
    ),
    air: fallbackAir(cachedAir(openMeteoAir(httpGet), cache), typicalAir(systemClock), logger),
    generator: fallbackPlanGenerator(
      cachedPlanGenerator(modelPlanGenerator(workersAi(env.AI)), cache),
      rulePlanGenerator,
      logger,
    ),
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
