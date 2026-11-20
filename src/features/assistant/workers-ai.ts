import type { TextGenerator } from '../../lib/ports';

/** The model asked. Chosen for schema-constrained JSON output at low latency on Workers AI. */
export const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

/** As much of the Workers AI binding as this adapter calls. */
export interface AiRunner {
  run(
    model: typeof MODEL,
    input: {
      messages: { role: 'system' | 'user'; content: string }[];
      response_format: { type: 'json_schema'; json_schema: object };
      max_tokens: number;
      temperature: number;
    },
    options: { signal: AbortSignal },
  ): Promise<unknown>;
}

/**
 * The production {@link TextGenerator}: the Workers AI binding.
 *
 * It translates one request into one `run` call and passes the abort signal
 * through, so a call given up on is cancelled. It adds no policy: timeouts,
 * retries, checking and fallback all live in src/features/assistant/service.ts.
 */
export function workersAi(ai: AiRunner): TextGenerator {
  return {
    complete: ({ system, prompt, schema, maxTokens }, signal) =>
      ai.run(
        MODEL,
        {
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_schema', json_schema: schema },
          max_tokens: maxTokens,
          // Low, so wording stays close to the facts; not zero, so two households do not read identical prose.
          temperature: 0.3,
        },
        { signal },
      ),
  };
}
