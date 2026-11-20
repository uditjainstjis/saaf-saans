/**
 * Screening rule: text that tries to give the AI system a new role.
 * The rules are combined in ./index.ts and applied by ../scan.ts.
 */

import type { ScreeningRule } from '../types';

/** Flags text that tries to give the AI system a new role. */
export const roleHijack: ScreeningRule = {
  kind: 'role-hijack',
  detail: 'Text attempting to reassign the AI system’s role.',
  pattern:
    /(?:^|\n)\s*(?:system|assistant|developer)\s*:|\byou are now\b|\bact as (?:a|an|the)\b|\bpretend to be\b/gi,
};
