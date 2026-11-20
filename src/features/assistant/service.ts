/**
 * The generative service: asks a language model to word a plan, checks the
 * reply, and asks once more with the reasons when the first reply is
 * rejected. Checks: ./reply-checks.ts. Fallback and caching: ./generators/.
 */

import { MODEL_MAX_TOKENS, MODEL_TIMEOUT_MS } from '../../config/runtime';
import { makeNonce } from '../../lib/prompt-guard/fence';
import { withTimeout } from '../../lib/timeout';
import type { PlanBrief } from '../plan/types';
import { SYSTEM_PROMPT } from './prompt';
import { buildPrompt, repairPrompt } from './prompt-builder';
import { type Verdict, checkReply } from './reply-checks';
import { NARRATIVE_JSON_SCHEMA } from './schemas';
import type { PlanGenerator, TextGenerator } from './types';

/** A PlanGenerator that asks `text`, with one repair retry; rejects when both replies fail. */
export function modelPlanGenerator(
  text: TextGenerator,
  timeoutMs = MODEL_TIMEOUT_MS,
): PlanGenerator {
  const ask = async (prompt: string, brief: PlanBrief): Promise<Verdict> => {
    const request = {
      system: SYSTEM_PROMPT,
      prompt,
      schema: NARRATIVE_JSON_SCHEMA,
      maxTokens: MODEL_MAX_TOKENS,
    };
    const reply = await withTimeout((signal) => text.complete(request, signal), timeoutMs);
    return checkReply(reply, brief);
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
