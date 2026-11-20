import { bandFor } from '../air-quality/aqi';
import { impactSentence } from '../impact/sentence';
import { contentKey } from '../../lib/cache';
import { remember } from '../../lib/remember';
import { withTimeout } from '../../lib/timeout';
import type {
  Cache,
  Logger,
  Narrative,
  PlanBrief,
  PlanGenerator,
  TextGenerator,
} from '../../lib/ports';
import { makeNonce } from '../../lib/prompt-guard';
import { formatNumber as n } from '../../config/constants';
import { checkReply, NARRATIVE_JSON_SCHEMA, narrativeSchema, type Verdict } from './schemas';
import { buildPrompt, repairPrompt, SYSTEM_PROMPT } from './prompt';

/**
 * The plan generators: three implementations of one port, and a decorator.
 *
 *  - {@link modelPlanGenerator} asks a language model, checks the reply, and
 *    asks once more with the reasons when the first reply is rejected.
 *  - {@link rulePlanGenerator} writes the same narrative from rules alone.
 *  - {@link fallbackPlanGenerator} is the first, backed by the second.
 *  - {@link cachedPlanGenerator} remembers what any of them wrote.
 *
 * Each honours the PlanGenerator contract in full, so they substitute for one
 * another anywhere; the composition root decides how they stack.
 */

/** Upper bound on one model call; a call still running after this is abandoned. */
export const MODEL_TIMEOUT_MS = 15_000;
/** Enough for a summary and ten short explanations. */
const MAX_TOKENS = 900;
/** A narrative stays right for as long as the air report it was written from. */
const NARRATIVE_TTL_SECONDS = 600;

/** A generator that asks `text`, with one repair retry. Rejects when both replies fail the checks. */
export function modelPlanGenerator(
  text: TextGenerator,
  timeoutMs = MODEL_TIMEOUT_MS,
): PlanGenerator {
  const ask = async (prompt: string, brief: PlanBrief): Promise<Verdict> => {
    const request = {
      system: SYSTEM_PROMPT,
      prompt,
      schema: NARRATIVE_JSON_SCHEMA,
      maxTokens: MAX_TOKENS,
    };
    return checkReply(
      await withTimeout((signal) => text.complete(request, signal), timeoutMs),
      brief,
    );
  };
  return {
    async generate(brief) {
      const prompt = buildPrompt(brief, makeNonce());
      const first = await ask(prompt, brief);
      if (first.ok) return first.narrative;
      const second = await ask(repairPrompt(prompt, first.issues), brief);
      if (second.ok) return second.narrative;
      throw new Error(`model reply rejected twice: ${second.issues.join(' ')}`);
    },
  };
}

/** The deterministic generator: the same narrative shape, written from the plan by rule. */
export const rulePlanGenerator: PlanGenerator = {
  generate({ place, air, plan, advisory }) {
    const fresh = plan.recommendations.filter((r) => r.status === 'new').length;
    const narrative: Narrative = {
      source: 'rules',
      summary: `Air in ${place.name} is ${bandFor(air.aqi).label.toLowerCase()} right now, with a US AQI of ${n(air.aqi)}. ${advisory} The ${n(fresh)} changes below would keep everyone in the plan from breathing in about ${n(plan.totals.inhaledAvoidedUg)} µg of PM2.5 a day, and save about ${n(plan.totals.co2eSavedKg)} kg CO2e a week.`,
      explanations: Object.fromEntries(plan.recommendations.map((r) => [r.id, impactSentence(r)])),
      encouragement:
        'Start with the one step that is easiest today; clean air adds up breath by breath.',
    };
    return Promise.resolve(narrative);
  },
};

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

/** Narratives cached by the content of the brief they were written from. */
export function cachedPlanGenerator(inner: PlanGenerator, cache: Cache): PlanGenerator {
  return {
    async generate(brief) {
      const key = `narrative/${await contentKey([JSON.stringify(brief)])}`;
      return remember(
        cache,
        { key, ttlSeconds: NARRATIVE_TTL_SECONDS, schema: narrativeSchema },
        () => inner.generate(brief),
      );
    },
  };
}
