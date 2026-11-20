/**
 * Tests for the model plan generator: one ask when the reply passes, one
 * repair when it does not, rejection after that, and the timeout.
 */
import { expect, it } from 'vitest';
import { SYSTEM_PROMPT } from '../../../src/features/assistant/prompt';
import { NARRATIVE_JSON_SCHEMA } from '../../../src/features/assistant/schemas';
import { modelPlanGenerator } from '../../../src/features/assistant/service';
import type { TextGenerator } from '../../../src/features/assistant/types';
import { goodReply, scriptedText } from '../../support/assistant-fakes';
import { briefFor } from '../../support/fixtures';

const brief = briefFor();

it('asks once when the first reply passes, with the system prompt and the schema', async () => {
  const text = scriptedText({ response: goodReply(brief) });
  const narrative = await modelPlanGenerator(text).generate(brief);
  expect(narrative.source).toBe('model');
  expect(text.requests).toHaveLength(1);
  expect(text.requests[0]?.system).toBe(SYSTEM_PROMPT);
  expect(text.requests[0]?.schema).toBe(NARRATIVE_JSON_SCHEMA);
  expect(text.requests[0]?.prompt).toMatch(/<<<SAAF_[0-9a-f]{32}\n/);
});

it('repairs once: the retry carries the reasons the first reply was rejected', async () => {
  const bad = { ...goodReply(brief), summary: 'This will add 25 years to your life, truly.' };
  const text = scriptedText({ response: bad }, { response: goodReply(brief) });
  const narrative = await modelPlanGenerator(text).generate(brief);
  expect(narrative.source).toBe('model');
  expect(text.requests).toHaveLength(2);
  expect(text.requests[1]?.prompt).toContain('The number 25 is not in the FACTS; remove it.');
});

it('rejects when the repair is rejected too, and never asks a third time', async () => {
  const text = scriptedText('nonsense', 'more nonsense', { response: goodReply(brief) });
  await expect(modelPlanGenerator(text).generate(brief)).rejects.toThrow('rejected twice');
  expect(text.requests).toHaveLength(2);
});

it('rejects when the model host fails or hangs past the timeout', async () => {
  await expect(
    modelPlanGenerator(scriptedText(new Error('binding down'))).generate(brief),
  ).rejects.toThrow('binding down');
  const hung: TextGenerator = { complete: () => new Promise<never>(() => undefined) };
  await expect(modelPlanGenerator(hung, 5).generate(brief)).rejects.toThrow('exceeded 5ms');
});
