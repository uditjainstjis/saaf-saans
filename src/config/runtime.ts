/**
 * Runtime settings of the Worker in one place: deadlines, cache lifetimes,
 * request limits and the model asked. Request field bounds shared with the
 * page are in ./limits.ts.
 */

/** The name this service reports in its health check. */
export const SERVICE_NAME = 'saaf-saans';

/** Upper bound on one Open-Meteo call; past it the offline fallback answers. */
export const UPSTREAM_TIMEOUT_MS = 4000;
/** Upper bound on one model call; a call still running after this is abandoned. */
export const MODEL_TIMEOUT_MS = 15_000;

/** The Workers AI model asked: schema-constrained JSON at low latency. */
export const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
/** Enough output for a summary and a dozen short explanations. */
export const MODEL_MAX_TOKENS = 900;
/** Low, so wording stays close to the facts; not zero, so households do not read identical prose. */
export const MODEL_TEMPERATURE = 0.3;

/** Air changes hour by hour; ten minutes keeps a busy neighbourhood to one upstream call. */
export const AIR_TTL_SECONDS = 600;
/** A place does not move; a day keeps popular cities off the geocoder. */
export const PLACE_TTL_SECONDS = 86_400;
/** A narrative stays right for as long as the air report it was written from. */
export const NARRATIVE_TTL_SECONDS = 600;

/** The largest request body accepted. A full profile is under one kilobyte. */
export const MAX_BODY_BYTES = 4096;
