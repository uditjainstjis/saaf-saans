/**
 * The screening rules, in one list. A new kind of injection is a new file in
 * this folder and one entry here; the scanner in ../scan.ts does not change.
 */

import type { ScreeningRule } from '../types';
import { delimiterInjection } from './delimiter-injection';
import { hiddenCharacters } from './hidden-characters';
import { instructionOverride } from './instruction-override';
import { promptExfiltration } from './prompt-exfiltration';
import { roleHijack } from './role-hijack';
import { safetySteering } from './safety-steering';
import { suppression } from './suppression';

/** Every rule the injection screen applies. */
export const SCREENING_RULES: readonly ScreeningRule[] = [
  instructionOverride,
  roleHijack,
  safetySteering,
  suppression,
  promptExfiltration,
  delimiterInjection,
  hiddenCharacters,
];
