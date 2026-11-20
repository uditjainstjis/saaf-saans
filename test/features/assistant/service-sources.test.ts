/**
 * Tests for the order of models: Workers AI's two when there is no Gemini
 * host, Gemini then Workers AI's first when there is one, and never a third.
 */
import { expect, it } from 'vitest';
import { GEMINI_MODEL, MODELS } from '../../../src/config/runtime';
import { modelPlanGenerator, modelSources } from '../../../src/features/assistant/service';
import { goodReply, interaction, scriptedText } from '../../support/assistant-fakes';
import { recordingLogger } from '../../support/fakes';
import { briefFor } from '../../support/fixtures';

const brief = briefFor();
const [mistral, llama] = MODELS;

it('asks Workers AI’s two models, in order, when no Gemini host is given', () => {
  const workersAi = scriptedText();
  expect(modelSources(workersAi)).toEqual([
    { model: mistral, text: workersAi },
    { model: llama, text: workersAi },
  ]);
  expect(mistral).toBe('@cf/mistralai/mistral-small-3.1-24b-instruct');
  expect(llama).toBe('@cf/meta/llama-3.3-70b-instruct-fp8-fast');
});

it('asks Gemini first and Workers AI’s first model second when a Gemini host is given', () => {
  const workersAi = scriptedText();
  const google = scriptedText();
  expect(modelSources(workersAi, google)).toEqual([
    { model: GEMINI_MODEL, text: google },
    { model: mistral, text: workersAi },
  ]);
  expect(GEMINI_MODEL).toBe('gemini-3.8-flash');
});

it('lets Gemini answer alone when its reply passes the same checks', async () => {
  const workersAi = scriptedText();
  const google = scriptedText(interaction(goodReply(brief)));
  const logger = recordingLogger();
  const generator = modelPlanGenerator(modelSources(workersAi, google), logger);
  expect((await generator.generate(brief)).source).toBe('model');
  expect(google.requests.map((r) => r.model)).toEqual([GEMINI_MODEL]);
  expect(workersAi.requests).toEqual([]);
  expect(logger.entries).toEqual([
    { level: 'info', event: 'model_answered', detail: { model: GEMINI_MODEL } },
  ]);
});

it('asks Workers AI once, and never its second model, when Gemini fails or is rejected', async () => {
  const replies = [new Error('Gemini answered 503'), interaction({ summary: 'too short' })];
  for (const reply of replies) {
    const workersAi = scriptedText({ response: goodReply(brief) });
    const logger = recordingLogger();
    const generator = modelPlanGenerator(modelSources(workersAi, scriptedText(reply)), logger);
    expect((await generator.generate(brief)).source).toBe('model');
    expect(workersAi.requests.map((r) => r.model)).toEqual([mistral]);
    expect(logger.entries.at(-1)?.detail).toEqual({ model: mistral });
  }
});

it('falls through to the caller, after two calls, when Gemini and Workers AI both fail', async () => {
  const workersAi = scriptedText(new Error('binding down'), { response: goodReply(brief) });
  const google = scriptedText(new Error('Gemini answered 429'));
  const generator = modelPlanGenerator(modelSources(workersAi, google), recordingLogger());
  await expect(generator.generate(brief)).rejects.toThrow(
    /^no model answered: Error: Gemini answered 429; Error: binding down$/,
  );
  expect(google.requests.length + workersAi.requests.length).toBe(2);
});
