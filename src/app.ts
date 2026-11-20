/**
 * The HTTP application: middleware, the feature routes and the fallbacks,
 * assembled around injected dependencies. Routes are in features/plan/routes.ts
 * and features/assistant/routes.ts; dependencies are chosen in src/index.ts.
 */
import { Hono } from 'hono';
import { LIMITS } from './config/limits';
import { SERVICE_NAME } from './config/runtime';
import type { AirSources } from './features/air-quality/types';
import { assistantRoutes } from './features/assistant/routes';
import type { PlanGenerator } from './features/assistant/types';
import { planRoutes } from './features/plan/routes';
import type { AssetServer, Logger } from './lib/ports';
import { admissionGate } from './middleware/admission';
import { requireJson, sameOriginOnly, withinSizeLimit } from './middleware/admission-rules';
import { errorReply } from './middleware/error-handler';
import { type RateLimiter, withinRateLimit } from './middleware/rate-limit';
import { hardenReplies } from './middleware/security-headers';

/** Everything the HTTP layer needs, supplied by the composition root. */
export interface AppDeps extends AirSources {
  generator: PlanGenerator;
  limiter: RateLimiter;
  assets: AssetServer;
  logger: Logger;
}

/** Build the application around its dependencies. */
export function createApp(deps: AppDeps): Hono {
  const app = new Hono();
  // Cheapest rule first; the rate limit runs last, so a refused request never spends the budget.
  const gate = admissionGate([
    requireJson,
    sameOriginOnly,
    withinSizeLimit,
    withinRateLimit(deps.limiter),
  ]);
  app.use('*', hardenReplies);
  app.get('/api/health', (c) => c.json({ status: 'ok', service: SERVICE_NAME, limits: LIMITS }));
  const sources = { geocoder: deps.geocoder, air: deps.air };
  app.route('/api', planRoutes({ sources, gate }));
  app.route('/api', assistantRoutes({ sources, generator: deps.generator, gate }));
  app.onError(errorReply(deps.logger));
  app.all('/api/*', (c) => c.json({ error: 'Not found', code: 'not_found' }, 404));
  app.get('*', (c) => deps.assets.fetch(c.req.raw));
  return app;
}
