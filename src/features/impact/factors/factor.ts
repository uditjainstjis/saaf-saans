/**
 * Builders for the factor tables: every factor is either `published` (the
 * value is printed in the named source) or an `assumption` (a stated,
 * adjustable modelling choice). The page shows that label beside every number.
 */

import type { Factor } from '../types';

type MakeFactor = (label: string, value: number, unit: string) => Factor;

/** Makes factors whose values are printed in `source`. */
export const published =
  (source: string): MakeFactor =>
  (label, value, unit) => ({ label, value, unit, kind: 'published', source });

/** Makes stated modelling choices, with the reasoning or range they rest on. */
export const assumedFrom =
  (source: string): MakeFactor =>
  (label, value, unit) => ({ label, value, unit, kind: 'assumption', source });

/** A modelling choice with no outside source. */
export const assumed = assumedFrom('Modelling assumption, stated so it can be challenged');
