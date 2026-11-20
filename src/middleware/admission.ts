/**
 * The admission gate for POST routes: runs a list of rules in order and
 * refuses on the first that objects. The gate is closed to change; a new
 * check is a new rule in ./admission-rules.ts or ./rate-limit.ts.
 */
import type { MiddlewareHandler } from 'hono';
import { RequestError } from '../lib/app-error';

/** One admission check: a refusal, or undefined to let the request through. */
export type AdmissionRule = (request: Request) => Promise<RequestError | undefined>;

/** The first refusal among `rules`, or undefined when the request is admitted. */
export async function admit(
  request: Request,
  rules: readonly AdmissionRule[],
): Promise<RequestError | undefined> {
  for (const rule of rules) {
    const refusal = await rule(request);
    if (refusal) return refusal;
  }
  return undefined;
}

/** Middleware that lets a request reach its route only when every rule admits it. */
export const admissionGate =
  (rules: readonly AdmissionRule[]): MiddlewareHandler =>
  async (c, next) => {
    const refusal = await admit(c.req.raw, rules);
    if (refusal) throw refusal;
    await next();
  };
