/**
 * The generative service: asks a language model to word a plan and, when that
 * attempt fails or its reply is rejected, asks a second model once. Models and
 * deadline: config/runtime.ts. One attempt: ./attempt.ts. Rules fallback and
 * caching: ./generators/.
 */
import { MODELS, MODEL_TIMEOUT_MS } from '../../config/runtime';
import type { Logger } from '../../lib/ports';
import { makeNonce } from '../../lib/prompt-guard/fence';
import { type Outcome, attempt } from './attempt';
import { buildPrompt, repairPrompt } from './prompt-builder';
import type { PlanGenerator, TextGenerator } from './types';

/** Why an attempt did not answer, in a few words. */
const describe = (outcome: Exclude<Outcome, { kind: 'answered' }>): string =>
  outcome.kind === 'rejected' ? `reply rejected (${outcome.issues.join(' ')})` : outcome.reason;

/** A PlanGenerator that asks the two models in order; rejects when neither attempt answers. */
export function modelPlanGenerator(
  text: TextGenerator,
  logger: Logger,
  timeoutMs = MODEL_TIMEOUT_MS,
): PlanGenerator {
  const deps = { text, logger, timeoutMs };
  const [firstModel, secondModel] = MODELS;
  return {
    async generate(brief) {
      const prompt = buildPrompt(brief, makeNonce());
      const first = await attempt(deps, { model: firstModel, prompt, brief });
      if (first.kind === 'answered') return first.narrative;
      // A rejected reply is told what was wrong; a call that failed is simply asked again.
      const again = first.kind === 'rejected' ? repairPrompt(prompt, first.issues) : prompt;
      const second = await attempt(deps, { model: secondModel, prompt: again, brief });
      if (second.kind === 'answered') return second.narrative;
      throw new Error(`no model answered: ${describe(first)}; ${describe(second)}`);
    },
  };
}
