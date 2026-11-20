/**
 * Applies the response policy of config/security-policy.ts to every reply the
 * Worker sends, and forbids storing API replies. Static assets get the same
 * policy at the edge from public/_headers, generated from the same data.
 */
import type { MiddlewareHandler } from 'hono';
import { SECURITY_HEADERS } from '../config/security-policy';

const NO_STORE = 'no-store, no-cache, must-revalidate, private';

/** The response with the security headers set, body and status untouched. */
export function harden(res: Response): Response {
  const out = new Response(res.body, res);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) out.headers.set(name, value);
  return out;
}

/** Hardens every reply; API replies describe one household's life, so they are never stored. */
export const hardenReplies: MiddlewareHandler = async (c, next) => {
  await next();
  c.res = harden(c.res);
  if (c.req.path.startsWith('/api/')) c.res.headers.set('cache-control', NO_STORE);
};
