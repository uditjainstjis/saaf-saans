/**
 * The NVIDIA TextGenerator: NVIDIA's hosted, OpenAI-compatible chat completions
 * API over HTTPS, used only when a key is configured. The key travels in the
 * Authorization header: never in the URL, a log line or an error. The reply is
 * an OpenAI-style envelope, unwrapped by ./reply-parser.ts. See
 * docs/decisions.md, record 11.
 */
import { MODEL_TEMPERATURE } from '../../config/runtime';
import type { HttpPost } from '../../lib/ports';
import type { TextGenerator, TextRequest } from './types';

/** The endpoint that answers one chat completion. */
export const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

/** One request as the body of `POST /v1/chat/completions`. The JSON shape is asked for in the prompt. */
export function nvidiaBody({ model, system, prompt, maxTokens }: TextRequest): object {
  return {
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: prompt },
    ],
    max_tokens: maxTokens,
    temperature: MODEL_TEMPERATURE,
  };
}

/** A TextGenerator over NVIDIA's API. Rejects with the HTTP status, or the transport error with the key removed. */
export function nvidia(post: HttpPost, apiKey: string): TextGenerator {
  const headers = { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` };
  return {
    async complete(request, signal) {
      const body = JSON.stringify(nvidiaBody(request));
      const reply = await post(NVIDIA_URL, { headers, body, signal }).catch((err: unknown) => {
        throw new Error(`NVIDIA call failed: ${String(err).replaceAll(apiKey, '[key]')}`);
      });
      // The status alone: an error body is NVIDIA's text and is never repeated to a log or a client.
      if (!reply.ok) throw new Error(`NVIDIA answered ${reply.status}`);
      return reply.json();
    },
  };
}
