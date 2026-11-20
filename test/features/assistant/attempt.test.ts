/**
 * Tests for one attempt at the generative step: the three ways it can end,
 * what it asks the model for, and what it logs each time.
 */
import { expect, it } from 'vitest';
import { MODELS, MODEL_MAX_TOKENS } from '../../../src/config/runtime';
import { type Ask, attempt } from '../../../src/features/assistant/attempt';
import { SYSTEM_PROMPT } from '../../../src/features/assistant/prompt';
import { NARRATIVE_JSON_SCHEMA } from '../../../src/features/assistant/schemas';
import type { TextGenerator } from '../../../src/features/assistant/types';
import { goodReply, scriptedText } from '../../support/assistant-fakes';
import { recordingLogger } from '../../support/fakes';
import { briefFor } from '../../support/fixtures';

const brief = briefFor();
const [model] = MODELS;
/** One ask of the first model, on the host given. */
const askOf = (text: TextGenerator): Ask => ({ source: { model, text }, prompt: 'PROMPT', brief });

it('answers with the checked narrative, and logs which model wrote it', async () => {
  const text = scriptedText({ response: goodReply(brief) });
  const logger = recordingLogger();
  const outcome = await attempt({ logger, timeoutMs: 1000 }, askOf(text));
  expect(outcome).toMatchObject({ kind: 'answered', narrative: { source: 'model' } });
  expect(logger.entries).toEqual([{ level: 'info', event: 'model_answered', detail: { model } }]);
});

it('asks the named model with the standing instructions, the schema and the output budget', async () => {
  const text = scriptedText({ response: goodReply(brief) });
  await attempt({ logger: recordingLogger(), timeoutMs: 1000 }, askOf(text));
  expect(text.requests).toEqual([
    {
      model,
      system: SYSTEM_PROMPT,
      prompt: 'PROMPT',
      schema: NARRATIVE_JSON_SCHEMA,
      maxTokens: MODEL_MAX_TOKENS,
    },
  ]);
  expect(MODEL_MAX_TOKENS).toBe(600);
});

it('reports a reply the checks rejected, with the reasons, and logs them', async () => {
  const text = scriptedText('I cannot help with that.');
  const logger = recordingLogger();
  const outcome = await attempt({ logger, timeoutMs: 1000 }, askOf(text));
  expect(outcome.kind).toBe('rejected');
  expect(logger.events).toEqual(['model_reply_rejected']);
  expect(logger.entries[0]?.detail).toMatchObject({ model, issues: [expect.any(String)] });
});

it('reports a call that throws as failed, with its reason, instead of rejecting', async () => {
  const logger = recordingLogger();
  const text = scriptedText(new Error('AiError 5028: model was deprecated'));
  const outcome = await attempt({ logger, timeoutMs: 1000 }, askOf(text));
  expect(outcome).toEqual({ kind: 'failed', reason: 'Error: AiError 5028: model was deprecated' });
  expect(logger.entries[0]).toMatchObject({ level: 'warn', event: 'model_call_failed' });
  expect(logger.entries[0]?.detail).toEqual({
    model,
    reason: outcome.kind === 'failed' ? outcome.reason : '',
  });
});

it('reports a call still running at the deadline as failed', async () => {
  const hung: TextGenerator = { complete: () => new Promise<never>(() => undefined) };
  const outcome = await attempt({ logger: recordingLogger(), timeoutMs: 5 }, askOf(hung));
  expect(outcome).toEqual({ kind: 'failed', reason: 'TimeoutError: call exceeded 5ms' });
});
