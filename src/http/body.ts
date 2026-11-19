import { profileSchema, type Profile } from '../domain/profile';
import { MAX_BODY_BYTES } from './admission';
import { refuse, RequestError } from '../app/errors';

/** JSON.parse, with a refusal a person can act on when the body is not JSON. */
function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw refuse(400, 'bad_json', 'Expected a JSON body.');
  }
}

/**
 * The request body as a validated profile.
 *
 * The size is checked again on the bytes actually read, since a
 * `content-length` header is a claim, not a measurement. Every schema issue
 * is reported, each against its field, so the form can show them all at once.
 */
export async function readProfile(request: Request): Promise<Profile> {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw refuse(413, 'too_large', 'That request is too large.');
  const parsed = profileSchema.safeParse(parseJson(text));
  if (parsed.success) return parsed.data;
  throw new RequestError(
    400,
    'invalid_input',
    parsed.error.issues.map((issue) => ({
      field: String(issue.path[0] ?? 'mode'),
      message: issue.message,
    })),
  );
}
