/**
 * Tests for the order of models: Workers AI's two when there is no NVIDIA
 * host, NVIDIA then Workers AI's first when there is one, and never a third.
 */
import { expect, it } from 'vitest';
import { MODELS, NVIDIA_MODEL } from '../../../src/config/runtime';
import { modelPlanGenerator, modelSources } from '../../../src/features/assistant/service';
import { completion, goodReply, scriptedText } from '../../support/assistant-fakes';
import { recordingLogger } from '../../support/fakes';
import { briefFor } from '../../support/fixtures';

const brief = briefFor();
const [mistral, llama] = MODELS;

it('asks Workers AI’s two models, in order, when no NVIDIA host is given', () => {
  const workersAi = scriptedText();
  expect(modelSources(workersAi)).toEqual([
    { model: mistral, text: workersAi },
    { model: llama, text: workersAi },
  ]);
  expect(mistral).toBe('@cf/mistralai/mistral-small-3.1-24b-instruct');
  expect(llama).toBe('@cf/meta/llama-3.3-70b-instruct-fp8-fast');
});

it('asks NVIDIA first and Workers AI’s first model second when an NVIDIA host is given', () => {
  const workersAi = scriptedText();
  const hosted = scriptedText();
  expect(modelSources(workersAi, hosted)).toEqual([
    { model: NVIDIA_MODEL, text: hosted },
    { model: mistral, text: workersAi },
  ]);
  expect(NVIDIA_MODEL).toBe('nvidia/nemotron-3.5-bolt-e4b');
});

it('lets NVIDIA answer alone when its reply passes the same checks', async () => {
  const workersAi = scriptedText();
  const hosted = scriptedText(completion(goodReply(brief)));
  const logger = recordingLogger();
  const generator = modelPlanGenerator(modelSources(workersAi, hosted), logger);
  expect((await generator.generate(brief)).source).toBe('model');
  expect(hosted.requests.map((r) => r.model)).toEqual([NVIDIA_MODEL]);
  expect(workersAi.requests).toEqual([]);
  expect(logger.entries).toEqual([
    { level: 'info', event: 'model_answered', detail: { model: NVIDIA_MODEL } },
  ]);
});

it('asks Workers AI once, and never its second model, when NVIDIA fails or is rejected', async () => {
  const replies = [new Error('NVIDIA answered 503'), completion({ summary: 'too short' })];
  for (const reply of replies) {
    const workersAi = scriptedText({ response: goodReply(brief) });
    const logger = recordingLogger();
    const generator = modelPlanGenerator(modelSources(workersAi, scriptedText(reply)), logger);
    expect((await generator.generate(brief)).source).toBe('model');
    expect(workersAi.requests.map((r) => r.model)).toEqual([mistral]);
    expect(logger.entries.at(-1)?.detail).toEqual({ model: mistral });
  }
});

it('falls through to the caller, after two calls, when NVIDIA and Workers AI both fail', async () => {
  const workersAi = scriptedText(new Error('binding down'), { response: goodReply(brief) });
  const hosted = scriptedText(new Error('NVIDIA answered 429'));
  const generator = modelPlanGenerator(modelSources(workersAi, hosted), recordingLogger());
  await expect(generator.generate(brief)).rejects.toThrow(
    /^no model answered: Error: NVIDIA answered 429; Error: binding down$/,
  );
  expect(hosted.requests.length + workersAi.requests.length).toBe(2);
});
