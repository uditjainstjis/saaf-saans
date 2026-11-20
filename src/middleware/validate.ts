/**
 * Request body validation: reads a JSON body, never past the size limit, and
 * parses it with the schema a route supplies. Every schema issue is reported
 * against its field, so the form can show them all at once. Schemas live in
 * each feature.
 */
import type * as z from 'zod';
import { MAX_BODY_BYTES } from '../config/runtime';
import { refuse, RequestError } from '../lib/app-error';

/** A pass-through for bytes that fails the stream once more than `limit` of them have gone by. */
function byteLimit(limit: number): TransformStream<Uint8Array, Uint8Array> {
  let received = 0;
  return new TransformStream({
    transform(chunk, controller) {
      received += chunk.byteLength;
      if (received > limit)
        controller.error(refuse(413, 'too_large', 'That request is too large.'));
      else controller.enqueue(chunk);
    },
  });
}

/**
 * The body as text, read no further than the limit. A body sent without a
 * `content-length` never meets the header rule in ./admission-rules.ts, so its
 * bytes are counted as they arrive, and passing the limit cancels the stream.
 */
async function readCapped(request: Request): Promise<string> {
  if (!request.body) return '';
  const pieces = request.body
    .pipeThrough(byteLimit(MAX_BODY_BYTES))
    .pipeThrough(new TextDecoderStream());
  let text = '';
  for await (const piece of pieces) text += piece;
  return text;
}

/** JSON.parse, with a refusal a person can act on when the body is not JSON. */
function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw refuse(400, 'bad_json', 'Expected a JSON body.');
  }
}

/** The request body, validated against `schema`; refuses with every issue when it does not match. */
export async function readValidated<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  const parsed = schema.safeParse(parseJson(await readCapped(request)));
  if (parsed.success) return parsed.data;
  const issues = parsed.error.issues.map((issue) => ({
    field: String(issue.path[0] ?? 'form'),
    message: issue.message,
  }));
  throw new RequestError(400, 'invalid_input', issues);
}
