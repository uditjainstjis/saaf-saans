import type { RateLimiter } from '../ports';
import { refuse, type RequestError } from '../app/errors';

/**
 * Admission rules for POST routes. Each rule checks one thing and returns a
 * refusal or nothing; the gate runs whatever list it is given, in order, so a
 * new rule is a new entry and no existing rule changes.
 */

/** One admission check: a refusal, or undefined to let the request through. */
export type AdmissionRule = (request: Request) => Promise<RequestError | undefined>;

/** The largest request body accepted. A full profile is under one kilobyte. */
export const MAX_BODY_BYTES = 4096;

/**
 * Requiring `application/json` is the CSRF control: a cross-origin page can
 * send `text/plain` without a preflight, but cannot claim JSON without one,
 * and there is no CORS policy here for a preflight to succeed against.
 */
export const requireJson: AdmissionRule = (request) =>
  Promise.resolve(
    (request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')
      ? undefined
      : refuse(415, 'unsupported_media_type', 'Send this request as application/json.'),
  );

/**
 * `Sec-Fetch-Site` is set by browsers and cannot be forged by page script. It
 * is absent for non-browser clients, which is fine: this service holds no
 * credential, so a direct call carries no ambient authority to abuse.
 */
export const sameOriginOnly: AdmissionRule = (request) => {
  const site = request.headers.get('sec-fetch-site') ?? 'none';
  return Promise.resolve(
    site === 'same-origin' || site === 'none'
      ? undefined
      : refuse(403, 'cross_origin', 'Cross-site requests are not accepted.'),
  );
};

/** Refuse a body that declares itself larger than {@link MAX_BODY_BYTES}. */
export const withinSizeLimit: AdmissionRule = (request) =>
  Promise.resolve(
    Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES
      ? refuse(413, 'too_large', 'That request is too large.')
      : undefined,
  );

/** The per-client rate limit, keyed on the connecting address. */
export const withinRateLimit =
  (limiter: RateLimiter): AdmissionRule =>
  async (request) =>
    (await limiter.allow(request.headers.get('cf-connecting-ip') ?? 'local'))
      ? undefined
      : refuse(429, 'rate_limited', 'Too many requests. Please wait a minute and try again.');

/**
 * The rules every POST passes, cheapest first. The rate limit runs last so a
 * rejected cross-site or oversized request never spends the visitor's budget.
 */
export const admissionRules = (limiter: RateLimiter): readonly AdmissionRule[] => [
  requireJson,
  sameOriginOnly,
  withinSizeLimit,
  withinRateLimit(limiter),
];

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
