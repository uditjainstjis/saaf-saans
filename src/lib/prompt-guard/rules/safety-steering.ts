/**
 * Screening rule: text telling an AI system what to say about the air. A
 * question ("tell me if the air is safe") is not steering, so `if` and
 * `whether` pass.
 * The rules are combined in ./index.ts and applied by ../scan.ts.
 */

import type { ScreeningRule } from '../types';

/** Flags text telling an AI system what to say about the air. */
export const safetySteering: ScreeningRule = {
  kind: 'safety-steering',
  detail: 'Text telling an AI system what to say about the air.',
  pattern:
    /\b(?:say|state|tell|report|claim|declare|confirm)\b(?![^.\n]{0,40}\b(?:if|whether)\b)[^.\n]{0,40}\b(?:air|aqi|pollution|smog)\b[^.\n]{0,20}\b(?:is|are)\s+(?:safe|fine|good|clean|healthy|harmless)\b/gi,
};
