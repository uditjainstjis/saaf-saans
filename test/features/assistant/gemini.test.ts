/**
 * Tests for the Gemini adapter: the exact request it sends, and what it does
 * with a refusal or a broken connection. That the key reaches no log is
 * ./gemini-key.test.ts.
 */
import { expect, it } from 'vitest';
import { GEMINI_MODEL, GEMINI_THINKING_TOKENS } from '../../../src/config/runtime';
import { GEMINI_URL, gemini } from '../../../src/features/assistant/gemini';
import { NARRATIVE_JSON_SCHEMA } from '../../../src/features/assistant/schemas';
import type { PostInit } from '../../../src/lib/ports';
import { interaction, recordingPost } from '../../support/assistant-fakes';

const KEY = 'test-key';
const signal = new AbortController().signal;
const request = {
  model: GEMINI_MODEL,
  system: 'SYSTEM',
  prompt: 'PROMPT',
  schema: NARRATIVE_JSON_SCHEMA,
  maxTokens: 600,
};
const text = { type: 'string', minLength: 20, maxLength: 500 };
const explanation = {
  type: 'object',
  properties: { id: { type: 'string', maxLength: 60 }, text },
  required: ['id', 'text'],
  additionalProperties: false,
};

/** Run the request through the adapter and return the one call it made. */
async function sent(): Promise<{ url: string; init: PostInit }> {
  const { post, calls } = recordingPost(Response.json(interaction({})));
  await gemini(post, KEY).complete(request, signal);
  const [call] = calls;
  if (!call || calls.length > 1) throw new Error(`expected one call, saw ${calls.length}`);
  return call;
}

it('posts one stateless interaction, in the field names of Google’s reference', async () => {
  const { init } = await sent();
  expect(JSON.parse(init.body)).toEqual({
    model: 'gemini-3.8-flash',
    system_instruction: 'SYSTEM',
    input: 'PROMPT',
    generation_config: { max_output_tokens: 600 + GEMINI_THINKING_TOKENS, thinking_level: 'low' },
    response_format: {
      type: 'text',
      mime_type: 'application/json',
      schema: {
        type: 'object',
        properties: {
          summary: { type: 'string', minLength: 20, maxLength: 600 },
          explanations: { minItems: 1, maxItems: 20, type: 'array', items: explanation },
          encouragement: { type: 'string', minLength: 5, maxLength: 300 },
        },
        required: ['summary', 'explanations', 'encouragement'],
        additionalProperties: false,
      },
    },
    store: false,
  });
});

it('sends the key in a header, never in the URL or the body, and passes the signal on', async () => {
  const { url, init } = await sent();
  expect(url).toBe('https://generativelanguage.googleapis.com/v1/interactions');
  expect(url).toBe(GEMINI_URL);
  expect(init.headers).toEqual({ 'content-type': 'application/json', 'x-goog-api-key': KEY });
  expect(`${url} ${init.body}`).not.toContain(KEY);
  expect(init.signal).toBe(signal);
});

it('resolves with the interaction as Google sent it, for the reply parser to unwrap', async () => {
  const sent = interaction({ summary: 'hello' });
  const { post } = recordingPost(Response.json(sent));
  expect(await gemini(post, KEY).complete(request, signal)).toEqual(sent);
});

it('rejects with the status alone when Google refuses, never with the body', async () => {
  const refusal = new Response(`{"error":{"message":"API key ${KEY} not valid"}}`, { status: 400 });
  const { post } = recordingPost(refusal);
  await expect(gemini(post, KEY).complete(request, signal)).rejects.toThrow(
    /^Gemini answered 400$/,
  );
});

it('removes the key from the reason when the connection itself fails', async () => {
  const { post } = recordingPost(new TypeError(`fetch failed, x-goog-api-key: ${KEY}`));
  await expect(gemini(post, KEY).complete(request, signal)).rejects.toThrow(
    /^Gemini call failed: TypeError: fetch failed, x-goog-api-key: \[key\]$/,
  );
});
