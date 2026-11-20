/**
 * The generative service: asks a language model to word a plan and, when that
 * attempt fails or its reply is rejected, asks a second model once. Which
 * models, on which hosts, is decided by `modelSources`; names and the deadline
 * are in config/runtime.ts. One attempt: ./attempt.ts. Rules fallback and
 * caching: ./generators/.
 */
import { MODELS, MODEL_TIMEOUT_MS, NVIDIA_MODEL } from '../../config/runtime';
import type { Logger } from '../../lib/ports';
import { makeNonce } from '../../lib/prompt-guard/fence';
import { type Outcome, attempt } from './attempt';
import { buildPrompt, repairPrompt } from './prompt-builder';
import type { ModelSource, PlanGenerator, TextGenerator } from './types';

/** The two models to ask, in order. */
export type ModelSources = readonly [ModelSource, ModelSource];

/**
 * With an NVIDIA host, NVIDIA's model first and Workers AI's first model
 * second; without one, Workers AI's two models. Never more than two.
 */
export function modelSources(workersAi: TextGenerator, nvidia?: TextGenerator): ModelSources {
  const [first, second] = MODELS;
  const primary = { model: first, text: workersAi };
  return nvidia
    ? [{ model: NVIDIA_MODEL, text: nvidia }, primary]
    : [primary, { model: second, text: workersAi }];
}

/** Why an attempt did not answer, in a few words. */
const describe = (outcome: Exclude<Outcome, { kind: 'answered' }>): string =>
  outcome.kind === 'rejected' ? `reply rejected (${outcome.issues.join(' ')})` : outcome.reason;

/** A PlanGenerator that asks the two models in order; rejects when neither attempt answers. */
export function modelPlanGenerator(
  [firstSource, secondSource]: ModelSources,
  logger: Logger,
  timeoutMs = MODEL_TIMEOUT_MS,
): PlanGenerator {
  const deps = { logger, timeoutMs };
  return {
    async generate(brief) {
      const prompt = buildPrompt(brief, makeNonce());
      const first = await attempt(deps, { source: firstSource, prompt, brief });
      if (first.kind === 'answered') return first.narrative;
      // A rejected reply is told what was wrong; a call that failed is simply asked again.
      const again = first.kind === 'rejected' ? repairPrompt(prompt, first.issues) : prompt;
      const second = await attempt(deps, { source: secondSource, prompt: again, brief });
      if (second.kind === 'answered') return second.narrative;
      throw new Error(`no model answered: ${describe(first)}; ${describe(second)}`);
    },
  };
}
