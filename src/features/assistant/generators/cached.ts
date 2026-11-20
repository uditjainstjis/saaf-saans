/**
 * The caching decorator for plan generators: narratives are remembered by a
 * hash of the brief they were written from, so a key reveals nothing about a
 * household and one household never reads another's narrative.
 */
import { NARRATIVE_TTL_SECONDS } from '../../../config/runtime';
import { contentKey } from '../../../lib/content-key';
import type { Cache } from '../../../lib/ports';
import { remember } from '../../../lib/remember';
import { narrativeSchema } from '../schemas';
import type { PlanGenerator } from '../types';

/** Narratives cached by the content of the brief they were written from. */
export function cachedPlanGenerator(inner: PlanGenerator, cache: Cache): PlanGenerator {
  return {
    async generate(brief) {
      const key = `narrative/${await contentKey([JSON.stringify(brief)])}`;
      const entry = { key, ttlSeconds: NARRATIVE_TTL_SECONDS, schema: narrativeSchema };
      return remember(cache, entry, () => inner.generate(brief));
    },
  };
}
