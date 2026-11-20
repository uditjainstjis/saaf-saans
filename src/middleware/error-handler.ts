/**
 * Turns anything thrown while handling a request into a reply: a refusal as
 * the page expects it, anything else logged and answered without detail.
 * The refusal type is lib/app-error.ts.
 */
import type { ErrorHandler } from 'hono';
import { RequestError } from '../lib/app-error';
import type { Logger } from '../lib/ports';

/** The application's error handler, reporting unexpected faults to `logger`. */
export const errorReply =
  (logger: Logger): ErrorHandler =>
  (err, c) => {
    if (err instanceof RequestError) {
      return c.json({ error: err.message, code: err.code, issues: err.issues }, err.status);
    }
    logger.warn('unhandled_error', { reason: String(err) });
    return c.json({ error: 'Something went wrong. Please try again.', code: 'internal' }, 500);
  };
