/**
 * Screening rule: runs of invisible characters, which hide text from human
 * readers. Two or more in a row, since a lone joiner is ordinary in Indic text.
 * The rules are combined in ./index.ts and applied by ../scan.ts.
 */

import { INVISIBLE } from '../invisible';
import type { ScreeningRule } from '../types';

/** Flags runs of invisible characters. */
export const hiddenCharacters: ScreeningRule = {
  kind: 'hidden-characters',
  detail: 'Invisible characters, commonly used to conceal text from human readers.',
  pattern: new RegExp(`${INVISIBLE}{2,}`, 'g'),
};
