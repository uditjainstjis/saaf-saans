/**
 * The plan route: POST /api/plan. Validates the profile, then answers with
 * the place, its live air and the deterministic plan. No model is involved,
 * so it answers fast. Mounted by src/app.ts.
 */
import { Hono, type MiddlewareHandler } from 'hono';
import { readValidated } from '../../middleware/validate';
import type { AirSources } from '../air-quality/types';
import { profileSchema } from './schemas';
import { prepareBrief } from './service';
import { presentPlan } from './view';

/** What the plan routes depend on. */
export interface PlanRouteDeps {
  sources: AirSources;
  gate: MiddlewareHandler;
}

/** The routes of the plan feature. */
export function planRoutes({ sources, gate }: PlanRouteDeps): Hono {
  const routes = new Hono();
  routes.post('/plan', gate, async (c) => {
    const profile = await readValidated(c.req.raw, profileSchema);
    return c.json(presentPlan(await prepareBrief(sources, profile)));
  });
  return routes;
}
