/**
 * Tests for the NVIDIA adapter: the exact request it sends, and what it does
 * with a refusal or a broken connection. That the key reaches no log is
 * ./nvidia-key.test.ts.
 */
import { expect, it } from 'vitest';
import { NVIDIA_MODEL } from '../../../src/config/runtime';
import { NVIDIA_URL, nvidia } from '../../../src/features/assistant/nvidia';
import { extractJson } from '../../../src/features/assistant/reply-parser';
import { NARRATIVE_JSON_SCHEMA } from '../../../src/features/assistant/schemas';
import type { PostInit } from '../../../src/lib/ports';
import { completion, recordingPost } from '../../support/assistant-fakes';

const KEY = 'test-key';
const signal = new AbortController().signal;
const request = {
  model: NVIDIA_MODEL,
  system: 'SYSTEM',
  prompt: 'PROMPT',
  schema: NARRATIVE_JSON_SCHEMA,
  maxTokens: 600,
};

/** Run the request through the adapter and return the one call it made. */
async function sent(): Promise<{ url: string; init: PostInit }> {
  const { post, calls } = recordingPost(Response.json(completion({})));
  await nvidia(post, KEY).complete(request, signal);
  const [call] = calls;
  if (!call || calls.length > 1) throw new Error(`expected one call, saw ${calls.length}`);
  return call;
}

it('posts one chat completion: the system and user messages, the budget and the temperature', async () => {
  const { init } = await sent();
  expect(JSON.parse(init.body)).toEqual({
    model: 'nvidia/nemotron-3.5-bolt-e4b',
    messages: [
      { role: 'system', content: 'SYSTEM' },
      { role: 'user', content: 'PROMPT' },
    ],
    max_tokens: 600,
    temperature: 0.3,
  });
});

it('sends the key in the Authorization header, never in the URL or the body, and passes the signal on', async () => {
  const { url, init } = await sent();
  expect(url).toBe('https://integrate.api.nvidia.com/v1/chat/completions');
  expect(url).toBe(NVIDIA_URL);
  expect(init.headers).toEqual({
    'content-type': 'application/json',
    authorization: `Bearer ${KEY}`,
  });
  expect(`${url} ${init.body}`).not.toContain(KEY);
  expect(init.signal).toBe(signal);
});

it('resolves with the completion as NVIDIA sent it, which the reply parser unwraps', async () => {
  const reply = completion({ summary: 'hello' });
  const { post } = recordingPost(Response.json(reply));
  const answer = await nvidia(post, KEY).complete(request, signal);
  expect(answer).toEqual(reply);
  expect(extractJson(answer)).toEqual({ summary: 'hello' });
});

it('rejects with the status alone when NVIDIA refuses, never with the body', async () => {
  const refusal = new Response(`{"detail":"API key ${KEY} not valid"}`, { status: 401 });
  const { post } = recordingPost(refusal);
  await expect(nvidia(post, KEY).complete(request, signal)).rejects.toThrow(
    /^NVIDIA answered 401$/,
  );
});

it('removes the key from the reason when the connection itself fails', async () => {
  const { post } = recordingPost(new TypeError(`fetch failed, authorization: Bearer ${KEY}`));
  await expect(nvidia(post, KEY).complete(request, signal)).rejects.toThrow(
    /^NVIDIA call failed: TypeError: fetch failed, authorization: Bearer \[key\]$/,
  );
});
