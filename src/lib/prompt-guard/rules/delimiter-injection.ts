/**
 * Screening rule: chat or template control tokens.
 * The rules are combined in ./index.ts and applied by ../scan.ts.
 */

import type { ScreeningRule } from '../types';

/** Flags chat or template control tokens. */
export const delimiterInjection: ScreeningRule = {
  kind: 'delimiter-injection',
  detail: 'Chat or template control tokens embedded in the text.',
  pattern: /<\|(?:im_start|im_end|endoftext|system)\|>|\[\/?INST\]|<\/?(?:system|instructions)>/gi,
};
