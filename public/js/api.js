// @ts-check
/** The two POST endpoints, with a timeout each and failures worded for a person. */

/** @typedef {import('./form.js').Issue} Issue */

/**
 * How long the page waits. The plan route makes at most two upstream calls of
 * 4 s each. The assistant route adds at most two model calls of 15 s each, so
 * it can take 38 s; the page allows 45.
 * @type {Readonly<Record<'/api/plan' | '/api/assistant', number>>}
 */
const TIMEOUT_MS = { '/api/plan': 12_000, '/api/assistant': 45_000 };

/** A request that did not succeed, with the issues to show for it. */
export class ApiError extends Error {
  /** @param {ReadonlyArray<Issue>} issues */
  constructor(issues) {
    super(issues.map((issue) => issue.message).join(' '));
    this.name = 'ApiError';
    this.issues = issues;
  }
}

/**
 * @param {unknown} value
 * @returns {value is Issue}
 */
const isIssue = (value) =>
  typeof value === 'object' &&
  value !== null &&
  'field' in value &&
  typeof value.field === 'string' &&
  'message' in value &&
  typeof value.message === 'string';

/**
 * The issues in an error body, or one general issue when it carries none.
 * @param {number} status
 * @param {unknown} body
 * @returns {Issue[]}
 */
function issuesIn(status, body) {
  const listed =
    typeof body === 'object' && body !== null && 'issues' in body && Array.isArray(body.issues)
      ? body.issues.filter(isIssue)
      : [];
  return listed.length > 0
    ? listed
    : [{ field: 'form', message: `The request failed (${status}). Please try again.` }];
}

/**
 * POST a JSON body and return the parsed reply, unchecked: callers verify its
 * shape with the guards in guards.js before using it.
 * @param {'/api/plan' | '/api/assistant'} path
 * @param {unknown} body
 * @returns {Promise<unknown>}
 */
export async function postJson(path, body) {
  /** @type {Response} */
  let res;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS[path]),
    });
  } catch {
    throw new ApiError([
      {
        field: 'form',
        message: 'Could not reach Saaf Saans. Check your connection and try again.',
      },
    ]);
  }
  /** @type {unknown} */
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(issuesIn(res.status, data));
  return data;
}
