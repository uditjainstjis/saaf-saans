// @ts-check
/**
 * Runtime checks on what the server sent. The page narrows a reply to its
 * type by testing it, never by asserting it.
 */

/** @typedef {import('../../src/features/plan/view').PlanView} PlanView */
/** @typedef {import('../../src/features/assistant/types').Narrative} Narrative */

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
const isObject = (value) => typeof value === 'object' && value !== null;

/**
 * True for a `/api/plan` reply.
 * @param {unknown} data
 * @returns {data is PlanView}
 */
export function isPlanView(data) {
  return (
    isObject(data) &&
    isObject(data.place) &&
    isObject(data.air) &&
    isObject(data.totals) &&
    Array.isArray(data.recommendations) &&
    Array.isArray(data.findings)
  );
}

/**
 * True for a `/api/assistant` reply.
 * @param {unknown} data
 * @returns {data is Narrative}
 */
export function isNarrative(data) {
  return isObject(data) && typeof data.summary === 'string' && isObject(data.explanations);
}
