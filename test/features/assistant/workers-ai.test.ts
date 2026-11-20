/**
 * Tests for the Workers AI adapter: one request becomes one run call on the
 * model the request names.
 */
import { expect, it } from 'vitest';
import { MODELS } from '../../../src/config/runtime';
import { workersAi } from '../../../src/features/assistant/workers-ai';

it('turns one request into one run call, passing the model, the schema and the abort signal', async () => {
  const calls: unknown[][] = [];
  const generator = workersAi({
    run: async (...args) => {
      calls.push(args);
      return { response: '{}' };
    },
  });
  const signal = new AbortController().signal;
  const [, model] = MODELS;
  const request = { model, system: 'S', prompt: 'P', schema: { type: 'object' }, maxTokens: 50 };
  expect(await generator.complete(request, signal)).toEqual({ response: '{}' });
  expect(calls).toEqual([
    [
      model,
      {
        messages: [
          { role: 'system', content: 'S' },
          { role: 'user', content: 'P' },
        ],
        response_format: { type: 'json_schema', json_schema: { type: 'object' } },
        max_tokens: 50,
        temperature: 0.3,
      },
      { signal },
    ],
  ]);
});
