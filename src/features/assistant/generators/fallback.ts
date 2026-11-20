/**
 * The fallback decorator for plan generators: the primary, and when it
 * rejects, the backup. Composed in src/index.ts as model first, rules behind.
 */

import type { Logger } from '../../../lib/ports';
import type { PlanGenerator } from '../types';

/** `primary`, and when it rejects, `backup`: the assistant always answers. */
export function fallbackPlanGenerator(
  primary: PlanGenerator,
  backup: PlanGenerator,
  logger: Logger,
): PlanGenerator {
  return {
    generate: (brief) =>
      primary.generate(brief).catch((err: unknown) => {
        logger.warn('plan_generator_failed', { reason: String(err) });
        return backup.generate(brief);
      }),
  };
}
