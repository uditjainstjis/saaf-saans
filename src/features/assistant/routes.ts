/**
 * The assistant route: POST /api/assistant, the generative step. The brief is
 * rebuilt server-side from the validated profile, so a client never gets to
 * tell the model what the air or the numbers are. Mounted by src/app.ts.
 */
import { Hono, type MiddlewareHandler } from 'hono';
import { readValidated } from '../../middleware/validate';
import type { AirSources } from '../air-quality/types';
import { profileSchema } from '../plan/schemas';
import { prepareBrief } from '../plan/service';
import type { PlanGenerator } from './types';

/** What the assistant routes depend on. */
export interface AssistantRouteDeps {
  sources: AirSources;
  generator: PlanGenerator;
  gate: MiddlewareHandler;
}

/** The routes of the assistant feature. */
export function assistantRoutes({ sources, generator, gate }: AssistantRouteDeps): Hono {
  const routes = new Hono();
  routes.post('/assistant', gate, async (c) => {
    const profile = await readValidated(c.req.raw, profileSchema);
    return c.json(await generator.generate(await prepareBrief(sources, profile)));
  });
  return routes;
}
