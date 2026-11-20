/**
 * Screening rule: text telling an AI system to disregard its instructions.
 * The rules are combined in ./index.ts and applied by ../scan.ts.
 */

import type { ScreeningRule } from '../types';

/** Flags text telling an AI system to disregard its instructions. */
export const instructionOverride: ScreeningRule = {
  kind: 'instruction-override',
  detail: 'Text telling an AI system to disregard its instructions.',
  pattern:
    /\b(?:ignore|disregard|forget|override)\b[^.\n]{0,40}\b(?:previous|prior|above|earlier|all)\b[^.\n]{0,20}\b(?:instructions?|prompts?|rules?|directions?)\b/gi,
};
