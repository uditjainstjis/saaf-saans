/**
 * The stateless admission rules, each checking one thing about a request.
 * They are listed, cheapest first, in src/app.ts and run by ./admission.ts;
 * the rate limit rule is in ./rate-limit.ts.
 */

import { MAX_BODY_BYTES } from '../config/runtime';
import { refuse } from '../lib/app-error';
import type { AdmissionRule } from './admission';

/**
 * The CSRF control. A cross-origin page can send `text/plain` without a
 * preflight, but cannot claim JSON without one, and no CORS policy exists here
 * for a preflight to succeed against.
 */
export const requireJson: AdmissionRule = (request) =>
  Promise.resolve(
    (request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')
      ? undefined
      : refuse(415, 'unsupported_media_type', 'Send this request as application/json.'),
  );

/**
 * Refuses cross-site browser requests. `Sec-Fetch-Site` cannot be forged by
 * page script; it is absent for non-browser clients, which hold no ambient
 * authority here, since the service has no credentials.
 */
export const sameOriginOnly: AdmissionRule = (request) => {
  const site = request.headers.get('sec-fetch-site') ?? 'none';
  return Promise.resolve(
    site === 'same-origin' || site === 'none'
      ? undefined
      : refuse(403, 'cross_origin', 'Cross-site requests are not accepted.'),
  );
};

/** Refuses a body that declares itself larger than the limit, before reading it. */
export const withinSizeLimit: AdmissionRule = (request) =>
  Promise.resolve(
    Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES
      ? refuse(413, 'too_large', 'That request is too large.')
      : undefined,
  );
