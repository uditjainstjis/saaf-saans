/**
 * Screening rule: text telling an AI system to withhold something from the visitor.
 * The rules are combined in ./index.ts and applied by ../scan.ts.
 */

import type { ScreeningRule } from '../types';

/** Flags text telling an AI system to withhold something from the visitor. */
export const suppression: ScreeningRule = {
  kind: 'suppression',
  detail: 'Text instructing an AI system to withhold information from you.',
  pattern:
    /\b(?:do not|don[’']t|never|avoid)\b[^.\n]{0,30}\b(?:mention|disclose|reveal|flag|warn|highlight|tell the (?:user|family|residents))\b/gi,
};
