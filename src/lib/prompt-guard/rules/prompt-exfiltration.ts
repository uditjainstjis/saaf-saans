/**
 * Screening rule: text that tries to extract the system prompt.
 * The rules are combined in ./index.ts and applied by ../scan.ts.
 */

import type { ScreeningRule } from '../types';

/** Flags text that tries to extract the system prompt. */
export const promptExfiltration: ScreeningRule = {
  kind: 'prompt-exfiltration',
  detail: 'Text attempting to extract the system’s own instructions.',
  pattern:
    /\b(?:print|reveal|repeat|output|show)\b[^.\n]{0,30}\b(?:system prompts?|your instructions?|initial prompts?)\b/gi,
};
