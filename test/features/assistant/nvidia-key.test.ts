/**
 * Tests that the NVIDIA key reaches no log line and no error: a failing call
 * is run through a real attempt and a real plan generator, and everything
 * they record is searched for the key.
 */
import { expect, it } from 'vitest';
import { NVIDIA_MODEL } from '../../../src/config/runtime';
import { attempt } from '../../../src/features/assistant/attempt';
import { nvidia } from '../../../src/features/assistant/nvidia';
import { modelPlanGenerator } from '../../../src/features/assistant/service';
import { recordingPost } from '../../support/assistant-fakes';
import { recordingLogger } from '../../support/fakes';
import { briefFor } from '../../support/fixtures';

const KEY = 'test-key';
const brief = briefFor();
/** Failures that carry the key: a transport error that echoes the header, and a refusal that echoes it. */
const failures: [string, Response | Error][] = [
  ['a transport error', new Error(`connect failed (authorization: Bearer ${KEY})`)],
  ['a refusal', new Response(`API key ${KEY} not valid`, { status: 403 })],
];

it.each(failures)('keeps the key out of the logged reason after %s', async (_name, failure) => {
  const logger = recordingLogger();
  const source = { model: NVIDIA_MODEL, text: nvidia(recordingPost(failure).post, KEY) };
  const outcome = await attempt({ logger, timeoutMs: 1000 }, { source, prompt: 'PROMPT', brief });
  expect(outcome.kind).toBe('failed');
  expect(logger.events).toEqual(['model_call_failed']);
  expect(logger.entries[0]?.detail.model).toBe(NVIDIA_MODEL);
  expect(JSON.stringify([outcome, logger.entries])).not.toContain(KEY);
});

it('keeps the key out of the error a plan generator rejects with when both models fail', async () => {
  const logger = recordingLogger();
  const failing = () => ({
    model: NVIDIA_MODEL,
    text: nvidia(recordingPost(new Error(`socket closed, key ${KEY}`)).post, KEY),
  });
  const error: unknown = await modelPlanGenerator([failing(), failing()], logger)
    .generate(brief)
    .catch((err: unknown) => err);
  expect(String(error)).toMatch(/^Error: no model answered: /);
  expect(`${String(error)} ${JSON.stringify(logger.entries)}`).not.toContain(KEY);
});
