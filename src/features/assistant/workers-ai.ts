/**
 * The production TextGenerator: the Workers AI binding. It turns one request
 * into one `run` call on the model the request names and passes the abort
 * signal through. It adds no policy: which model, the deadline, checking and
 * fallback all live in ./service.ts, ./attempt.ts and ./generators/.
 */

import { type Model, MODEL_TEMPERATURE } from '../../config/runtime';
import type { TextGenerator } from './types';

/** As much of the Workers AI binding as this adapter calls. */
export interface AiRunner {
  run(
    model: Model,
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
    complete: ({ model, system, prompt, schema, maxTokens }, signal) =>
      ai.run(
        model,
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
