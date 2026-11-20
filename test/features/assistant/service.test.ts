/**
 * Tests for the model plan generator: the first model alone when its reply
 * passes; the second model when the first is rejected (told why) or fails
 * (asked the same thing); rejection when neither answers.
 */
import { expect, it } from 'vitest';
import { MODELS } from '../../../src/config/runtime';
import { modelPlanGenerator, modelSources } from '../../../src/features/assistant/service';
import type { TextGenerator } from '../../../src/features/assistant/types';
import { goodReply, scriptedText } from '../../support/assistant-fakes';
import { recordingLogger } from '../../support/fakes';
import { briefFor } from '../../support/fixtures';

const brief = briefFor();
const [firstModel, secondModel] = MODELS;
const good = { response: goodReply(brief) };

it('asks the first model once when its reply passes', async () => {
  const text = scriptedText(good);
  const narrative = await modelPlanGenerator(modelSources(text), recordingLogger()).generate(brief);
  expect(narrative.source).toBe('model');
  expect(text.requests.map((r) => r.model)).toEqual([firstModel]);
  expect(text.requests[0]?.prompt).toMatch(/<<<SAAF_[0-9a-f]{32}\n/);
});

it('asks the second model with the reasons when the first reply is rejected', async () => {
  const bad = { ...goodReply(brief), summary: 'This will add 25 years to your life, truly.' };
  const text = scriptedText({ response: bad }, good);
  const narrative = await modelPlanGenerator(modelSources(text), recordingLogger()).generate(brief);
  expect(narrative.source).toBe('model');
  expect(text.requests.map((r) => r.model)).toEqual([firstModel, secondModel]);
  expect(text.requests[1]?.prompt).toContain('The number 25 is not in the FACTS; remove it.');
});

it('asks the second model the original question when the first call fails', async () => {
  const text = scriptedText(new Error('AiError 5028: model was deprecated'), good);
  const logger = recordingLogger();
  const narrative = await modelPlanGenerator(modelSources(text), logger).generate(brief);
  expect(narrative.source).toBe('model');
  expect(text.requests.map((r) => r.model)).toEqual([firstModel, secondModel]);
  expect(text.requests[1]?.prompt).toBe(text.requests[0]?.prompt);
  expect(text.requests[1]?.prompt).not.toContain('was rejected');
  expect(logger.entries.map((e) => [e.event, e.detail.model])).toEqual([
    ['model_call_failed', firstModel],
    ['model_answered', secondModel],
  ]);
});

it('moves on to the second model when the first is still running at the deadline', async () => {
  const slowFirst: TextGenerator = {
    complete: ({ model }) =>
      model === firstModel ? new Promise<never>(() => undefined) : Promise.resolve(good),
  };
  const narrative = await modelPlanGenerator(
    modelSources(slowFirst),
    recordingLogger(),
    5,
  ).generate(brief);
  expect(narrative.source).toBe('model');
});

it('rejects when neither model answers, saying why each failed, and never asks a third time', async () => {
  const text = scriptedText('nonsense', new Error('binding down'), good);
  const generator = modelPlanGenerator(modelSources(text), recordingLogger());
  await expect(generator.generate(brief)).rejects.toThrow(
    /^no model answered: reply rejected \(.+\); Error: binding down$/,
  );
  expect(text.requests).toHaveLength(2);
});

it('rejects when the second reply is rejected too', async () => {
  const text = scriptedText(new Error('binding down'), 'more nonsense');
  const generator = modelPlanGenerator(modelSources(text), recordingLogger());
  await expect(generator.generate(brief)).rejects.toThrow(/Error: binding down; reply rejected \(/);
});
