/**
 * The Gemini TextGenerator: Google's Interactions API over HTTPS, used only
 * when a key is configured. One request is one stateless call (`store: false`,
 * so Google keeps no copy for later retrieval). The key travels in a header:
 * never in the URL, a log line or an error. Field names follow Google's
 * reference, recorded in docs/decisions.md (record 11). The reply's envelope
 * is unwrapped by ./reply-parser.ts.
 */
import { GEMINI_THINKING_TOKENS } from '../../config/runtime';
import type { HttpPost } from '../../lib/ports';
import type { TextGenerator, TextRequest } from './types';

/** The stable (v1) endpoint that creates one interaction. */
export const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1/interactions';

/** A JSON Schema without `$schema`, which is not among the keywords Gemini documents. */
const withoutDialect = (schema: object): object =>
  Object.fromEntries(Object.entries(schema).filter(([keyword]) => keyword !== '$schema'));

/** One request as the body of `POST /v1/interactions`. No sampling parameters: this model ignores them. */
export function geminiBody({ model, system, prompt, schema, maxTokens }: TextRequest): object {
  return {
    model,
    system_instruction: system,
    input: prompt,
    generation_config: {
      // The cap counts thought tokens, so the reply's budget needs room on top; `low` is this model's least.
      max_output_tokens: maxTokens + GEMINI_THINKING_TOKENS,
      thinking_level: 'low',
    },
    response_format: {
      type: 'text',
      mime_type: 'application/json',
      schema: withoutDialect(schema),
    },
    store: false,
  };
}

/** A TextGenerator over Gemini. Rejects with the HTTP status, or the transport error with the key removed. */
export function gemini(post: HttpPost, apiKey: string): TextGenerator {
  const headers = { 'content-type': 'application/json', 'x-goog-api-key': apiKey };
  return {
    async complete(request, signal) {
      const body = JSON.stringify(geminiBody(request));
      const reply = await post(GEMINI_URL, { headers, body, signal }).catch((err: unknown) => {
        throw new Error(`Gemini call failed: ${String(err).replaceAll(apiKey, '[key]')}`);
      });
      // The status alone: an error body is Google's text and is never repeated to a log or a client.
      if (!reply.ok) throw new Error(`Gemini answered ${reply.status}`);
      return reply.json();
    },
  };
}
