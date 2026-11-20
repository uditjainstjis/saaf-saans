/**
 * The production TextGenerator: the Workers AI binding. It turns one request
 * into one `run` call and passes the abort signal through. It adds no policy:
 * timeouts, retries, checking and fallback all live in ./service.ts and ./generators/.
 */

import { MODEL, MODEL_TEMPERATURE } from '../../config/runtime';
import type { TextGenerator } from './types';

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

/** A TextGenerator over the Workers AI binding. */
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
          temperature: MODEL_TEMPERATURE,
        },
        { signal },
      ),
  };
}
