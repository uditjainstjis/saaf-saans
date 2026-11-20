/**
 * Request body validation: reads a JSON body under the size limit and parses
 * it with the schema a route supplies. Every schema issue is reported against
 * its field, so the form can show them all at once. Schemas live in each feature.
 */
import type { z } from 'zod';
import { MAX_BODY_BYTES } from '../config/runtime';
import { refuse, RequestError } from '../lib/app-error';

/** JSON.parse, with a refusal a person can act on when the body is not JSON. */
function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw refuse(400, 'bad_json', 'Expected a JSON body.');
  }
}

/** The request body, validated. The size is re-checked on the bytes read, not the header's claim. */
export async function readValidated<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw refuse(413, 'too_large', 'That request is too large.');
  const parsed = schema.safeParse(parseJson(text));
  if (parsed.success) return parsed.data;
  const issues = parsed.error.issues.map((issue) => ({
    field: String(issue.path[0] ?? 'form'),
    message: issue.message,
  }));
  throw new RequestError(400, 'invalid_input', issues);
}
