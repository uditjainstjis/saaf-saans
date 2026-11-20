/**
 * The strategy contract: the unit of extension. A strategy looks at a
 * situation and either has advice for it or does not. The planner runs
 * whatever list it is given, so new advice is a new file here and one entry
 * in ./registry.ts.
 */

import type { Category } from '../../../config/options';
import type { FactorId } from '../../impact/factors';
import { round1 } from '../../impact/service';
import type { Impact } from '../../impact/types';
import type { Recommendation, Situation } from '../types';

/** What a strategy returns: a recommendation without the identity its strategy supplies. */
export interface Advice extends Omit<Recommendation, 'id' | 'category' | 'factorIds'> {
  factorIds: readonly FactorId[];
}

/** One way of improving a household's or a group's air. */
export interface Strategy {
  readonly id: string;
  readonly category: Category;
  /** Advice for this situation, or null when the strategy does not apply to it. */
  advise(situation: Situation): Advice | null;
}

/** An impact with every figure rounded for reporting; unnamed figures are zero. */
export function impact(parts: Partial<Impact>): Impact {
  return {
    inhaledAvoidedUg: round1(parts.inhaledAvoidedUg ?? 0),
    notEmittedG: round1(parts.notEmittedG ?? 0),
    co2eSavedKg: round1(parts.co2eSavedKg ?? 0),
  };
}

/** "your household" or "your group": who a sentence is addressed to. */
export const audience = ({ profile }: Situation): string =>
  profile.mode === 'family' ? 'your household' : 'your group';
