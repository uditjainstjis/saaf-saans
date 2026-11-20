/**
 * One attempt at the generative step: ask one model under the deadline, check
 * its reply, and log which model answered or why it did not. The order of
 * attempts is ./service.ts; the checks are ./reply-checks.ts.
 */
import { MODEL_MAX_TOKENS } from '../../config/runtime';
import type { Logger } from '../../lib/ports';
import { withTimeout } from '../../lib/timeout';
import type { PlanBrief } from '../plan/types';
import { SYSTEM_PROMPT } from './prompt';
import { checkReply } from './reply-checks';
import { NARRATIVE_JSON_SCHEMA } from './schemas';
import type { ModelSource, Narrative } from './types';

/** How an attempt ended: a checked narrative, a reply the checks rejected, or a call that failed. */
export type Outcome =
  | { kind: 'answered'; narrative: Narrative }
  | { kind: 'rejected'; issues: string[] }
  | { kind: 'failed'; reason: string };

/** What every attempt needs: where to log, and the deadline of one call. */
export interface AttemptDeps {
  logger: Logger;
  timeoutMs: number;
}

/** What one attempt asks: which model on which host, with which prompt, about which brief. */
export interface Ask {
  source: ModelSource;
  prompt: string;
  brief: PlanBrief;
}

/** Ask one model once. Never rejects: a call that throws or times out is an outcome like any other. */
export async function attempt(deps: AttemptDeps, { source, prompt, brief }: Ask): Promise<Outcome> {
  const { logger, timeoutMs } = deps;
  const { model, text } = source;
  const request = {
    model,
    system: SYSTEM_PROMPT,
    prompt,
    schema: NARRATIVE_JSON_SCHEMA,
    maxTokens: MODEL_MAX_TOKENS,
  };
  try {
    const reply = await withTimeout((signal) => text.complete(request, signal), timeoutMs);
    const verdict = checkReply(reply, brief);
    if (verdict.ok) {
      logger.info('model_answered', { model });
      return { kind: 'answered', narrative: verdict.narrative };
    }
    logger.warn('model_reply_rejected', { model, issues: verdict.issues });
    return { kind: 'rejected', issues: verdict.issues };
  } catch (err) {
    const reason = String(err);
    logger.warn('model_call_failed', { model, reason });
    return { kind: 'failed', reason };
  }
}
