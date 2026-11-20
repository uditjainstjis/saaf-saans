import { Hono, type ErrorHandler, type MiddlewareHandler } from 'hono';
import { prepareBrief, type Sources } from './features/plan/service';
import type { AssetServer, Logger, PlanBrief, PlanGenerator, RateLimiter } from './lib/ports';
import { harden } from './config/security-policy';
import { LIMITS } from './config/constants';
import { admissionRules, admit } from './middleware/admission';
import { readProfile } from './middleware/validate';
import { RequestError } from './lib/app-error';
import { presentPlan } from './features/plan/view';

/**
 * The HTTP surface, split by cost:
 *
 *   POST /api/plan       place, live air, and the deterministic plan with its
 *                        computed impact. No model involved; answers fast.
 *   POST /api/assistant  the generative step: the same plan, explained for
 *                        this household or group by Workers AI, with a
 *                        rule-based fallback so it always answers.
 *   GET  /api/health     liveness, and the public request limits.
 *
 * The page calls the first and renders it, then calls the second and fills
 * in. Nobody waits on a model to see their air or their numbers, and a model
 * outage degrades one paragraph rather than the page.
 */

/** Everything the HTTP layer needs, supplied by the composition root. */
export interface AppDeps extends Sources {
  generator: PlanGenerator;
  limiter: RateLimiter;
  assets: AssetServer;
  logger: Logger;
}

/** Security headers on every reply, and no caching of any API reply. */
const hardenReplies: MiddlewareHandler = async (c, next) => {
  await next();
  c.res = harden(c.res);
  // API replies describe one household's life; nothing in them may be stored.
  if (c.req.path.startsWith('/api/')) {
    c.res.headers.set('cache-control', 'no-store, no-cache, must-revalidate, private');
  }
};

/** A refusal as the page expects it; anything else is logged and answered without detail. */
const errorReply =
  (logger: Logger): ErrorHandler =>
  (err, c) => {
    if (err instanceof RequestError) {
      return c.json({ error: err.message, code: err.code, issues: err.issues }, err.status);
    }
    logger.warn('unhandled_error', { reason: String(err) });
    return c.json({ error: 'Something went wrong. Please try again.', code: 'internal' }, 500);
  };

/** Build the application around its dependencies. */
export function createApp(deps: AppDeps): Hono {
  const app = new Hono();
  const rules = admissionRules(deps.limiter);
  const gate: MiddlewareHandler = async (c, next) => {
    const refusal = await admit(c.req.raw, rules);
    if (refusal) throw refusal;
    await next();
  };
  const brief = async (request: Request): Promise<PlanBrief> =>
    prepareBrief(deps, await readProfile(request));

  app.use('*', hardenReplies);
  app.get('/api/health', (c) => c.json({ status: 'ok', service: 'saaf-saans', limits: LIMITS }));
  app.post('/api/plan', gate, async (c) => c.json(presentPlan(await brief(c.req.raw))));
  // The brief is rebuilt server-side from the validated profile: the client
  // never gets to tell the model what the air or the numbers are.
  app.post('/api/assistant', gate, async (c) =>
    c.json(await deps.generator.generate(await brief(c.req.raw))),
  );
  app.onError(errorReply(deps.logger));
  app.all('/api/*', (c) => c.json({ error: 'Not found', code: 'not_found' }, 404));
  app.get('*', (c) => deps.assets.fetch(c.req.raw));
  return app;
}
