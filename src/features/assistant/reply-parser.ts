/**
 * Reads a JSON object out of a model reply, whatever wraps it: the Workers AI
 * envelope, OpenAI-style choices, a fenced code block or surrounding prose.
 * Recovering here avoids discarding a good answer. Checked by ./reply-checks.ts.
 */

/** True for a plain JSON object. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** `choices[0].message.content`, else `choices[0].text`. */
function firstChoice(choices: unknown): unknown {
  const first: unknown = Array.isArray(choices) ? choices[0] : undefined;
  if (!isRecord(first)) return undefined;
  return (isRecord(first.message) ? first.message.content : undefined) ?? first.text;
}

/**
 * Workers AI wraps replies two ways depending on the model: a `response`
 * field, or an OpenAI-style `choices[0].message.content`. Some models return
 * both with `response` empty, so the choices are tried first.
 */
function fromEnvelope(obj: Record<string, unknown>): Record<string, unknown> | null {
  const inner = extractJson(firstChoice(obj.choices));
  if (inner) return inner;
  return 'response' in obj ? extractJson(obj.response) : obj;
}

function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
}

/** JSON.parse, or undefined (which JSON never produces) when the text is not JSON. */
function tryParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** An object parsed from the text, or from its outermost braces when prose surrounds it. */
function parseObject(text: string): Record<string, unknown> | null {
  const whole = tryParse(text);
  if (whole !== undefined) return isRecord(whole) ? whole : null;
  const inner = tryParse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
  return isRecord(inner) ? inner : null;
}

/** The JSON object in a model reply, or null when there is none. */
export function extractJson(raw: unknown): Record<string, unknown> | null {
  if (isRecord(raw)) return fromEnvelope(raw);
  return typeof raw === 'string' ? parseObject(stripFences(raw)) : null;
}
